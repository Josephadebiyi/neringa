import cron from 'node-cron';
import { query as pgQuery } from '../lib/postgres/db.js';
import {
  sendBusinessGracePeriodReminderEmail,
  sendBusinessAccountRestrictedEmail,
} from '../services/emailNotifications.js';
import { GRACE_PERIOD_DAYS } from '../services/businessRestrictionService.js';

const REMINDER_WINDOW_DAYS = 3;

// Restriction is always enforced live from timestamps (see
// services/businessRestrictionService.js) — this job only sends the
// one-time reminder/restricted emails and keeps business_status in sync
// for admin visibility. Nothing security-relevant depends on it running
// exactly on schedule.
export const runBusinessGracePeriodJob = async () => {
  console.log('⏰ Running business grace period job...');
  try {
    const reminders = await pgQuery(
      `SELECT id, email, first_name, last_name, trading_name, company_name
       FROM public.profiles
       WHERE account_type = 'company'
         AND business_status <> 'verified'
         AND business_grace_period_started_at IS NOT NULL
         AND business_grace_reminder_sent_at IS NULL
         AND business_grace_period_started_at + INTERVAL '${GRACE_PERIOD_DAYS} days'
             <= NOW() + INTERVAL '${REMINDER_WINDOW_DAYS} days'
         AND business_grace_period_started_at + INTERVAL '${GRACE_PERIOD_DAYS} days' > NOW()`,
      [],
    );
    for (const row of reminders.rows || reminders) {
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ');
      const businessName = row.trading_name || row.company_name;
      const daysLeft = REMINDER_WINDOW_DAYS;
      sendBusinessGracePeriodReminderEmail(row.email, name, businessName, daysLeft)
        .catch((err) => console.error('Grace period reminder email failed:', err.message));
      await pgQuery(
        `UPDATE public.profiles SET business_grace_reminder_sent_at = NOW() WHERE id = $1`,
        [row.id],
      );
    }

    const expired = await pgQuery(
      `SELECT id, email, first_name, last_name, trading_name, company_name
       FROM public.profiles
       WHERE account_type = 'company'
         AND business_status <> 'verified'
         AND business_grace_period_started_at IS NOT NULL
         AND business_restricted_notified_at IS NULL
         AND business_grace_period_started_at + INTERVAL '${GRACE_PERIOD_DAYS} days' <= NOW()`,
      [],
    );
    for (const row of expired.rows || expired) {
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ');
      const businessName = row.trading_name || row.company_name;
      sendBusinessAccountRestrictedEmail(row.email, name, businessName)
        .catch((err) => console.error('Business restricted email failed:', err.message));
      await pgQuery(
        `UPDATE public.profiles
         SET business_status = 'restricted', business_restricted_notified_at = NOW()
         WHERE id = $1`,
        [row.id],
      );
    }

    console.log(`⏰ Business grace period job done: ${reminders.rows?.length || 0} reminders, ${expired.rows?.length || 0} newly restricted.`);
  } catch (error) {
    console.error('Business grace period job failed:', error);
  }
};

export const startBusinessGracePeriodCron = () => {
  // Run once a day
  cron.schedule('0 6 * * *', runBusinessGracePeriodJob);
};
