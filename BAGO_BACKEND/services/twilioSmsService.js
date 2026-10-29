import twilio from 'twilio';

// Omitting From lets Twilio select an eligible sender from the service pool.
// Keep direct-sender support until the Messaging Service is configured.
export function getTwilioClient() {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim();
  const fromNumber = (process.env.TWILIO_FROM_NUMBER || '').trim();
  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) return null;

  return {
    client: twilio(accountSid, authToken),
    senderOptions: messagingServiceSid ? { messagingServiceSid } : { from: fromNumber },
  };
}
