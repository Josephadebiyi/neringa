import cron from 'node-cron';
import { query as pgQuery } from '../lib/postgres/db.js';
import { sendPushNotification } from '../services/pushNotificationService.js';
import { sendBirthdayEmail } from '../services/emailNotifications.js';

// Same "has passed KYC" definition as middleware/kycMiddleware.js.
const KYC_PASSED_STATUSES = ['approved', 'verified', 'completed'];

async function ensureBirthdayGreetingColumn() {
  await pgQuery(`
    alter table public.profiles
      add column if not exists last_birthday_greeted_year integer
  `);
}

export const runBirthdayGreetings = async () => {
  console.log('🎂 Running birthday greetings job...');
  try {
    await ensureBirthdayGreetingColumn();

    const result = await pgQuery(
      `
        select id, email, first_name, last_name
        from public.profiles
        where kyc_status = any($1)
          and date_of_birth is not null
          and extract(month from date_of_birth) = extract(month from (now() at time zone 'utc'))
          and extract(day from date_of_birth) = extract(day from (now() at time zone 'utc'))
          and (
            last_birthday_greeted_year is null
            or last_birthday_greeted_year <> extract(year from (now() at time zone 'utc'))::int
          )
      `,
      [KYC_PASSED_STATUSES],
    );

    const rows = result.rows || result;
    if (!rows.length) {
      console.log('🎂 No birthdays today.');
      return;
    }

    for (const user of rows) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
      try {
        await sendPushNotification(
          user.id,
          '🎂 Happy Birthday!',
          `Happy Birthday, ${user.first_name || 'there'}! Wishing you a great day from all of us at Bago.`,
        );
      } catch (error) {
        console.error(`Birthday push failed for user ${user.id}:`, error.message);
      }

      if (user.email) {
        await sendBirthdayEmail(user.email, fullName).catch((error) => {
          console.error(`Birthday email failed for user ${user.id}:`, error.message);
        });
      }

      // Mark as greeted for this year regardless of individual send outcomes above —
      // avoids retrying/duplicating on transient provider errors within the same day.
      await pgQuery(
        `update public.profiles set last_birthday_greeted_year = extract(year from (now() at time zone 'utc'))::int where id = $1`,
        [user.id],
      ).catch((error) => {
        console.error(`Failed to mark birthday greeted for user ${user.id}:`, error.message);
      });

      console.log(`🎂 Birthday greeting sent to ${user.id}`);
    }

    console.log(`✅ Birthday greetings job finished — ${rows.length} user(s) greeted.`);
  } catch (error) {
    console.error('❌ Birthday greetings job failed:', error);
  }
};

export const startBirthdayGreetings = () => {
  // Once a day at 09:00 UTC — a reasonable local-morning hour across Bago's
  // supported markets without needing per-user timezone data.
  cron.schedule('0 9 * * *', runBirthdayGreetings);
};
