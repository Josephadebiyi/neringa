import { resend } from '../server.js';

/**
 * Email Notification Service for Shipping Status Changes
 * Sends professional HTML emails using Resend
 */

const BAGO_LOGO = 'https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sendwithbago.com';

/**
 * Send welcome email after user signup
 */
export async function sendWelcomeEmail(userEmail, userName, signupMethod = 'email') {
  if (!resend) {
    console.warn('⚠️ Email service not configured');
    return false;
  }

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${userName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Welcome to <strong>Bago</strong>! 🎉 We're thrilled to have you join our community-powered shipping platform.
      </p>
      <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:24px 0; border-left:4px solid #5240E8;">
        <p style="margin:0 0 12px; font-size:14px; color:#111827; font-weight:600;">What's Next?</p>
        <ul style="margin:0; padding-left:20px; font-size:14px; color:#374151; line-height:1.8;">
          <li>Complete your profile and KYC verification</li>
          <li>Browse available travelers for your shipping needs</li>
          <li>Post your travel plans and earn by delivering packages</li>
          <li>Join our secure escrow-protected marketplace</li>
        </ul>
      </div>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        ${signupMethod === 'google' ? 'You signed up using Google. ' : ''}Your account is ready to use!
      </p>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        If you have any questions, our support team is here to help.
      </p>
    `;

    await resend.emails.send({
      from: 'Bago <no-reply@sendwithbago.com>',
      to: userEmail,
      subject: '🎉 Welcome to Bago - Your Journey Starts Here!',
      html: generateEmailTemplate('Welcome to Bago!', content, 'Get Started', `${FRONTEND_URL}/dashboard`),
    });

    console.log(`✅ Sent welcome email to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send email when user account is banned/restricted
 */
export async function sendAccountBannedEmail(userEmail, userName, reason = 'policy violation') {
  if (!resend) return false;

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${userName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        We regret to inform you that your Bago account has been temporarily restricted.
      </p>
      <div style="background:#fef2f2; padding:20px; border-radius:8px; margin:24px 0; border-left:4px solid #ef4444;">
        <p style="margin:0 0 12px; font-size:14px; color:#991b1b; font-weight:600;">Reason for Restriction</p>
        <p style="margin:0; font-size:14px; color:#374151;">${reason}</p>
      </div>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        During this period, you won't be able to:
      </p>
      <ul style="margin:0 0 18px; padding-left:20px; font-size:14px; color:#374151; line-height:1.8;">
        <li>Create new shipping requests</li>
        <li>Post new trips</li>
        <li>Access marketplace features</li>
      </ul>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        If you believe this is a mistake, please contact our support team immediately. We're here to help resolve any issues.
      </p>
    `;

    await resend.emails.send({
      from: 'Bago Security <no-reply@sendwithbago.com>',
      to: userEmail,
      subject: '⚠️ Your Bago Account Has Been Restricted',
      html: generateEmailTemplate('Account Restricted', content, 'Contact Support', `${FRONTEND_URL}/support`),
    });

    console.log(`✅ Sent account banned email to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send account banned email:', error);
    return false;
  }
}

/**
 * Send email when user account is unblocked
 */
export async function sendAccountUnblockedEmail(userEmail, userName) {
  if (!resend) return false;

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${userName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Great news! Your Bago account has been successfully reactivated. 🎉
      </p>
      <div style="background:#ecfdf5; padding:20px; border-radius:8px; margin:24px 0; border-left:4px solid #10b981;">
        <p style="margin:0 0 12px; font-size:14px; color:#065f46; font-weight:600;">Your Account is Now Active</p>
        <p style="margin:0; font-size:14px; color:#374151;">You now have full access to all Bago features and can resume your activities.</p>
      </div>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        You can now:
      </p>
      <ul style="margin:0 0 18px; padding-left:20px; font-size:14px; color:#374151; line-height:1.8;">
        <li>Send and receive packages</li>
        <li>Post travel trips</li>
        <li>Access your wallet and transactions</li>
        <li>Use all marketplace features</li>
      </ul>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Thank you for your patience. We're excited to have you back!
      </p>
    `;

    await resend.emails.send({
      from: 'Bago <no-reply@sendwithbago.com>',
      to: userEmail,
      subject: '✅ Your Bago Account is Active Again!',
      html: generateEmailTemplate('Account Reactivated', content, 'Go to Dashboard', `${FRONTEND_URL}/dashboard`),
    });

    console.log(`✅ Sent account unblocked email to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send account unblocked email:', error);
    return false;
  }
}

/**
 * Send notification to receiver when shipping starts
 */
export async function sendReceiverShippingStartedEmail(receiverEmail, receiverName, senderName, packageDetails, trackingNumber) {
  if (!resend) return false;

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${receiverName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        <strong>${senderName}</strong> is sending you a package via Bago! 📦
      </p>
      <div style="background:#f0f9ff; padding:20px; border-radius:8px; margin:24px 0; border-left:4px solid #3b82f6;">
        <p style="margin:0 0 12px; font-size:14px; color:#1e40af; font-weight:600;">Package Details</p>
        <p style="margin:0 0 8px; font-size:14px; color:#374151;">${packageDetails}</p>
        <p style="margin:0; font-size:13px; color:#6b7280;">Tracking: <strong style="color:#3b82f6;">${trackingNumber}</strong></p>
      </div>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        The package is currently in transit. You'll receive updates as it progresses toward delivery.
      </p>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Please ensure you're available to receive the package upon arrival.
      </p>
    `;

    await resend.emails.send({
      from: 'Bago Shipping <no-reply@sendwithbago.com>',
      to: receiverEmail,
      subject: `📦 Package On The Way - ${trackingNumber}`,
      html: generateEmailTemplate('Package En Route to You', content, 'Track Package', `${FRONTEND_URL}/tracking/${trackingNumber}`),
    });

    console.log(`✅ Sent receiver notification email to ${receiverEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send receiver notification email:', error);
    return false;
  }
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate(title, content, ctaText = null, ctaLink = null) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bago — ${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%; background-color:#f3f4f6; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.06); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 28px; text-align:center; background:linear-gradient(90deg,#5240E8 0%, #6B5CFF 100%);">
              <a href="${FRONTEND_URL}" target="_blank" style="text-decoration:none; display:inline-block;">
                <img src="${BAGO_LOGO}" alt="Bago" width="140" style="display:block; border:0;"/>
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px; font-family:Arial, sans-serif; font-size:22px; color:#111827; font-weight:700;">${title}</h1>
              ${content}
              ${ctaText && ctaLink ? `
              <div style="margin:28px 0; text-align:center;">
                <a href="${ctaLink}" style="display:inline-block; padding:14px 32px; background:#5240E8; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
                  ${ctaText}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px; background:#fbfbfe; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#9ca3af;">
              <div style="max-width:520px; margin:0 auto;">
                <div style="margin-bottom:6px;">Need help? Visit our <a href="${FRONTEND_URL}/help" style="color:#5240E8; text-decoration:none;">Help Center</a>.</div>
                <div style="margin-top:8px;">© ${new Date().getFullYear()} Bago. All rights reserved.</div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send email notification for request accepted
 */
export async function sendRequestAcceptedEmail(senderEmail, senderName, travelerName, packageDetails, trackingNumber) {
  if (!resend) {
    console.warn('⚠️ Email service not configured');
    return false;
  }

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${senderName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Great news! Your shipping request has been accepted by <strong>${travelerName}</strong>.
      </p>
      <div style="background:#f9fafb; padding:16px; border-radius:8px; margin:20px 0; border-left:4px solid #5240E8;">
        <p style="margin:0 0 8px; font-size:13px; color:#6b7280; font-weight:600;">PACKAGE DETAILS</p>
        <p style="margin:0; font-size:14px; color:#111827;">${packageDetails}</p>
        ${trackingNumber ? `<p style="margin:8px 0 0; font-size:13px; color:#6b7280;">Tracking: <strong style="color:#5240E8;">${trackingNumber}</strong></p>` : ''}
      </div>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        You can now communicate with your traveler and track your shipment in real-time.
      </p>
    `;

    await resend.emails.send({
      from: 'Bago Shipping <no-reply@sendwithbago.com>',
      to: senderEmail,
      subject: `✅ Your Shipping Request Has Been Accepted!`,
      html: generateEmailTemplate('Request Accepted', content, 'Track Shipment', `${FRONTEND_URL}/tracking/${trackingNumber || ''}`),
    });

    console.log(`✅ Sent request accepted email to ${senderEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send request accepted email:', error);
    return false;
  }
}

/**
 * Send email notification for in-transit status
 */
export async function sendInTransitEmail(senderEmail, senderName, packageDetails, location, trackingNumber) {
  if (!resend) return false;

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${senderName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Your package is now in transit! 🚀
      </p>
      <div style="background:#f0f9ff; padding:16px; border-radius:8px; margin:20px 0; border-left:4px solid #3b82f6;">
        <p style="margin:0 0 8px; font-size:13px; color:#1e40af; font-weight:600;">📦 SHIPMENT UPDATE</p>
        <p style="margin:0; font-size:14px; color:#111827;">${packageDetails}</p>
        ${location ? `<p style="margin:8px 0 0; font-size:13px; color:#6b7280;">Current Location: <strong>${location}</strong></p>` : ''}
        <p style="margin:8px 0 0; font-size:13px; color:#6b7280;">Tracking: <strong style="color:#3b82f6;">${trackingNumber}</strong></p>
      </div>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Your traveler has started the journey. You'll receive updates as your package progresses.
      </p>
    `;

    await resend.emails.send({
      from: 'Bago Shipping <no-reply@sendwithbago.com>',
      to: senderEmail,
      subject: `🚀 Your Package is In Transit - ${trackingNumber}`,
      html: generateEmailTemplate('Package In Transit', content, 'Track Shipment', `${FRONTEND_URL}/tracking/${trackingNumber}`),
    });

    console.log(`✅ Sent in-transit email to ${senderEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send in-transit email:', error);
    return false;
  }
}

/**
 * Send email notification for out for delivery status
 */
export async function sendOutForDeliveryEmail(senderEmail, senderName, packageDetails, location, trackingNumber) {
  if (!resend) return false;

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${senderName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Exciting news! Your package is out for delivery! 📬
      </p>
      <div style="background:#fef3c7; padding:16px; border-radius:8px; margin:20px 0; border-left:4px solid #f59e0b;">
        <p style="margin:0 0 8px; font-size:13px; color:#92400e; font-weight:600;">📬 DELIVERY IN PROGRESS</p>
        <p style="margin:0; font-size:14px; color:#111827;">${packageDetails}</p>
        ${location ? `<p style="margin:8px 0 0; font-size:13px; color:#6b7280;">Delivery Location: <strong>${location}</strong></p>` : ''}
        <p style="margin:8px 0 0; font-size:13px; color:#6b7280;">Tracking: <strong style="color:#f59e0b;">${trackingNumber}</strong></p>
      </div>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Your traveler is on the way to deliver your package. Make sure your recipient is available!
      </p>
    `;

    await resend.emails.send({
      from: 'Bago Shipping <no-reply@sendwithbago.com>',
      to: senderEmail,
      subject: `📬 Out for Delivery - ${trackingNumber}`,
      html: generateEmailTemplate('Out for Delivery', content, 'Track Shipment', `${FRONTEND_URL}/tracking/${trackingNumber}`),
    });

    console.log(`✅ Sent out-for-delivery email to ${senderEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send out-for-delivery email:', error);
    return false;
  }
}

/**
 * Send email notification for delivery completed
 */
export async function sendDeliveryCompletedEmail(senderEmail, senderName, packageDetails, trackingNumber) {
  if (!resend) return false;

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${senderName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        🎉 Great news! Your package has been successfully delivered!
      </p>
      <div style="background:#ecfdf5; padding:16px; border-radius:8px; margin:20px 0; border-left:4px solid #10b981;">
        <p style="margin:0 0 8px; font-size:13px; color:#065f46; font-weight:600;">✅ DELIVERY COMPLETED</p>
        <p style="margin:0; font-size:14px; color:#111827;">${packageDetails}</p>
        <p style="margin:8px 0 0; font-size:13px; color:#6b7280;">Tracking: <strong style="color:#10b981;">${trackingNumber}</strong></p>
      </div>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Please confirm receipt in the app to release payment to your traveler. If there are any issues, you can raise a dispute within 48 hours.
      </p>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:13px; color:#6b7280; line-height:1.6;">
        Thank you for using Bago! We hope to serve you again soon.
      </p>
    `;

    await resend.emails.send({
      from: 'Bago Shipping <no-reply@sendwithbago.com>',
      to: senderEmail,
      subject: `🎉 Package Delivered Successfully - ${trackingNumber}`,
      html: generateEmailTemplate('Delivery Completed', content, 'Confirm Receipt', `${FRONTEND_URL}/dashboard`),
    });

    console.log(`✅ Sent delivery completed email to ${senderEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send delivery completed email:', error);
    return false;
  }
}

/**
 * Send email notification for request rejected
 */
export async function sendRequestRejectedEmail(senderEmail, senderName, travelerName, packageDetails) {
  if (!resend) return false;

  try {
    const content = `
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Hi <strong style="color:#111827;">${senderName}</strong>,
      </p>
      <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Unfortunately, your shipping request was not accepted by <strong>${travelerName}</strong>.
      </p>
      <div style="background:#fef2f2; padding:16px; border-radius:8px; margin:20px 0; border-left:4px solid #ef4444;">
        <p style="margin:0 0 8px; font-size:13px; color:#991b1b; font-weight:600;">PACKAGE DETAILS</p>
        <p style="margin:0; font-size:14px; color:#111827;">${packageDetails}</p>
      </div>
      <p style="margin:0; font-family:Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
        Don't worry! You can browse other available travelers and send your request to someone else.
      </p>
    `;

    await resend.emails.send({
      from: 'Bago Shipping <no-reply@sendwithbago.com>',
      to: senderEmail,
      subject: `Shipping Request Update`,
      html: generateEmailTemplate('Request Not Accepted', content, 'Find Other Travelers', `${FRONTEND_URL}/search`),
    });

    console.log(`✅ Sent request rejected email to ${senderEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send request rejected email:', error);
    return false;
  }
}

/**
 * Main function to send status update email
 */
export async function sendShippingStatusEmail(request, status, location = null) {
  try {
    if (!request.sender?.email) {
      console.warn('⚠️ No sender email found');
      return false;
    }

    const senderEmail = request.sender.email;
    const senderName = request.sender.name || request.sender.firstName || 'User';
    const travelerName = request.traveler?.name || request.traveler?.firstName || 'Traveler';
    const packageDetails = request.package?.description || 'Your package';
    const trackingNumber = request.trackingNumber || 'N/A';

    switch (status) {
      case 'accepted':
        return await sendRequestAcceptedEmail(senderEmail, senderName, travelerName, packageDetails, trackingNumber);

      case 'intransit':
        return await sendInTransitEmail(senderEmail, senderName, packageDetails, location, trackingNumber);

      case 'delivering':
        return await sendOutForDeliveryEmail(senderEmail, senderName, packageDetails, location, trackingNumber);

      case 'completed':
        return await sendDeliveryCompletedEmail(senderEmail, senderName, packageDetails, trackingNumber);

      case 'rejected':
        return await sendRequestRejectedEmail(senderEmail, senderName, travelerName, packageDetails);

      default:
        console.log(`ℹ️ No email template for status: ${status}`);
        return false;
    }
  } catch (error) {
    console.error('❌ Failed to send shipping status email:', error);
    return false;
  }
}
