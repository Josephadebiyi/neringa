import { query } from '../../lib/postgres/db.js';
import { resend } from '../../server.js';

export const sendPromoEmail = async (req, res, next) => {
  const { subject, body, targetGroup, images, fileAttachments } = req.body;

  try {
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Subject and body are required' });
    }

    let whereClause = '';
    if (targetGroup === 'verified') whereClause = `WHERE kyc_status = 'approved'`;
    else if (targetGroup === 'unverified') whereClause = `WHERE kyc_status != 'approved'`;

    const result = await query(
      `SELECT email, first_name as "firstName", last_name as "lastName" FROM public.profiles ${whereClause}`
    );
    const emails = result.rows.map(u => u.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found for this category' });
    }

    if (!resend) {
      return res.status(503).json({ success: false, message: 'Email service not configured' });
    }

    let bodyImagesHtml = '';
    if (images && Array.isArray(images)) {
      images.slice(0, 2).forEach(img => {
        bodyImagesHtml += `<div style="margin-top:25px;text-align:center;"><img src="${img}" style="max-width:100%;border-radius:16px;display:block;margin:0 auto;" /></div>`;
      });
    }

    const resendAttachments = [];
    if (fileAttachments && Array.isArray(fileAttachments)) {
      fileAttachments.forEach(file => {
        if (file.url.startsWith('data:')) {
          const matches = file.url.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            resendAttachments.push({ filename: file.name, content: Buffer.from(matches[2], 'base64') });
          }
        }
      });
    }

    const htmlTemplate = `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;background:#f8fafc;margin:0;padding:0;}
      .container{max-width:600px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);}
      .header{background:linear-gradient(90deg,#5240E8 0%,#3B28C9 100%);padding:30px;text-align:center;}
      .content{padding:40px;}.footer{padding:20px;text-align:center;font-size:12px;color:#64748b;background:#f1f5f9;}
      .promo-text{font-size:16px;color:#334155;white-space:pre-wrap;}
      .btn{display:inline-block;padding:16px 32px;background:#5240E8;color:white!important;text-decoration:none;border-radius:14px;font-weight:bold;margin-top:30px;}
    </style></head><body><div class="container">
      <div class="header"><img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" alt="Bago" width="120" /></div>
      <div class="content"><div class="promo-text">${body}</div>${bodyImagesHtml}
        <div style="text-align:center;"><a href="https://sendwithbago.com" class="btn">Explore Bago</a></div>
      </div>
      <div class="footer">&copy; ${new Date().getFullYear()} Bago Logistics. All rights reserved.<br/>You received this email because you are a registered user of Bago.</div>
    </div></body></html>`;

    const { data, error } = await resend.emails.send({
      from: 'Bago <updates@sendwithbago.com>',
      to: 'Bago Users <updates@sendwithbago.com>',
      bcc: emails,
      subject,
      html: htmlTemplate,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to send emails', error });
    }

    res.status(200).json({ success: true, message: `Successfully dispatched to ${emails.length} users`, data });
  } catch (err) {
    next(err);
  }
};
