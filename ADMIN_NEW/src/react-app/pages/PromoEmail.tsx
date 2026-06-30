import React, { useState, useMemo, useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Send, Users, ShieldCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { ProductLaunchEmail, NewsletterEmail, PromoEmailTemplate } from '../emails/BagoEmailTemplates';
import { productLaunchDefault, newsletterDefault, promoDefault } from '../emails/bagoEmailContent';
import { sendPromoEmail } from '../services/api';

// ── Content helpers ───────────────────────────────────────────────────────────

function setIn(obj: any, path: (string | number)[], val: any): any {
  if (!path.length) return val;
  const [head, ...rest] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  clone[head as any] = setIn(obj[head], rest, val);
  return clone;
}

function humanize(k: string | number) {
  return String(k)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function wrapHtml(body: string, subject: string, preheader: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <title>${subject.replace(/[&<>"]/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c))}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: #E9E7E0; -webkit-font-smoothing: antialiased; }
    img { -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media (max-width: 620px) { .bago-wrap { padding: 16px !important; } }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
  <div class="bago-wrap" style="padding:32px 16px;background:#E9E7E0;">${body}</div>
</body>
</html>`;
}

// ── Field editor components ───────────────────────────────────────────────────

const SKIP_KEYS = new Set(['brand', 'logo', 'footer', 'footerLinks']);

interface FieldsProps {
  value: any;
  path: (string | number)[];
  onChange: (path: (string | number)[], val: any) => void;
}

function Fields({ value, path, onChange }: FieldsProps) {
  if (Array.isArray(value)) {
    return (
      <>
        {value.map((item, i) => (
          <div key={i} style={{ border: '1px solid #F0EEE8', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9A9EA8', marginBottom: 8 }}>
              {humanize(path[path.length - 1])} #{i + 1}
            </div>
            <Fields value={item} path={[...path, i]} onChange={onChange} />
          </div>
        ))}
      </>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <>
        {Object.entries(value).map(([k, v]) => {
          if (SKIP_KEYS.has(k)) return null;
          return <Fields key={k} value={v} path={[...path, k]} onChange={onChange} />;
        })}
      </>
    );
  }

  const label = path[path.length - 1];
  const isImg = /image|logo|hero/i.test(String(label));
  const isUrl = /url/i.test(String(label)) && !isImg;
  const long = String(value).length > 60;

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {humanize(label)}
      </span>
      {isImg ? (
        <ImageField value={value as string} onChange={(v) => onChange(path, v)} />
      ) : long ? (
        <textarea
          value={value as string}
          rows={3}
          onChange={(e) => onChange(path, e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C4BFD]/20 focus:border-[#5C4BFD] resize-none"
        />
      ) : (
        <input
          value={value as string}
          type={isUrl ? 'url' : 'text'}
          onChange={(e) => onChange(path, e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C4BFD]/20 focus:border-[#5C4BFD]"
        />
      )}
    </label>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… (hosted image URL)"
        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C4BFD]/20 focus:border-[#5C4BFD]"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {value && (
          <img
            src={value}
            alt=""
            style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <label className="text-xs font-semibold text-[#5C4BFD] cursor-pointer hover:underline">
          Upload…
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => onChange(r.result as string);
              r.readAsDataURL(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}

// ── Template config ───────────────────────────────────────────────────────────

const TEMPLATES = {
  productLaunch: {
    label: 'Product launch',
    Component: ProductLaunchEmail,
    default: productLaunchDefault,
    subject: (c: any) => c.heading || 'Bago update',
  },
  newsletter: {
    label: 'Newsletter',
    Component: NewsletterEmail,
    default: newsletterDefault,
    subject: (c: any) => c.issueTitle || 'The Bago Brief',
  },
  promo: {
    label: 'Send & Earn promo',
    Component: PromoEmailTemplate,
    default: promoDefault,
    subject: (c: any) => [c.offerHeading?.[0], c.offerHeading?.[1]].filter(Boolean).join(' ') || 'Special offer from Bago',
  },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PromoEmail() {
  const [active, setActive] = useState<TemplateKey>('productLaunch');
  const [data, setData] = useState({
    productLaunch: productLaunchDefault,
    newsletter: newsletterDefault,
    promo: promoDefault,
  });
  const [targetGroup, setTargetGroup] = useState<'all' | 'verified' | 'unverified'>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { Component, subject: getSubject } = TEMPLATES[active];
  const content = data[active];

  const onChange = useCallback((path: (string | number)[], val: any) => {
    setData((d) => ({ ...d, [active]: setIn(d[active], path.slice(1), val) }));
  }, [active]);

  const resetTemplate = () => {
    setData((d) => ({ ...d, [active]: TEMPLATES[active].default }));
  };

  const handleSend = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const preheader = (content as any).preheader || (content as any).intro || (content as any).offerSub || '';
      const bodyMarkup = renderToStaticMarkup(
        React.createElement(Component as any, { content })
      );
      const html = wrapHtml(bodyMarkup, getSubject(content), preheader);

      const result = await sendPromoEmail({
        subject: getSubject(content),
        html,
        targetGroup,
      });

      if (result?.success) {
        setMessage({ type: 'success', text: `Dispatched successfully!` });
      } else {
        throw new Error(result?.message || 'Failed to send');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-112px)] -m-6 overflow-hidden">

      {/* ── Left: editor panel ─────────────────────────────────────── */}
      <aside className="w-[380px] flex-none flex flex-col bg-white border-r border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex-none px-5 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Promo Engine</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Edit, preview and dispatch email broadcasts</p>

          {/* Template selector */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => (
              <button
                key={key}
                onClick={() => { setActive(key); setMessage(null); }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  active === key
                    ? 'bg-[#5C4BFD] border-[#5C4BFD] text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {TEMPLATES[key].label}
              </button>
            ))}
            <button
              onClick={resetTemplate}
              title="Reset to defaults"
              className="ml-auto p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Fields value={content} path={[active]} onChange={onChange} />
        </div>

        {/* Bottom: audience + send */}
        <div className="flex-none px-5 py-4 border-t border-gray-100 space-y-3">
          {message && (
            <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {message.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Audience</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'all', label: 'All Users', Icon: Users },
                { id: 'verified', label: 'Verified', Icon: ShieldCheck },
                { id: 'unverified', label: 'Unverified', Icon: ShieldAlert },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTargetGroup(id)}
                  className={`flex flex-col items-center py-2.5 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight gap-1.5 transition-all ${
                    targetGroup === id
                      ? 'border-[#5C4BFD] bg-[#5C4BFD]/5 text-[#5C4BFD]'
                      : 'border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full py-3.5 bg-[#5C4BFD] hover:bg-[#4B3CE8] disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5C4BFD]/25"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Dispatch</>}
          </button>
        </div>
      </aside>

      {/* ── Right: live email preview ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-[#E9E7E0]">
        {/* Fake browser chrome */}
        <div className="sticky top-0 z-10 bg-[#2A2D35] px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-[#1C1F26] rounded-md px-3 py-1 text-[11px] text-gray-400 font-mono text-center truncate">
            {TEMPLATES[active].label} · {getSubject(content)}
          </div>
        </div>

        <div className="p-8">
          <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
            {active === 'productLaunch' && <ProductLaunchEmail content={data.productLaunch} />}
            {active === 'newsletter' && <NewsletterEmail content={data.newsletter} />}
            {active === 'promo' && <PromoEmailTemplate content={data.promo} />}
          </div>
        </div>
      </main>
    </div>
  );
}
