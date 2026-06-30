import React from 'react';
import type { ProductLaunchContent, NewsletterContent, PromoContent } from './bagoEmailContent';

const FONT = "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const DISPLAY = `'Bricolage Grotesque', ${FONT}`;
const INK = '#14161B';
const MUTE = '#5B5F69';
const FAINT = '#9A9EA8';

function tint(hex: string, amt: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

const card: React.CSSProperties = {
  width: 600, maxWidth: '100%', background: '#FFFFFF', borderRadius: 22,
  overflow: 'hidden', border: '1px solid #EAE7DF', margin: '0 auto', fontFamily: FONT,
};

function Logo({ src, height = 26, invert = false }: { src: string; height?: number; invert?: boolean }) {
  return (
    <img src={src} alt="Bago" height={height}
      style={{ height, width: 'auto', display: 'block', border: 0, ...(invert ? { filter: 'brightness(0) invert(1)' } : {}) }} />
  );
}

function Button({ href, children, brand, big }: { href: string; children: React.ReactNode; brand: string; big?: boolean }) {
  return (
    <a href={href} style={{
      display: 'inline-block', background: brand, color: '#FFFFFF', fontWeight: 600,
      fontSize: big ? 16 : 15, padding: big ? '16px 34px' : '15px 26px',
      borderRadius: 12, textDecoration: 'none', fontFamily: FONT,
    }}>{children}</a>
  );
}

function FooterBlock({ footer, links, legal }: { footer: any; links?: { text: string; url: string }[]; legal?: string }) {
  return (
    <div style={{ padding: '28px 32px 30px', background: '#FAF9F6', borderTop: '1px solid #F0EEE8' }}>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: '#6A6E78', margin: '0 0 14px', maxWidth: 360 }}>{footer.tagline}</p>
      {links && (
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, fontWeight: 500,
          paddingBottom: 14, borderBottom: '1px solid #ECEAE3', marginBottom: 14 }}>
          {links.map((l: any, i: number) => <a key={i} href={l.url} style={{ color: INK, textDecoration: 'none' }}>{l.text}</a>)}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: FAINT }}>{footer.social}</span>
        <span style={{ fontSize: 12, color: FAINT }}>{footer.address}</span>
      </div>
      <p style={{ fontSize: 12, color: '#B2B6BE', margin: '14px 0 0' }}>
        {legal ? legal + ' ' : ''}
        <a href={footer.unsubscribeUrl} style={{ color: '#8A8F99', textDecoration: 'underline' }}>Unsubscribe</a>
        {' · '}
        <a href={footer.prefsUrl} style={{ color: '#8A8F99', textDecoration: 'underline' }}>Manage preferences</a>
      </p>
    </div>
  );
}

export function ProductLaunchEmail({ content: c }: { content: ProductLaunchContent }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #F0EEE8' }}>
        <Logo src={c.logo} height={26} />
        <a href={c.browserUrl} style={{ fontSize: 12, color: FAINT, fontWeight: 500, textDecoration: 'none' }}>View in browser</a>
      </div>

      <div style={{ position: 'relative' }}>
        <img src={c.heroImage} alt="" width={600} style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block', border: 0 }} />
        <span style={{ position: 'absolute', top: 18, left: 24, background: 'rgba(20,22,27,0.86)', color: '#fff',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '7px 12px', borderRadius: 999 }}>{c.badge}</span>
      </div>

      <div style={{ padding: '34px 32px 8px' }}>
        <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0, color: INK }}>{c.heading}</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: '#4A4E57', margin: '14px 0 26px', maxWidth: 480 }}>{c.body}</p>
        <Button href={c.ctaUrl} brand={c.brand}>{c.ctaText}</Button>
      </div>

      <div style={{ padding: '30px 32px 8px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {c.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', borderRadius: 14, background: tint(c.brand, 0.93) }}>
            <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 11, background: c.brand, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: DISPLAY }}>{f.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>{f.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: MUTE, marginTop: 3 }}>{f.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '22px 32px 34px' }}>
        <a href={c.secondaryLink.url} style={{ fontSize: 14, fontWeight: 600, color: c.brand, textDecoration: 'none' }}>{c.secondaryLink.text}</a>
      </div>

      <div style={{ padding: '6px 32px 0', background: '#FAF9F6', borderTop: '1px solid #F0EEE8' }}>
        <div style={{ paddingTop: 22 }}><Logo src={c.logo} height={19} /></div>
      </div>
      <FooterBlock footer={c.footer} links={c.footerLinks} legal="You're receiving this because you have a Bago account." />
    </div>
  );
}

export function NewsletterEmail({ content: c }: { content: NewsletterContent }) {
  return (
    <div style={card}>
      <div style={{ padding: '30px 32px 26px', background: INK, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo src={c.logo} height={24} invert />
          <a href={c.viewUrl} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>View online</a>
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 22 }}>{c.issueTitle}</div>
        <div style={{ fontSize: 13, color: c.brand, fontWeight: 600, letterSpacing: '0.04em', marginTop: 10 }}>{c.issueMeta}</div>
      </div>

      <div style={{ padding: '28px 32px 6px' }}>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: '#4A4E57', margin: 0 }}>{c.intro}</p>
      </div>

      {c.stories.map((s, i) => (
        <div key={i}>
          {i > 0 && <div style={{ height: 1, background: '#F0EEE8', margin: '28px 32px' }} />}
          <div style={{ padding: i === 0 ? '26px 32px 4px' : '0 32px 4px' }}>
            <img src={s.image} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 16, display: 'block', border: 0 }} />
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.brand, margin: '18px 0 8px' }}>{s.tag}</div>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 23, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, color: INK }}>{s.title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: MUTE, margin: '10px 0 12px' }}>{s.text}</p>
            <a href={s.linkUrl} style={{ fontSize: 14, fontWeight: 600, color: INK, textDecoration: 'none' }}>{s.linkText}</a>
          </div>
        </div>
      ))}

      <div style={{ height: 1, background: '#F0EEE8', margin: '28px 32px' }} />
      <div style={{ margin: '0 32px', padding: '22px 24px', borderRadius: 16, background: tint(c.brand, 0.92),
        display: 'flex', justifyContent: 'space-between', textAlign: 'center', gap: 12 }}>
        {c.stats.map((st, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, color: INK }}>{st.value}</div>
            <div style={{ fontSize: 12, color: '#6A6E78', marginTop: 2 }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '30px 32px 36px', textAlign: 'center' }}>
        <Button href={c.ctaUrl} brand={c.brand} big>{c.ctaText}</Button>
      </div>

      <FooterBlock footer={c.footer} />
    </div>
  );
}

export function PromoEmailTemplate({ content: c }: { content: PromoContent }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #F0EEE8' }}>
        <Logo src={c.logo} height={26} />
        <a href={c.browserUrl} style={{ fontSize: 12, color: FAINT, fontWeight: 500, textDecoration: 'none' }}>View in browser</a>
      </div>

      <div style={{ padding: '40px 32px 34px', textAlign: 'center', background: c.brand }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>{c.offerKicker}</div>
        <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 38, lineHeight: 1.04, letterSpacing: '-0.03em', margin: '14px 0 0', color: '#fff' }}>
          {c.offerHeading[0]}<br />{c.offerHeading[1]}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.9)', margin: '16px auto 0', maxWidth: 380 }}>{c.offerSub}</p>
      </div>

      <div style={{ margin: '-22px 32px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ background: INK, borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Use code</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, letterSpacing: '0.06em', color: '#fff', marginTop: 2 }}>{c.code}</div>
          </div>
          <div style={{ borderLeft: '1px dashed rgba(255,255,255,0.25)', paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, maxWidth: 130 }}>{c.codeNote}</div>
        </div>
      </div>

      <div style={{ padding: '28px 32px 0' }}>
        <img src={c.heroImage} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 16, display: 'block', border: 0 }} />
      </div>

      <div style={{ padding: '26px 32px 8px', textAlign: 'center' }}>
        <Button href={c.ctaUrl} brand={c.brand} big>{c.ctaText}</Button>
        <div style={{ fontSize: 12, color: FAINT, marginTop: 12 }}>{c.ctaNote}</div>
      </div>

      <div style={{ padding: '30px 32px 8px' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: INK, marginBottom: 18 }}>How it works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {c.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: c.brand, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, fontFamily: DISPLAY }}>{i + 1}</span>
              <div style={{ fontSize: 15, color: '#4A4E57' }}><strong style={{ color: INK, fontWeight: 600 }}>{s.strong}</strong>{s.rest}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '28px 32px 0', padding: '20px 22px', borderRadius: 14, border: '1px solid #ECEAE3',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: MUTE }}>{c.referralText}<strong style={{ color: INK, fontWeight: 600 }}>{c.referralStrong}</strong></div>
        <a href={c.referralUrl} style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, color: c.brand, textDecoration: 'none' }}>{c.referralLinkText}</a>
      </div>

      <div style={{ marginTop: 28 }}>
        <FooterBlock footer={c.footer} legal="Offer for new senders only. Terms apply." />
      </div>
    </div>
  );
}
