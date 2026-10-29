import { mkdir, writeFile } from 'node:fs/promises';
import { businessContact as contact, refundPolicy as policy } from '../src/config/publicPolicies.js';

const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const contactLinks = `<a href="mailto:${escape(contact.email)}">${escape(contact.email)}</a>${contact.phones.map(phone => `<a href="${escape(phone.href)}">${escape(phone.label)}</a>`).join('')}`;
const render = (path, title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)} | Bago</title><meta name="description" content="${escape(title)} for BAGO PLATFORM. Contact details, refund eligibility and how to request help with a Bago shipment.">
<link rel="canonical" href="${contact.website}/${path}/"><style>
*{box-sizing:border-box}body{margin:0;background:#f8f6f3;color:#012126;font:16px/1.75 system-ui,-apple-system,sans-serif}a{color:#5845d8;overflow-wrap:anywhere}nav,footer{background:white;padding:24px max(24px,calc((100vw - 1000px)/2));border-bottom:1px solid #eee}nav{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}nav img{height:36px}nav div{display:flex;gap:24px}main{max-width:900px;padding:48px 24px;margin:auto}h1{font-size:clamp(28px,5vw,40px);line-height:1.2}h2{font-size:20px;margin-top:32px}article{background:white;padding:clamp(24px,5vw,48px);border-radius:24px;border:1px solid #eee}small,dt{color:#666}.merchant{color:#5845d8;font-weight:700}dd{margin:4px 0 20px}footer p,footer a{margin-right:20px}footer .contacts{display:flex;flex-wrap:wrap;gap:12px}
</style></head><body><nav><a href="/" aria-label="Bago home"><img src="/bago_logo.png" alt="Bago"></a><div><a href="/contact/">Contact us</a><a href="/refund-policy/">Refund policy</a></div></nav>
<main><p class="merchant">${escape(contact.name)}</p><h1>${escape(title)}</h1><article>${body}</article></main>
<footer><strong>${escape(contact.name)}</strong><div class="contacts">${contactLinks}</div><p><a href="/refund-policy/">Refund and Cancellation Policy</a><a href="/contact/">Contact us</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></p></footer></body></html>`;

const refundBody = `<small>Last updated: ${escape(policy.updated)}</small><p>${escape(policy.introduction)}</p>${policy.sections.map(section => `<section><h2>${escape(section.title)}</h2>${section.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}</section>`).join('')}<p><a href="/contact/">View contact details</a></p>`;
const contactBody = `<p>For booking help, payment enquiries, refunds or disputes, contact BAGO PLATFORM using the details below. No sign-in is required to email or call us.</p><dl><dt>Business / merchant name</dt><dd><strong>${escape(contact.name)}</strong></dd><dt>Email</dt><dd><a href="mailto:${contact.email}">${contact.email}</a></dd><dt>Telephone</dt><dd>${contact.phones.map(phone => `<a href="${phone.href}">${escape(phone.label)}</a>`).join('<br>')}</dd><dt>Website</dt><dd><a href="${contact.website}">${contact.website}</a></dd></dl><p>Include your booking or tracking number and payment reference. Never send your full card details, passwords or one-time codes.</p><p><a href="/refund-policy/">Read our Refund and Cancellation Policy</a></p>`;
for (const [path, title, body] of [['refund-policy', policy.title, refundBody], ['contact', 'Contact us', contactBody]]) {
    const directory = new URL(`../public/${path}/`, import.meta.url);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('index.html', directory), render(path, title, body));
}
console.log('Generated public refund and contact pages (no JavaScript or login required).');
