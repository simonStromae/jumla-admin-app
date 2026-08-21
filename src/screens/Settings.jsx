import { useState, useEffect, useRef, Fragment } from 'react';
import I from '../components/Icons.jsx';
import { invalidateCompanyAssets } from '../lib/useCompanyAssets.js';
import { RoutePill, Drawer } from '../components/Shell.jsx';
import LandingEditor from './LandingEditor.jsx';
import { useAdminT } from '../lib/useAdminT.js';
import { useCurrency } from '../lib/useCurrency.js';
import PhoneInput from '../components/PhoneInput.jsx';

// Grille tarifaire par défaut (miroir de DEFAULT_ROUTE_FEES dans pricing.ts)
const DEFAULT_TIERS = [
  { from: 0.5,  to: 3,     transportFlat: 50,  cartonFlat: 1,    manutentionFlat: 4,                   douaneFlat: 5,    formalitesFlat: 5 },
  { from: 3.5,  to: 9.5,   transportPerKg: 13, cartonPerUnit: 1.5, manutentionFlat: 5,                 douanePerKg: 3,   formalitesPerKg: 2 },
  { from: 10,   to: 22.5,  transportPerKg: 12, cartonPerUnit: 1.5, manutentionFlat: 10,                douanePerKg: 3,   formalitesPerKg: 2 },
  { from: 23.5, to: 69.5,  transportPerKg: 11, cartonPerUnit: 1.5, manutentionFlat: 15,                douanePerKg: 2,   formalitesPerKg: 1.5 },
  { from: 70,   to: 115,   transportPerKg: 10, cartonPerUnit: 1.5, manutentionPerUnit: 5,  manutentionMin: 20, douanePerKg: 2.5, formalitesPerKg: 1 },
  { from: 115.5,to: 199.5, transportPerKg: 9,  cartonPerUnit: 1.5, manutentionPerUnit: 4.5,manutentionMin: 27, douanePerKg: 1.5, formalitesPerKg: 1 },
  { from: 200,  to: 250,   transportPerKg: 8,  cartonPerUnit: 1.5, manutentionPerUnit: 4,  manutentionMin: 40, douanePerKg: 1.5, formalitesPerKg: 1 },
  { from: 250.5,to: 99999, transportPerKg: 7.5, cartonPerUnit: 1.5, manutentionPerUnit: 3, manutentionMin: 60, douanePerKg: 1.5, formalitesPerKg: 1 },
];
const DEFAULT_FEES_META = {
  bags: { small: 5, medium: 7.5, large: 10 },
  saq:  { casier24x65: 24.50, casier24x33: 35.83, casier12x50: 21.34 },
  supplements: { vetements: 2, cosmetique: 3, biere: 6, electronique: 5, documents: -2 },
  marginPct: 30,
  deliveryFee: 25,
};

function fmtTransport(t) {
  if (t.transportFlat  !== undefined) return `${t.transportFlat} $ (forfait)`;
  if (t.transportPerKg !== undefined) return `${t.transportPerKg} $/kg`;
  return '—';
}
function fmtManut(t) {
  if (t.manutentionFlat !== undefined) return `${t.manutentionFlat} $ (forfait)`;
  if (t.manutentionPerUnit !== undefined) return `${t.manutentionPerUnit} $/unité · min ${t.manutentionMin ?? 0} $`;
  return '—';
}
function fmtRate(flat, perKg) {
  if (flat   !== undefined) return `${flat} $ (forfait)`;
  if (perKg  !== undefined) return `${perKg} $/kg`;
  return '—';
}

function TarifGrid({ tiers, fees, currency = 'CAD', isDefault = false }) {
  const t = useAdminT();
  const cur = currency;
  return (
    <div>
      {isDefault && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', background: 'var(--bg-soft)', padding: '6px 10px', borderRadius: 6, marginBottom: 12, fontStyle: 'italic' }}>
          {/* TODO i18n: no key for default grid notice */}
          Grille par défaut — aucune personnalisation configurée pour cette route
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ marginBottom: 12, fontSize: 12 }}>
          <thead>
            <tr>
              {/* TODO i18n: no keys for pricing table headers */}
              <th>Tranche</th>
              <th>Transport</th>
              <th>Manutention</th>
              <th>Douane/Term.</th>
              <th>Formalités</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {tier.to >= 99999 ? `> ${tier.from} kg` : `${tier.from} – ${tier.to} kg`}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtTransport(tier)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtManut(tier)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtRate(tier.douaneFlat, tier.douanePerKg)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtRate(tier.formalitesFlat, tier.formalitesPerKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
        {/* TODO i18n: no keys for packaging/SAQ/supplement section labels */}
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Emballages</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Carton : <strong>1,50 {cur}/carton</strong></span>
            <span>Petit sac : <strong>{fees.bags?.small ?? 5} {cur}</strong></span>
            <span>Moyen sac : <strong>{fees.bags?.medium ?? 7.5} {cur}</strong></span>
            <span>Grand sac : <strong>{fees.bags?.large ?? 10} {cur}</strong></span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Frais SAQ (bière)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Casier 24×65cl : <strong>{fees.saq?.casier24x65 ?? 24.5} {cur}</strong></span>
            <span>Casier 24×33cl : <strong>{fees.saq?.casier24x33 ?? 35.83} {cur}</strong></span>
            <span>Casier 12×50cl : <strong>{fees.saq?.casier12x50 ?? 21.34} {cur}</strong></span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Suppléments catégorie</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Vêtements : <strong>+{fees.supplements?.vetements ?? 2} {cur}/kg</strong></span>
            <span>Cosmétiques : <strong>+{fees.supplements?.cosmetique ?? 3} {cur}/kg</strong></span>
            <span>Bière : <strong>+{fees.supplements?.biere ?? 6} {cur}/kg</strong></span>
            <span>Électronique : <strong>+{fees.supplements?.electronique ?? 5} {cur}/kg</strong></span>
            <span>Documents : <strong>{fees.supplements?.documents ?? -2} {cur}/kg</strong></span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Autres frais</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Conditionnement : <strong>0,60 {cur}/plastique</strong></span>
            <span>Livraison Mtl île : <strong>{fees.deliveryFee ?? 25} {cur}</strong></span>
            <span>Livraison Grand Mtl : <strong>{Math.round((fees.deliveryFee ?? 25) * 1.2)} {cur}</strong></span>
            <span>Marge par défaut : <strong>{fees.marginPct ?? 30} %</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, sub, children, actions }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3 }}>{sub}</div>}
        </div>
        {actions}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>{sub}</div>}
      </div>
      <label style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 999,
          background: checked ? 'var(--brand-500)' : 'var(--ink-200)',
          transition: '.2s',
        }}>
          <span style={{
            position: 'absolute', top: 3, left: checked ? 21 : 3,
            width: 16, height: 16, borderRadius: 999,
            background: 'white', transition: '.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,.2)',
          }} />
        </span>
      </label>
    </div>
  );
}

/* ── Entreprise ──────────────────────────────────────────── */
function SectionCompany() {
  const t = useAdminT();
  const [fields, setFields] = useState({
    company_name:      'Jumla Shipping',
    company_legal:     'Jumla Shipping Inc.',
    phone_douala:      '',
    phone_montreal:    '',
    contact_whatsapp:  '',
    warehouse_addr:    '5500 Place de la Savane, Lachine, QC H4S 1V8, Canada',
    payment_email:     'incjumla@gmail.com',
  });
  const [saving, setSaving]       = useState(false);
  const [saved,  setSaved]        = useState(false);
  const [logoUrl,      setLogoUrl]      = useState('');
  const [logoIconUrl,  setLogoIconUrl]  = useState('');
  const [logoSizeH,    setLogoSizeH]    = useState(36);
  const [logoIconSize, setLogoIconSize] = useState(32);
  const [faviconUrl,   setFaviconUrl]   = useState('');
  const [logoSaving,   setLogoSaving]   = useState(false);
  const [logoSaved,    setLogoSaved]    = useState(false);
  const [logoError,    setLogoError]    = useState('');
  const fileInputRef     = useRef(null);
  const iconInputRef     = useRef(null);
  const faviconInputRef  = useRef(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setFields(f => ({
        company_name:     d.company_name     ?? f.company_name,
        company_legal:    d.company_legal    ?? f.company_legal,
        phone_douala:     d.phone_douala     ?? f.phone_douala,
        phone_montreal:   d.phone_montreal   ?? f.phone_montreal,
        contact_whatsapp: d.contact_whatsapp ?? f.contact_whatsapp,
        warehouse_addr:   d.warehouse_addr   ?? f.warehouse_addr,
        payment_email:    d.payment_email    ?? f.payment_email,
      }));
      if (d.company_logo)      setLogoUrl(d.company_logo);
      if (d.company_logo_icon) setLogoIconUrl(d.company_logo_icon);
      if (d.company_favicon)   setFaviconUrl(d.company_favicon);
      if (d.logo_size_h)    setLogoSizeH(parseInt(d.logo_size_h) || 36);
      if (d.logo_icon_size) setLogoIconSize(parseInt(d.logo_icon_size) || 32);
    }).catch(() => {});
  }, []);

  async function handleLogoFile(e, key, setter) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) { setLogoError(/* TODO i18n */ 'Fichier non supporté — PNG, JPG ou SVG uniquement.'); return; }
    if (file.size > 2 * 1024 * 1024)    { setLogoError(/* TODO i18n */ 'Fichier trop lourd — maximum 2 Mo.'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setter(dataUrl);
      setLogoSaving(true);
      await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: dataUrl }),
      });
      invalidateCompanyAssets();
      setLogoSaving(false); setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const handleLogoChange    = (e) => handleLogoFile(e, 'company_logo',      setLogoUrl);
  const handleIconChange    = (e) => handleLogoFile(e, 'company_logo_icon', setLogoIconUrl);
  const handleFaviconChange = (e) => handleLogoFile(e, 'company_favicon',   setFaviconUrl);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <SettingsCard title={t.settingsTabs.company} sub="Ces informations apparaissent sur vos bordereaux et messages clients.">
        <div className="field-row field-row--2">
          <div className="field"><label className="label">{t.settings.company.companyName}</label><input className="input" value={fields.company_name} onChange={set('company_name')} /></div>
          <div className="field"><label className="label">{/* TODO i18n: Raison sociale */}Raison sociale</label><input className="input" value={fields.company_legal} onChange={set('company_legal')} /></div>
        </div>
        <div className="field-row field-row--2">
          <div className="field"><label className="label">{t.common.phone} Douala</label><input className="input mono" value={fields.phone_douala} onChange={set('phone_douala')} placeholder="+237 6** ** ** **" /></div>
          <div className="field"><label className="label">{t.common.phone} Montréal</label><input className="input mono" value={fields.phone_montreal} onChange={set('phone_montreal')} placeholder="+1 514 *** ****" /></div>
        </div>
        <div className="field">
          <label className="label">{/* TODO i18n: WhatsApp contact client */}WhatsApp contact client <span className="opt">/ numéro affiché aux clients pour support</span></label>
          <input className="input mono" value={fields.contact_whatsapp} onChange={set('contact_whatsapp')} placeholder="+1 514 *** ****" />
        </div>
        <div className="field">
          <label className="label">{t.common.address}</label>
          <input className="input" value={fields.warehouse_addr} onChange={set('warehouse_addr')} />
        </div>
        <div className="field">
          <label className="label">{t.common.email} <span className="opt">/ {/* TODO i18n */}affiché sur toutes les factures et instructions de paiement</span></label>
          <input className="input mono" value={fields.payment_email} onChange={set('payment_email')} placeholder="incjumla@gmail.com" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginTop: 4 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {/* TODO i18n: 'Sauvegardé' */}Sauvegardé</span>}
          <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}><I.Check />{saving ? t.common.saving : t.common.save}</button>
        </div>
      </SettingsCard>
      {/* TODO i18n: "Apparence & marque" / "Logo, couleurs et pied de page des documents." */}
      <SettingsCard title="Apparence & marque" sub="Logo, couleurs et pied de page des documents.">
        <input ref={fileInputRef}    type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
        <input ref={iconInputRef}    type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconChange} />
        <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml,image/jpeg" style={{ display: 'none' }} onChange={handleFaviconChange} />
        {logoError && <div style={{ fontSize: 12, color: 'var(--bad-600)', marginBottom: 10 }}>{logoError}</div>}
        {logoSaved  && <div style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600, marginBottom: 10 }}>✓ {/* TODO i18n: 'Image sauvegardée' */}Image sauvegardée</div>}

        {/* Logo complet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 8, marginBottom: 10 }}>
          <div style={{ width: 120, height: 48, borderRadius: 10, border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
              : <span style={{ fontSize: 11, color: 'var(--ink-300)', fontStyle: 'italic' }}>{/* TODO i18n */}Aucun</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.settings.company.logo}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{/* TODO i18n */}Format paysage — affiché dans la nav, le footer et les en-têtes · PNG/SVG transparent · max 2 Mo</div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => fileInputRef.current?.click()} disabled={logoSaving}>
            <I.Upload />{logoSaving ? t.common.sending : logoUrl ? t.common.change : t.common.upload}
          </button>
        </div>

        {/* Icône carrée */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {logoIconUrl
              ? <img src={logoIconUrl} alt="Icône" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
              : <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <defs><linearGradient id="stlg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                  <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#stlg2)"/>
                </svg>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{/* TODO i18n: Icône / Logo carré */}Icône / Logo carré</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{/* TODO i18n */}Format carré — affiché dans la sidebar, le mobile et les petits espaces · PNG/SVG transparent · max 2 Mo</div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => iconInputRef.current?.click()} disabled={logoSaving}>
            <I.Upload />{logoSaving ? t.common.sending : logoIconUrl ? t.common.change : t.common.upload}
          </button>
        </div>

        {/* Favicon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 8, marginBottom: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {faviconUrl
              ? <img src={faviconUrl} alt="Favicon" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              : <span style={{ fontSize: 20 }}>🌐</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.settings.company.favicon}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{/* TODO i18n */}Icône affichée dans l'onglet du navigateur · PNG, ICO ou SVG · idéalement 32×32 px · max 2 Mo</div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => faviconInputRef.current?.click()} disabled={logoSaving}>
            <I.Upload />{logoSaving ? t.common.sending : faviconUrl ? t.common.change : t.common.upload}
          </button>
        </div>

        {/* Tailles */}
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 12 }}>{/* TODO i18n: Tailles d'affichage */}Tailles d'affichage</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label">{/* TODO i18n: Hauteur du logo complet (px) */}Hauteur du logo complet (px)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={20} max={72} value={logoSizeH}
                  onChange={e => setLogoSizeH(parseInt(e.target.value))}
                  style={{ flex: 1 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', minWidth: 32 }}>{logoSizeH}px</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>{/* TODO i18n */}Hauteur dans la nav et le footer</div>
            </div>
            <div>
              <label className="label">{/* TODO i18n: Taille de l'icône carrée (px) */}Taille de l'icône carrée (px)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={18} max={56} value={logoIconSize}
                  onChange={e => setLogoIconSize(parseInt(e.target.value))}
                  style={{ flex: 1 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', minWidth: 32 }}>{logoIconSize}px</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>{/* TODO i18n */}Taille dans la sidebar et l'écran de connexion</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn--ghost btn--sm" disabled={logoSaving} onClick={async () => {
              setLogoSaving(true);
              await fetch('/api/settings', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logo_size_h: String(logoSizeH), logo_icon_size: String(logoIconSize) }),
              });
              invalidateCompanyAssets();
              setLogoSaving(false); setLogoSaved(true);
              setTimeout(() => setLogoSaved(false), 3000);
            }}>
              <I.Check />{logoSaving ? t.common.saving : <>{t.common.apply}{/* TODO i18n: ' les tailles' */} les tailles</>}
            </button>
          </div>
        </div>
      </SettingsCard>
    </>
  );
}

/* ── Routes ──────────────────────────────────────────────── */
function MigrationBanner({ onDone }) {
  const t = useAdminT();
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const run = async () => {
    setStatus('running');
    try {
      const res = await fetch('/api/db-migrate');
      const d   = await res.json();
      if (d.ok) { setStatus('done'); onDone?.(); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };
  if (status === 'done') return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      <span style={{ color: 'var(--ok-600)', fontWeight: 700 }}>✓ {/* TODO i18n: Migration réussie */}Migration réussie — vous pouvez maintenant cliquer {t.common.save}.</span>
    </div>
  );
  if (status === 'error') return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      <span style={{ color: 'var(--bad-700)', fontWeight: 700 }}>✕ {/* TODO i18n: Échec de la migration */}Échec de la migration — contactez le support.</span>
      <button className="btn btn--ghost btn--sm" onClick={run}>{/* TODO i18n: Réessayer */}Réessayer</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: 'var(--warn-800)', marginBottom: 2 }}>{/* TODO i18n: Migration de base de données requise */}Migration de base de données requise</div>
        <div style={{ color: 'var(--warn-700)', fontSize: 12 }}>
          {/* TODO i18n: column migration description */}
          Les colonnes <code style={{ fontFamily: 'var(--ff-mono)', background: 'var(--warn-100)', padding: '1px 5px', borderRadius: 4 }}>fees</code>, <code style={{ fontFamily: 'var(--ff-mono)', background: 'var(--warn-100)', padding: '1px 5px', borderRadius: 4 }}>transitDays</code> et <code style={{ fontFamily: 'var(--ff-mono)', background: 'var(--warn-100)', padding: '1px 5px', borderRadius: 4 }}>currency</code> n'existent pas encore en base. La grille tarifaire ne peut pas être sauvegardée.
        </div>
      </div>
      <button className="btn btn--warn btn--sm" onClick={run} disabled={status === 'running'}>
        {status === 'running' ? /* TODO i18n */ 'En cours…' : /* TODO i18n */ '⚡ Lancer la migration'}
      </button>
    </div>
  );
}

function SectionRoutes({ routes, onEdit, onDetail }) {
  const t = useAdminT();
  return (
    <SettingsCard
      title={t.settingsTabs.routes}
      sub="Définissez les trajets que vous opérez. Chaque cargaison est rattachée à une route."
      actions={<button className="btn btn--brand btn--sm" onClick={() => onEdit('new')}><I.Plus />{t.settings.routes.new}</button>}>
      <div style={{ display: 'grid', gap: 10 }}>
        {routes.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
            {/* TODO i18n: Aucune route configurée. Créez votre première route pour commencer. */}
            Aucune route configurée. Créez votre première route pour commencer.
          </div>
        )}
        {routes.map(r => (
          <div key={r.id} className="card" style={{ padding: 16, cursor: 'pointer', borderColor: r.active ? 'var(--border)' : 'var(--border-soft)' }} onClick={() => onDetail(r)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: r.active ? 'var(--brand-50)' : 'var(--bg-soft)', color: r.active ? 'var(--brand-700)' : 'var(--ink-400)', display: 'grid', placeItems: 'center', fontSize: 20 }}>
                  {r.fees?.transportMode === 'sea' ? '🚢' : <I.Plane style={{ width: 20, height: 20 }} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{r.label || r.code}</span>
                    <RoutePill from={r.fromIATA} to={r.toIATA} />
                    {r.fees?.transportMode === 'sea'
                      ? <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0369a1', background: '#e0f2fe', borderRadius: 999, padding: '2px 8px' }}>Maritime</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-700)', background: 'var(--brand-50)', borderRadius: 999, padding: '2px 8px' }}>Aérien</span>}
                    {r.active
                      ? <span className="badge badge--dot badge--ok">{t.common.active}</span>
                      : <span className="badge badge--dot badge--neutral">{t.common.archived}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                    {/* TODO i18n: "Transit X j" label */}
                    Transit {r.transitDays ?? 14} j · {r.currency ?? 'CAD'}
                    {r.fees?.tiers?.length > 0 && ` · ${r.fees.tiers.length} tranche${r.fees.tiers.length > 1 ? 's' : ''} tarifaire${r.fees.tiers.length > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <button className="btn btn--ghost btn--sm" onClick={e => { e.stopPropagation(); onEdit(r); }}><I.Edit />{t.common.edit}</button>
                <I.ChevronRight style={{ color: 'var(--ink-300)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

function SectionPricing({ routes, onEdit }) {
  const t = useAdminT();
  // TODO i18n: "Grille tarifaire" / "Résumé de la tarification par route active."
  return (
    <SettingsCard title="Grille tarifaire" sub="Résumé de la tarification par route active.">
      {routes.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
          {/* TODO i18n: Configurez vos routes d'abord pour définir les tarifs. */}
          Configurez vos routes d'abord pour définir les tarifs.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              {/* TODO i18n: pricing table headers (Route, Devise, Transit, Tarification) */}
              <th style={{ borderRadius: 0 }}>Route</th>
              <th style={{ borderRadius: 0 }}>{t.common.currency}</th>
              <th style={{ borderRadius: 0 }}>Transit</th>
              <th style={{ borderRadius: 0 }}>Tarification</th>
            </tr>
          </thead>
          <tbody>
            {routes.filter(r => r.active).map(r => (
              <tr key={r.id}>
                <td>
                  <RoutePill from={r.fromIATA} to={r.toIATA} />
                  <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 600 }}>{r.label || r.code}</span>
                </td>
                <td className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{r.currency ?? 'CAD'}</td>
                <td style={{ fontSize: 12.5 }}>{r.transitDays ?? 14} {/* TODO i18n: jours */}jours</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {r.fees?.tiers?.length > 0
                      ? <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {r.fees.tiers.length} tranche{r.fees.tiers.length > 1 ? 's' : ''}</span>
                      : <span style={{ fontSize: 12, color: 'var(--ink-400)', fontStyle: 'italic' }}>{/* TODO i18n: À configurer */}À configurer</span>}
                    <button className="btn btn--ghost btn--sm" onClick={() => onEdit(r)} style={{ fontSize: 11.5 }}>
                      {r.fees?.tiers?.length > 0 ? /* TODO i18n */ '· Voir / Modifier' : /* TODO i18n */ '+ Configurer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SettingsCard>
  );
}

/* ── WhatsApp ─────────────────────────────────────────────── */
function SectionWhatsapp() {
  const t = useAdminT();
  const [status,           setStatus]           = useState(null);
  const [accountSid,       setAccountSid]       = useState('');
  const [authToken,        setAuthToken]         = useState('');
  const [fromNumber,       setFromNumber]       = useState('');
  const [smsFrom,          setSmsFrom]          = useState('');
  const [showSid,          setShowSid]          = useState(false);
  const [showToken,        setShowToken]        = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);
  const [testing,          setTesting]          = useState(false);
  const [testResult,       setTestResult]       = useState(null);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [channel,          setChannel]          = useState('whatsapp');

  useEffect(() => {
    fetch('/api/settings/whatsapp').then(r => r.json()).then(d => {
      setStatus(d);
      setAccountSid(d.accountSid ?? '');
      setAuthToken(d.authToken ?? '');
      setFromNumber(d.fromNumber ?? '');
      setSmsFrom(d.smsFrom ?? '');
      setMessagingEnabled(d.messagingEnabled !== false);
      setChannel(d.channel ?? 'whatsapp');
    }).catch(() => {});
  }, []);

  async function handleTest() {
    setTesting(true); setTestResult(null);
    const res = await fetch('/api/messaging/test').catch(() => null);
    const data = res ? await res.json() : { ok: false, error: t.common.networkError };
    setTestResult(data); setTesting(false);
    if (data.ok) {
      const s = await fetch('/api/settings/whatsapp').then(r => r.json()).catch(() => null);
      if (s) setStatus(s);
    }
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setTestResult(null);
    await fetch('/api/settings/whatsapp', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountSid, authToken, fromNumber, smsFrom, messagingEnabled, channel }),
    });
    const updated = await fetch('/api/settings/whatsapp').then(r => r.json()).catch(() => null);
    if (updated) {
      setStatus(updated);
      setAccountSid(updated.accountSid);
      setAuthToken(updated.authToken);
      setFromNumber(updated.fromNumber);
      setSmsFrom(updated.smsFrom ?? '');
      setMessagingEnabled(updated.messagingEnabled !== false);
      setChannel(updated.channel ?? 'whatsapp');
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  const configured = status?.configured;

  // TODO i18n: "Connexion API Twilio" / "Connectez votre compte Twilio pour l'envoi de messages WhatsApp."
  return (
    <SettingsCard title="Connexion API Twilio" sub="Connectez votre compte Twilio pour l'envoi de messages WhatsApp.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: configured ? 'var(--ok-50)' : 'var(--bg-soft)', border: '1px solid ' + (configured ? 'var(--ok-100)' : 'var(--border)'), borderRadius: 8, marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: configured ? 'var(--ok-500)' : 'var(--ink-300)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: configured ? 'var(--ok-700)' : 'var(--ink-600)' }}>
            {/* TODO i18n: API connected / not configured status */}
            {configured ? 'API connectée · opérationnelle' : 'Non configuré — renseignez vos identifiants Twilio ci-dessous'}
          </div>
          {configured && <div style={{ fontSize: 12, color: 'var(--ok-600)', marginTop: 2 }}>Twilio · {status.fromNumber}</div>}
        </div>
      </div>
      <div className="field-row field-row--2">
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="label" style={{ margin: 0 }}>Account SID</label>
            {accountSid && <button type="button" className="btn btn--ghost btn--xs" onClick={() => setAccountSid('')}>{t.common.remove}</button>}
          </div>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type={showSid ? 'text' : 'password'} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={accountSid} onChange={e => setAccountSid(e.target.value)} style={{ paddingRight: 36 }} />
            <button type="button" onClick={() => setShowSid(v => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', display: 'flex', alignItems: 'center', padding: 2 }}>
              {showSid ? <I.EyeOff style={{ width: 16, height: 16 }} /> : <I.Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="label" style={{ margin: 0 }}>Auth Token</label>
            {authToken && <button type="button" className="btn btn--ghost btn--xs" onClick={() => setAuthToken('')}>{t.common.remove}</button>}
          </div>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type={showToken ? 'text' : 'password'} placeholder="Auth token Twilio"
              value={authToken} onChange={e => setAuthToken(e.target.value)} style={{ paddingRight: 36 }} />
            <button type="button" onClick={() => setShowToken(v => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', display: 'flex', alignItems: 'center', padding: 2 }}>
              {showToken ? <I.EyeOff style={{ width: 16, height: 16 }} /> : <I.Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
        <div className="field">
          <label className="label">Numéro expéditeur WhatsApp</label>
          <input className="input mono" placeholder="+14155238886" value={fromNumber} onChange={e => setFromNumber(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">
            Numéro expéditeur SMS
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: 'var(--ink-400)' }}>(canal SMS uniquement)</span>
          </label>
          <input className="input mono" placeholder="+15141234567" value={smsFrom} onChange={e => setSmsFrom(e.target.value)} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-500)', background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, lineHeight: 1.6 }}>
        {/* TODO i18n: Twilio sandbox instructions */}
        <strong>Sandbox Twilio (phase de test) :</strong> le numéro est toujours <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>+14155238886</span>.<br />
        Trouve-le dans <strong>Twilio Console → Messaging → Try it out → Send a WhatsApp message</strong>.<br />
        ⚠️ Chaque destinataire doit d'abord envoyer le mot-clé du sandbox à ce numéro avant de recevoir tes messages.<br />
        <strong>Production :</strong> enregistre un numéro WhatsApp Business dans <strong>Messaging → Senders → WhatsApp Senders</strong>.
      </div>
      {/* ── Préférences d'envoi ── */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0 16px', paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          Préférences d'envoi
        </div>

        {/* Toggle enabled */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Activer l'envoi de messages</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
              {messagingEnabled ? 'Messages activés — les envois seront effectués' : 'Messages désactivés — aucun message ne sera envoyé'}
            </div>
          </div>
          <div onClick={() => setMessagingEnabled(v => !v)} style={{
            width: 44, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
            background: messagingEnabled ? 'var(--brand-500)' : 'var(--ink-200)',
            position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              position: 'absolute', top: 2, left: messagingEnabled ? 22 : 2,
              width: 20, height: 20, borderRadius: 10, background: 'white',
              transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </div>
        </div>

        {/* Channel */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" style={{ marginBottom: 8 }}>Canal d'envoi</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['whatsapp', '💬 WhatsApp'], ['sms', '📱 SMS']].map(([val, lbl]) => (
              <button key={val} type="button"
                className={'btn btn--sm ' + (channel === val ? 'btn--brand' : 'btn--ghost')}
                onClick={() => setChannel(val)} style={{ flex: 1, justifyContent: 'center' }}>
                {lbl}
              </button>
            ))}
          </div>
          {channel === 'sms' && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-500)', background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 6, padding: '8px 12px' }}>
              Le mode SMS envoie via Twilio sans le préfixe WhatsApp. Le numéro expéditeur doit être capable d'envoyer des SMS.
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--ink-400)', background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '10px 14px', lineHeight: 1.6 }}>
          💬 Le destinataire des notifications est désormais défini <strong>par colis</strong> lors de la réservation (expéditeur, destinataire, les deux, ou un contact personnalisé).
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
          {saving ? t.common.saving : t.common.save}
        </button>
        <button className="btn btn--ghost btn--sm" disabled={testing} onClick={handleTest}>
          {testing ? 'Test en cours…' : '⚡ Tester la connexion'}
        </button>
        {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
      </div>
      {testResult && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: testResult.ok ? 'var(--ok-50)' : 'var(--bad-50)', border: '1px solid ' + (testResult.ok ? 'var(--ok-200)' : 'var(--bad-200)') }}>
          {testResult.ok ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ok-700)' }}>
              {/* TODO i18n: Connexion réussie */}
              ✓ Connexion réussie — compte : <span style={{ fontFamily: 'monospace' }}>{testResult.accountName}</span> ({testResult.status})
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bad-700)', marginBottom: 6 }}>
                {/* TODO i18n: Échec — code X */}
                ✕ Échec — code {testResult.code} : {testResult.error}
              </div>
              {(testResult.sidPreview || testResult.tokenPreview) && (
                <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--ink-600)', marginBottom: 8, background: 'white', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--bad-100)' }}>
                  <div>{/* TODO i18n */}SID stocké&nbsp;&nbsp;: <strong>{testResult.sidPreview}</strong></div>
                  <div>{/* TODO i18n */}Token stocké : <strong>{testResult.tokenPreview}</strong></div>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                {/* TODO i18n */}Vérifiez que ces valeurs correspondent à <strong>Twilio Console → Account → Account Info</strong>.
              </div>
            </>
          )}
        </div>
      )}
    </SettingsCard>
  );
}

/* ── Push Notifications ───────────────────────────────────── */
function SectionPushSetup() {
  const t = useAdminT();
  const [status,  setStatus]  = useState(null); // null | 'loading' | { configured, publicKey }
  const [setting, setSetting] = useState(false);
  const [result,  setResult]  = useState('');

  useEffect(() => {
    fetch('/api/push/vapid').then(r => r.json()).then(d => {
      setStatus({ configured: !!d.publicKey, publicKey: d.publicKey });
    }).catch(() => setStatus({ configured: false }));
  }, []);

  async function handleSetup() {
    setSetting(true); setResult('');
    const res = await fetch('/api/push/setup').catch(() => null);
    if (!res?.ok) { setResult(/* TODO i18n */ 'Erreur lors de la configuration.'); setSetting(false); return; }
    const d = await res.json();
    setStatus({ configured: true, publicKey: d.publicKey });
    setResult(/* TODO i18n */ 'Clés VAPID générées et enregistrées.');
    setSetting(false);
  }

  const configured = status?.configured;
  // TODO i18n: "Push Notifications" / "Notifications natives sur navigateur et appareils mobiles..."
  return (
    <SettingsCard title="Push Notifications" sub="Notifications natives sur navigateur et appareils mobiles — canal complémentaire au WhatsApp.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: configured ? 'var(--ok-50)' : 'var(--bg-soft)', border: '1px solid ' + (configured ? 'var(--ok-100)' : 'var(--border)'), borderRadius: 8, marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: configured ? 'var(--ok-500)' : 'var(--ink-300)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: configured ? 'var(--ok-700)' : 'var(--ink-600)' }}>
            {/* TODO i18n: push status messages */}
            {status === null ? t.common.loading : configured ? 'Push configuré · clés VAPID actives' : 'Non configuré — cliquez sur « Configurer » pour générer les clés'}
          </div>
          {configured && status?.publicKey && (
            <div style={{ fontSize: 11, color: 'var(--ok-600)', marginTop: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {status.publicKey.slice(0, 40)}…
            </div>
          )}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 14, lineHeight: 1.6 }}>
        {/* TODO i18n: VAPID keys description */}
        Les clés VAPID sont générées une seule fois et stockées de façon sécurisée.
        Une fois configuré, les clients pourront activer les notifications push dans leur espace client —
        ils recevront une alerte native à chaque changement de statut de colis.
      </p>
      {!configured && (
        <button className="btn btn--brand btn--sm" onClick={handleSetup} disabled={setting || status === null}>
          {setting ? /* TODO i18n */ 'Configuration…' : /* TODO i18n */ 'Configurer les push notifications'}
        </button>
      )}
      {result && <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ok-600)' }}>{result}</div>}
    </SettingsCard>
  );
}

/* ── Modèles WhatsApp ────────────────────────────────────── */
const WA_TMPL_DEFS = {
  // Manuel
  arrival:  { label: "Avis d'arrivée",      group: 'manual', vars: ['{first_name}','{parcel_code}','{weight}','{amount}','{destination_city}','{warehouse_address}','{agent_phone}'], body: `Bonjour {first_name} 👋\n\nVotre colis ({parcel_code}) est arrivé à {destination_city}.\n\n📦 Poids : {weight} kg\n💰 Montant dû : {amount} CAD\n\n📍 Retrait : {warehouse_address}\n📞 Contact : {agent_phone}\n\nMerci,\nJumla Shipping` },
  reminder: { label: 'Relance paiement',     group: 'manual', vars: ['{first_name}','{parcel_code}','{amount}'], body: `Bonjour {first_name},\n\nNous n'avons pas encore reçu votre paiement pour le colis {parcel_code} — montant dû : {amount} CAD.\n\nMerci de régulariser votre situation au plus vite.\n\nJumla Shipping` },
  delivery: { label: 'Livraison confirmée',  group: 'manual', vars: ['{first_name}','{parcel_code}'], body: `Bonjour {first_name},\n\nVotre colis {parcel_code} a été livré. Merci de votre confiance !\n\nJumla Shipping` },
  invoice:  { label: 'Facture / Récap',      group: 'manual', vars: ['{first_name}','{parcel_code}','{weight}','{amount}'], body: `Bonjour {first_name},\n\nVoici le récapitulatif de votre colis {parcel_code} :\n• Poids : {weight} kg\n• Montant : {amount} CAD\n\nJumla Shipping` },
  broadcast:{ label: 'Annonce cargaison',    group: 'manual', vars: ['{first_name}','{arrival_date}'], body: `Bonjour {first_name} 👋\n\nNouvelle cargaison disponible — départ prévu le {arrival_date}.\n\nRéservez votre place dès maintenant.\n\nJumla Shipping` },
  // Automatiques
  auto_status_parcel:         { label: 'Statut colis',          group: 'auto', trigger: "Changement de statut d'un colis",           vars: ['{first_name}','{parcel_code}','{status_label}'], body: `Bonjour {first_name} 👋\n\nLe statut de votre colis *{parcel_code}* a été mis à jour.\n\nNouveau statut : *{status_label}*\n\nConnectez-vous à votre espace client pour suivre votre envoi.` },
  auto_supplement:            { label: 'Ajustement de prix',    group: 'auto', trigger: 'Prix confirmé supérieur au prix estimé',     vars: ['{first_name}','{parcel_code}','{estimated_price}','{confirmed_price}','{diff}'], body: `Bonjour {first_name} 👋\n\nAprès réception de votre colis *{parcel_code}* à notre entrepôt, le montant réel a été calculé.\n\n💰 Montant estimé : *{estimated_price} CAD*\n💳 Montant réel : *{confirmed_price} CAD*\n📊 Ajustement : *+{diff} CAD*\n\nUne facture complémentaire est disponible dans votre espace client. Merci de la régler pour que votre colis soit traité.` },
  auto_campaign_status:       { label: 'Statut cargaison',      group: 'auto', trigger: "Changement de statut d'une cargaison",       vars: ['{first_name}','{campaign_code}','{status_label}','{parcel_codes}'], body: `Bonjour {first_name} 👋\n\nVotre cargaison *{campaign_code}* a été mise à jour.\n\nNouveau statut : *{status_label}*\n\nColis : {parcel_codes}\n\nConnectez-vous à votre espace client pour suivre l'avancement de votre envoi.` },
  auto_bordereau_confirmed:   { label: 'Bordereau confirmé',    group: 'auto', trigger: 'Bordereau passé au statut « validé »',       vars: ['{first_name}','{bordereau_code}','{parcel_code}'], body: `Bonjour {first_name} 👋\n\nVotre bordereau *{bordereau_code}* (colis {parcel_code}) a été confirmé par Jumla Shipping.\n\nMerci de vous connecter à votre espace client pour vérifier et accepter le contenu déclaré avant l'expédition.` },
  auto_bordereau_discordance: { label: 'Discordance bordereau', group: 'auto', trigger: 'Bordereau passé au statut « discordance »',  vars: ['{first_name}','{bordereau_code}','{parcel_code}'], body: `Bonjour {first_name} 👋\n\nUne discordance a été détectée sur votre bordereau *{bordereau_code}* (colis {parcel_code}).\n\nMerci de vous connecter à votre espace client pour consulter les détails et régulariser votre dossier.` },
  auto_bordereau_invite:      { label: 'Invitation attestation bordereau', group: 'auto', trigger: "Création d'un bordereau — invite le client à attester son contenu", vars: ['{first_name}','{bordereau_code}','{parcel_code}'], body: `Bonjour {first_name} 👋\n\nVotre bordereau *{bordereau_code}* (colis {parcel_code}) est maintenant disponible.\n\n📋 *Action requise :* Connectez-vous à votre espace client pour vérifier et attester le contenu de votre bordereau.\n\n⚠️ *Important :* Ne pas attester votre bordereau constitue une renonciation au contenu de celui-ci. Jumla ne sera pas responsable de tout manquement lors de la livraison du colis.\n\nMerci,\nJumla Shipping` },
};

function SectionWaTemplates() {
  const t = useAdminT();
  const [group,     setGroup]     = useState('manual');
  const [active,    setActive]    = useState('arrival');
  const [templates, setTemplates] = useState(() =>
    Object.fromEntries(Object.entries(WA_TMPL_DEFS).map(([k, v]) => [k, { label: v.label, body: v.body }]))
  );
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [saveErr,  setSaveErr]  = useState(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setTemplates(prev => {
        const next = { ...prev };
        for (const id of Object.keys(WA_TMPL_DEFS)) {
          next[id] = {
            label: d[`wa_tmpl_${id}_label`] ?? prev[id].label,
            body:  d[`wa_tmpl_${id}_body`]  ?? prev[id].body,
          };
        }
        return next;
      });
    }).catch(() => {});
  }, []);

  const groupIds  = Object.entries(WA_TMPL_DEFS).filter(([,v]) => v.group === group).map(([k]) => k);
  const tmpl      = templates[active] ?? { label: '', body: '' };
  const def       = WA_TMPL_DEFS[active];

  const set = (k) => (e) => setTemplates(prev => ({ ...prev, [active]: { ...prev[active], [k]: e.target.value } }));
  const reset = () => setTemplates(prev => ({ ...prev, [active]: { label: WA_TMPL_DEFS[active].label, body: WA_TMPL_DEFS[active].body } }));

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveErr(null);
    try {
      const payload = {};
      for (const [id, tmplEntry] of Object.entries(templates)) {
        payload[`wa_tmpl_${id}_label`] = tmplEntry.label;
        payload[`wa_tmpl_${id}_body`]  = tmplEntry.body;
      }
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveErr(e?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  const switchGroup = (g) => {
    setGroup(g);
    setActive(Object.entries(WA_TMPL_DEFS).find(([,v]) => v.group === g)?.[0] ?? 'arrival');
  };

  // TODO i18n: "Modèles de messages WhatsApp" / "Personnalisez chaque message..."
  return (
    <SettingsCard
      title="Modèles de messages WhatsApp"
      sub="Personnalisez chaque message envoyé manuellement ou automatiquement par le système.">

      {/* Group selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--bg-soft)', padding: 4, borderRadius: 8, width: 'fit-content' }}>
        {/* TODO i18n: Envoi manuel / Automatiques */}
        {[{ id: 'manual', l: 'Envoi manuel (5)' }, { id: 'auto', l: 'Automatiques (6)' }].map(g => (
          <button key={g.id} onClick={() => switchGroup(g.id)}
            className="btn btn--sm"
            style={{ background: group === g.id ? 'white' : 'transparent', boxShadow: group === g.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none', color: group === g.id ? 'var(--ink-900)' : 'var(--ink-400)', fontWeight: group === g.id ? 700 : 400, border: 'none' }}>
            {g.l}
          </button>
        ))}
      </div>

      {/* Template tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {groupIds.map(id => (
          <button key={id}
            className={'btn btn--sm ' + (active === id ? 'btn--brand' : 'btn--ghost')}
            onClick={() => setActive(id)}>
            {templates[id]?.label ?? WA_TMPL_DEFS[id].label}
          </button>
        ))}
      </div>

      {/* Trigger info for auto templates */}
      {def?.trigger && (
        <div style={{ fontSize: 12, color: 'var(--ink-500)', background: 'var(--bg-soft)', padding: '8px 12px', borderRadius: 6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚡</span> <span><strong>{/* TODO i18n: Déclencheur */}Déclencheur :</strong> {def.trigger}</span>
        </div>
      )}

      {/* Editor */}
      <div className="field">
        <label className="label">{/* TODO i18n: Libellé du modèle */}Libellé du modèle <span className="opt">/ {/* TODO i18n */}affiché dans le sélecteur</span></label>
        <input className="input" value={tmpl.label} onChange={set('label')} />
      </div>
      <div className="field" style={{ marginBottom: 6 }}>
        <label className="label">{/* TODO i18n: Corps du message */}Corps du message</label>
        <textarea className="textarea" rows={9} value={tmpl.body} onChange={set('body')}
          style={{ fontSize: 12.5, fontFamily: 'var(--ff-mono)', lineHeight: 1.7 }} />
      </div>

      {/* Variables */}
      <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 14, lineHeight: 1.9 }}>
        {/* TODO i18n: Variables disponibles pour ce modèle */}
        Variables disponibles pour ce modèle :&nbsp;
        {(def?.vars ?? []).map(v => (
          <code key={v} style={{ fontFamily: 'var(--ff-mono)', background: 'var(--bg-soft)', padding: '1px 6px', borderRadius: 4, margin: '0 2px', fontSize: 10.5, border: '1px solid var(--border-soft)' }}>{v}</code>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
        {saveErr && <span style={{ fontSize: 12, color: 'var(--bad-600)', fontWeight: 600 }}>⚠ {saveErr}</span>}
        {saved   && <span style={{ fontSize: 12, color: 'var(--ok-700)',  fontWeight: 600 }}>✓ Sauvegardé</span>}
        <button className="btn btn--ghost btn--sm" onClick={reset}>Réinitialiser</button>
        <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
          <I.Check />{saving ? t.common.saving : t.common.save}
        </button>
      </div>
    </SettingsCard>
  );
}

/* ── Auto-notifications ──────────────────────────────────── */
function SectionAutoNotif() {
  const t = useAdminT();
  const DEFAULTS = { notif_arrival: true, notif_reminder: true, notif_delivery: true, notif_overrun: false, notif_invoice: true, notif_broadcast: false };
  const [toggles, setToggles] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      const loaded = {};
      for (const k of Object.keys(DEFAULTS)) {
        if (d[k] !== undefined) loaded[k] = d[k] === 'true';
      }
      setToggles(t => ({ ...t, ...loaded }));
    }).catch(() => {});
  }, []);

  const toggle = async (k) => {
    const next = { ...toggles, [k]: !toggles[k] };
    setToggles(next);
    const payload = {};
    for (const [key, val] of Object.entries(next)) payload[key] = String(val);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  };

  // TODO i18n: trigger labels and descriptions do not have matching translation keys
  const triggers = [
    { id: 'notif_arrival',   l: "Avis d'arrivée",             d: 'Envoyé automatiquement quand la cargaison passe à "Arrivée"' },
    { id: 'notif_reminder',  l: 'Relance paiement J+3',        d: "Envoyé 3 jours après l'arrivée si paiement non confirmé" },
    { id: 'notif_delivery',  l: 'Confirmation de livraison',   d: 'Envoyé à la validation du bordereau et libération du colis' },
    { id: 'notif_overrun',   l: 'Alerte dépassement de poids', d: "Envoyé à l'expéditeur si le poids réel > poids réservé" },
    { id: 'notif_invoice',   l: 'Facture automatique',         d: 'Envoyée au destinataire à la création du colis' },
    { id: 'notif_broadcast', l: 'Annonce nouvelle cargaison',  d: "Notifie les clients fidèles à l'ouverture d'une cargaison" },
  ];

  // TODO i18n: "Notifications automatiques" / "Activez ou désactivez chaque déclencheur. Les modèles sont gérés dans la Messagerie."
  return (
    <SettingsCard title="Notifications automatiques" sub="Activez ou désactivez chaque déclencheur. Les modèles sont gérés dans la Messagerie.">
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {triggers.map(trig => (
          <div key={trig.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{trig.l}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{trig.d}</div>
            </div>
            <span style={{ fontSize: 11, color: toggles[trig.id] ? 'var(--ok-700)' : 'var(--ink-400)', fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
              {toggles[trig.id] ? t.common.active : t.common.inactive}
            </span>
            <button onClick={() => toggle(trig.id)} style={{
              width: 36, height: 20, borderRadius: 999,
              background: toggles[trig.id] ? 'var(--brand-500)' : 'var(--ink-200)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .15s', flexShrink: 0,
            }}>
              <span style={{ position: 'absolute', left: toggles[trig.id] ? 18 : 2, top: 2, width: 16, height: 16, borderRadius: 999, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--warn-700)', background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 8, padding: '10px 14px' }}>
        {/* TODO i18n: WhatsApp API required warning */}
        ⚠️ Les envois automatiques nécessitent que l'API WhatsApp soit configurée dans l'onglet <strong>WhatsApp</strong>.
      </div>
    </SettingsCard>
  );
}

/* ── Paramètres cargaisons ───────────────────────────────── */
function SectionCampaigns() {
  const t = useAdminT();
  const { setCurrency } = useCurrency();
  const [fields, setFields] = useState({ default_transit_days: '14', default_currency: 'CAD', weight_rounding: '0.5' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setFields(f => ({
        default_transit_days: d.default_transit_days ?? f.default_transit_days,
        default_currency:     d.default_currency     ?? f.default_currency,
        weight_rounding:      d.weight_rounding      ?? f.weight_rounding,
      }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    setCurrency(fields.default_currency);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <SettingsCard title={t.settingsTabs.campaigns} sub="Valeurs par défaut appliquées à la création d'une cargaison.">
      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">{/* TODO i18n: Durée de transit par défaut */}Durée de transit par défaut</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input className="input" value={fields.default_transit_days} onChange={set('default_transit_days')} type="number" min="1" style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{/* TODO i18n: jours */}jours</span>
          </div>
        </div>
        <div className="field">
          <label className="label">{t.common.currency}</label>
          <select className="select" value={fields.default_currency} onChange={set('default_currency')}>
            <option value="CAD">CAD</option><option value="EUR">EUR</option>
            <option value="USD">USD</option><option value="XAF">XAF</option>
          </select>
        </div>
      </div>
      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">{/* TODO i18n: Arrondi poids facturé */}Arrondi poids facturé</label>
          <select className="select" value={fields.weight_rounding} onChange={set('weight_rounding')}>
            <option value="0.5">0,5 kg</option><option value="1">1 kg</option><option value="exact">{/* TODO i18n */}Exact</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginTop: 4 }}>
        {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {/* TODO i18n */}Sauvegardé</span>}
        <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}><I.Check />{saving ? t.common.saving : t.common.save}</button>
      </div>
    </SettingsCard>
  );
}

/* ── Devises & taux de change ────────────────────────────── */
const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'Dollar américain',  flag: '🇺🇸', key: 'exchange_rate_USD_CAD' },
  { code: 'EUR', label: 'Euro',              flag: '🇪🇺', key: 'exchange_rate_EUR_CAD' },
  { code: 'XAF', label: 'Franc CFA',         flag: '🌍', key: 'exchange_rate_XAF_CAD' },
  { code: 'CNY', label: 'Yuan chinois',      flag: '🇨🇳', key: 'exchange_rate_CNY_CAD' },
];

function SectionDevises({ routes }) {
  const [rates, setRates]         = useState({});
  const [saving, setSaving]       = useState({});
  const [saved, setSaved]         = useState({});
  const [err, setErr]             = useState({});
  const [calcFrom, setCalcFrom]   = useState('');
  const [calcCur,  setCalcCur]    = useState('USD');
  const [fetching, setFetching]   = useState(false);
  const [fetchMsg, setFetchMsg]   = useState('');
  const [liveRates, setLiveRates] = useState(null); // { rates, updatedAt }

  // Find which currencies are actually used across routes
  const usedCurrencies = [...new Set((routes || []).map(r => r.currency).filter(c => c && c !== 'CAD'))];

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      const loaded = {};
      for (const c of SUPPORTED_CURRENCIES) {
        loaded[c.key] = d[c.key] ?? '';
      }
      setRates(loaded);
    }).catch(() => {});
  }, []);

  async function fetchLiveRates() {
    setFetching(true); setFetchMsg(''); setLiveRates(null);
    try {
      const res = await fetch('/api/exchange-rates');
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Erreur API');
      setLiveRates(data);
      // Pre-fill inputs with fetched rates (don't auto-save — user must confirm)
      const updated = { ...rates };
      for (const c of SUPPORTED_CURRENCIES) {
        if (data.rates[c.code] !== undefined) {
          updated[c.key] = String(data.rates[c.code]);
        }
      }
      setRates(updated);
      setFetchMsg(data.stale ? '⚠ Taux en cache (API indisponible)' : '✓ Taux récupérés — vérifiez et sauvegardez');
    } catch (e) {
      setFetchMsg('⚠ ' + (e.message || 'Impossible de récupérer les taux'));
    } finally {
      setFetching(false);
    }
  }

  async function saveAllRates() {
    setSaving(s => ({ ...s, __all: true }));
    try {
      const payload = {};
      for (const c of SUPPORTED_CURRENCIES) {
        if (rates[c.key]) payload[c.key] = rates[c.key];
      }
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setSaved(s => ({ ...s, __all: true }));
      setTimeout(() => setSaved(s => ({ ...s, __all: false })), 3000);
      setFetchMsg('');
    } catch (e) {
      setFetchMsg('⚠ ' + e.message);
    } finally {
      setSaving(s => ({ ...s, __all: false }));
    }
  }

  async function saveRate(key) {
    setSaving(s => ({ ...s, [key]: true }));
    setErr(e => ({ ...e, [key]: '' }));
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: rates[key] }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2500);
    } catch (e) {
      setErr(er => ({ ...er, [key]: e.message }));
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  }

  const calcRate = rates[`exchange_rate_${calcCur}_CAD`];
  const calcResult = calcFrom && calcRate ? (parseFloat(calcFrom) * parseFloat(calcRate)).toFixed(2) : null;

  return (
    <>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <I.Coins style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Taux de change → CAD</span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={fetchLiveRates} disabled={fetching}>
            <I.Refresh style={{ width: 13, height: 13 }} />
            {fetching ? 'Récupération…' : 'Taux en temps réel'}
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-400)', marginBottom: fetchMsg ? 10 : 18 }}>
          Ces taux servent de valeur suggérée lors de la création d'une cargaison sur une route non-CAD.
          Chaque cargaison verrouille son propre taux à la création.
        </div>
        {fetchMsg && (
          <div style={{
            padding: '8px 14px', borderRadius: 8, marginBottom: 14, fontSize: 12.5,
            background: fetchMsg.startsWith('✓') ? 'var(--ok-50)' : 'var(--warn-50)',
            color:      fetchMsg.startsWith('✓') ? 'var(--ok-700)' : 'var(--ink-700)',
            border:     '1px solid ' + (fetchMsg.startsWith('✓') ? 'var(--ok-200)' : 'var(--warn-200)'),
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <span>{fetchMsg}</span>
            {fetchMsg.startsWith('✓') && (
              <button className="btn btn--brand btn--sm" disabled={saving.__all} onClick={saveAllRates}>
                <I.Check />{saving.__all ? 'Sauvegarde…' : saved.__all ? '✓ Sauvegardé' : 'Sauvegarder tout'}
              </button>
            )}
          </div>
        )}
        {liveRates?.updatedAt && (
          <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 14 }}>
            Source : open.er-api.com · Mis à jour le {liveRates.updatedAt}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SUPPORTED_CURRENCIES.map(c => {
            const isUsed = usedCurrencies.includes(c.code);
            return (
              <div key={c.code} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr auto',
                alignItems: 'center', gap: 14,
                padding: '12px 16px',
                border: '1px solid ' + (isUsed ? 'var(--brand-200)' : 'var(--border-soft)'),
                borderRadius: 10,
                background: isUsed ? 'var(--brand-50)' : 'var(--bg-soft)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{c.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.code}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{c.label}</div>
                    {isUsed && <div style={{ fontSize: 10, color: 'var(--brand-600)', fontWeight: 600, marginTop: 2 }}>✓ Utilisé</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>1 {c.code} =</span>
                  <input
                    className="input mono"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={rates[c.key] ?? ''}
                    onChange={e => setRates(r => ({ ...r, [c.key]: e.target.value }))}
                    placeholder="ex: 0.0019"
                    style={{ flex: 1, maxWidth: 160 }}
                  />
                  <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>CAD</span>
                  {rates[c.key] && (
                    <span style={{ fontSize: 11, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
                      = {(1 / parseFloat(rates[c.key])).toFixed(2)} {c.code}/CAD
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {err[c.key]  && <span style={{ fontSize: 11, color: 'var(--bad-600)' }}>⚠ {err[c.key]}</span>}
                  {saved[c.key] && <span style={{ fontSize: 11, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
                  <button
                    className="btn btn--brand btn--sm"
                    disabled={saving[c.key] || !rates[c.key]}
                    onClick={() => saveRate(c.key)}
                  >
                    <I.Check />{saving[c.key] ? 'Sauvegarde…' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculateur */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <I.Calculator style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>Calculateur de conversion</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="input mono"
            type="number"
            min="0"
            value={calcFrom}
            onChange={e => setCalcFrom(e.target.value)}
            placeholder="Montant"
            style={{ width: 140 }}
          />
          <select className="select" value={calcCur} onChange={e => setCalcCur(e.target.value)} style={{ width: 110 }}>
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <span style={{ fontSize: 14, color: 'var(--ink-500)' }}>→</span>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', minWidth: 80 }}>
            {calcResult !== null ? (
              <><span className="mono">{parseFloat(calcResult).toLocaleString('fr')}</span> <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-400)' }}>CAD</span></>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--ink-300)' }}>{calcFrom && !calcRate ? 'Taux non défini' : '—'}</span>
            )}
          </div>
        </div>
        {calcRate && calcFrom && (
          <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 8 }}>
            Taux utilisé : 1 {calcCur} = {calcRate} CAD
          </div>
        )}
      </div>
    </>
  );
}

/* ── Codes & numérotation ────────────────────────────────── */
function SectionCodes() {
  const t = useAdminT();
  const DEFAULTS = {
    code_campaign: '{ORIG}-{DEST}-{MMM}-{NN}',
    code_parcel:   'P-{NNNN}',
    code_slip:     'BL-{YYMM}-{NN}',
    code_client:   'CL-{NNNN}',
  };
  const EXAMPLES = {
    code_campaign: 'DLA-YUL-APR-02',
    code_parcel:   'P-0142',
    code_slip:     'BL-2604-01',
    code_client:   'CL-0418',
  };
  const LABELS = {
    code_campaign: 'Code cargaison',
    code_parcel:   'Code colis',
    code_slip:     'Code bordereau',
    code_client:   'Code client',
  };

  const [fields, setFields] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      const loaded = {};
      for (const k of Object.keys(DEFAULTS)) {
        if (d[k]) loaded[k] = d[k];
      }
      setFields(f => ({ ...f, ...loaded }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  // TODO i18n: "Format des codes" / "Personnalisez le format des codes générés automatiquement."
  return (
    <SettingsCard title="Format des codes" sub="Personnalisez le format des codes générés automatiquement.">
      {/* TODO i18n: LABELS keys (Code cargaison, Code colis, Code bordereau, Code client) */}
      {Object.keys(DEFAULTS).map(k => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
          <span style={{ width: 140, fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', flexShrink: 0 }}>{LABELS[k]}</span>
          <input className="input input--sm mono" value={fields[k]} onChange={set(k)} style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-400)', padding: '2px 8px', background: 'var(--bg-soft)', borderRadius: 4, whiteSpace: 'nowrap' }}>→ {EXAMPLES[k]}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginTop: 14 }}>
        {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {/* TODO i18n */}Sauvegardé</span>}
        <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}><I.Check />{saving ? t.common.saving : t.common.save}</button>
      </div>
    </SettingsCard>
  );
}

/* ── Éditeur route plein écran ───────────────────────────── */
function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 10, marginTop: 4 }}>{children}</div>;
}

const DEFAULT_SEA_TIERS_EDITOR = [
  { id:1, from:'1',      to:'10',    transportType:'flat',  transportValue:'100', cartonType:'flat',    cartonValue:'0',   manutentionType:'flat', manutentionValue:'0',  manutentionMin:'', douaneType:'flat',  douaneValue:'10',  formalitesType:'flat',  formalitesValue:'10'  },
  { id:2, from:'10.5',   to:'50',    transportType:'perKg', transportValue:'9.5', cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat', manutentionValue:'15', manutentionMin:'', douaneType:'perKg', douaneValue:'2',   formalitesType:'perKg', formalitesValue:'1.5' },
  { id:3, from:'50.5',   to:'100',   transportType:'perKg', transportValue:'8',   cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat', manutentionValue:'20', manutentionMin:'', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'   },
  { id:4, from:'100.5',  to:'200',   transportType:'perKg', transportValue:'6.5', cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat', manutentionValue:'30', manutentionMin:'', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'   },
  { id:5, from:'200.5',  to:'300',   transportType:'perKg', transportValue:'5.5', cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat', manutentionValue:'40', manutentionMin:'', douaneType:'perKg', douaneValue:'1',   formalitesType:'perKg', formalitesValue:'0.75'},
  { id:6, from:'300.5',  to:'1000',  transportType:'perKg', transportValue:'4.5', cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat', manutentionValue:'60', manutentionMin:'', douaneType:'perKg', douaneValue:'1',   formalitesType:'perKg', formalitesValue:'0.75'},
  { id:7, from:'1000.5', to:'',      transportType:'perKg', transportValue:'3.5', cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat', manutentionValue:'80', manutentionMin:'', douaneType:'perKg', douaneValue:'0.75',formalitesType:'perKg', formalitesValue:'0.5' },
];

const DEFAULT_TIERS_EDITOR = [
  { id:1, from:'0.5', to:'3',     transportType:'flat',  transportValue:'50',  cartonType:'flat',    cartonValue:'1',   manutentionType:'flat',    manutentionValue:'4',   manutentionMin:'',   douaneType:'flat',  douaneValue:'5',   formalitesType:'flat',  formalitesValue:'5'  },
  { id:2, from:'3.5', to:'9.5',   transportType:'perKg', transportValue:'13',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat',    manutentionValue:'5',   manutentionMin:'',   douaneType:'perKg', douaneValue:'3',   formalitesType:'perKg', formalitesValue:'2'  },
  { id:3, from:'10',  to:'22.5',  transportType:'perKg', transportValue:'12',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat',    manutentionValue:'10',  manutentionMin:'',   douaneType:'perKg', douaneValue:'3',   formalitesType:'perKg', formalitesValue:'2'  },
  { id:4, from:'23.5',to:'69.5',  transportType:'perKg', transportValue:'11',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat',    manutentionValue:'15',  manutentionMin:'',   douaneType:'perKg', douaneValue:'2',   formalitesType:'perKg', formalitesValue:'1.5'},
  { id:5, from:'70',  to:'115',   transportType:'perKg', transportValue:'10',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'5',   manutentionMin:'20', douaneType:'perKg', douaneValue:'2.5', formalitesType:'perKg', formalitesValue:'1'  },
  { id:6, from:'115.5',to:'199.5',transportType:'perKg', transportValue:'9',   cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'4.5', manutentionMin:'27', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'  },
  { id:7, from:'200', to:'250',   transportType:'perKg', transportValue:'8',   cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'4',   manutentionMin:'40', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'  },
  { id:8, from:'250.5',to:'',     transportType:'perKg', transportValue:'7.5', cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'3',   manutentionMin:'60', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'  },
];

function initTiers(fees) {
  if (!fees?.tiers?.length) return DEFAULT_TIERS_EDITOR.map(t => ({ ...t }));
  return fees.tiers.map((t, i) => ({
    id: i + 1,
    from: String(t.from ?? ''),
    to:   t.to >= 99999 ? '' : String(t.to ?? ''),
    transportType:     t.transportFlat !== undefined ? 'flat'    : 'perKg',
    transportValue:    String(t.transportFlat   ?? t.transportPerKg   ?? ''),
    cartonType:        t.cartonFlat    !== undefined ? 'flat'    : 'perUnit',
    cartonValue:       String(t.cartonFlat       ?? t.cartonPerUnit    ?? 1.5),
    manutentionType:   t.manutentionFlat !== undefined ? 'flat'  : 'perUnit',
    manutentionValue:  String(t.manutentionFlat  ?? t.manutentionPerUnit ?? ''),
    manutentionMin:    String(t.manutentionMin   ?? ''),
    douaneType:        t.douaneFlat    !== undefined ? 'flat'    : 'perKg',
    douaneValue:       String(t.douaneFlat        ?? t.douanePerKg     ?? ''),
    formalitesType:    t.formalitesFlat !== undefined ? 'flat'   : 'perKg',
    formalitesValue:   String(t.formalitesFlat   ?? t.formalitesPerKg ?? ''),
  }));
}

function tierToApi(t) {
  const to = t.to === '' ? 99999 : parseFloat(t.to) || 0;
  return {
    from: parseFloat(t.from) || 0,
    to,
    ...(t.transportType === 'flat'
      ? { transportFlat:   parseFloat(t.transportValue)   || 0 }
      : { transportPerKg:  parseFloat(t.transportValue)   || 0 }),
    ...(t.cartonType === 'flat'
      ? { cartonFlat:      parseFloat(t.cartonValue)      || 0 }
      : { cartonPerUnit:   parseFloat(t.cartonValue)      || 0 }),
    ...(t.manutentionType === 'flat'
      ? { manutentionFlat: parseFloat(t.manutentionValue) || 0 }
      : { manutentionPerUnit: parseFloat(t.manutentionValue) || 0, manutentionMin: parseFloat(t.manutentionMin) || 0 }),
    ...(t.douaneType === 'flat'
      ? { douaneFlat:      parseFloat(t.douaneValue)      || 0 }
      : { douanePerKg:     parseFloat(t.douaneValue)      || 0 }),
    ...(t.formalitesType === 'flat'
      ? { formalitesFlat:  parseFloat(t.formalitesValue)  || 0 }
      : { formalitesPerKg: parseFloat(t.formalitesValue)  || 0 }),
  };
}

function RouteEditModal({ editRoute, onClose, onSaved }) {
  const t = useAdminT();
  const isNew = editRoute === 'new';
  const r = isNew ? null : editRoute;
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  // Informations de base
  const [origin, setOrigin]           = useState(r?.fromIATA || '');
  const [destination, setDestination] = useState(r?.toIATA || '');
  const [label, setLabel]             = useState(r?.label || '');
  const [transitDays, setTransitDays] = useState(String(r?.transitDays ?? 14));
  const [currency, setCurrency]       = useState(r?.currency ?? 'CAD');
  const [active, setActive]           = useState(r?.active ?? true);

  // Route africaine (sacs + bière activés uniquement pour les routes africaines)
  const [africanRoute, setAfricanRoute] = useState(r?.fees?.africanRoute ?? !isNew);

  // Mode de transport
  const [transportMode, setTransportMode] = useState(r?.fees?.transportMode ?? 'air');

  // Paliers
  const [tiers, setTiers] = useState(() => initTiers(r?.fees));

  // Sea-specific supplements
  const [bulkyPerCbm,         setBulkyPerCbm]         = useState(String(r?.fees?.bulkyPerCbm         ?? 800));
  const [highValueThreshold,  setHighValueThreshold]  = useState(String(r?.fees?.highValueThreshold  ?? 500));
  const [highValuePct,        setHighValuePct]        = useState(String(r?.fees?.highValuePct        ?? 2));

  // Emballages & conditionnement
  const [bagSmall,   setBagSmall]   = useState(String(r?.fees?.bags?.small    ?? 5));
  const [bagMedium,  setBagMedium]  = useState(String(r?.fees?.bags?.medium   ?? 7.5));
  const [bagLarge,   setBagLarge]   = useState(String(r?.fees?.bags?.large    ?? 10));
  const [plastic,    setPlastic]    = useState(String(r?.fees?.plastic        ?? 0.6));

  // SAQ
  const [saq24x65,   setSaq24x65]   = useState(String(r?.fees?.saq?.casier24x65 ?? 24.50));
  const [saq24x33,   setSaq24x33]   = useState(String(r?.fees?.saq?.casier24x33 ?? 35.83));
  const [saq12x50,   setSaq12x50]   = useState(String(r?.fees?.saq?.casier12x50 ?? 21.34));

  // Suppléments
  const [suppVetements,    setSuppVetements]    = useState(String(r?.fees?.supplements?.vetements   ?? 2));
  const [suppCosmetique,   setSuppCosmetique]   = useState(String(r?.fees?.supplements?.cosmetique  ?? 3));
  const [suppBiere,        setSuppBiere]        = useState(String(r?.fees?.supplements?.biere        ?? 6));
  const [suppElectronique, setSuppElectronique] = useState(String(r?.fees?.supplements?.electronique ?? 5));
  const [suppDocuments,    setSuppDocuments]    = useState(String(r?.fees?.supplements?.documents    ?? -2));

  // Marge & livraison
  const [marginPct,      setMarginPct]      = useState(String(r?.fees?.marginPct  ?? 0));
  const [deliveryFeeIle, setDeliveryFeeIle] = useState(String(r?.fees?.deliveryFee ?? 25));

  // Contact & dépôt (côté départ)
  const [dropoffAddress,      setDropoffAddress]      = useState(r?.fees?.dropoff?.address      || '');
  const [dropoffPhone,        setDropoffPhone]        = useState(r?.fees?.dropoff?.phone        || '');
  const [dropoffWhatsapp,     setDropoffWhatsapp]     = useState(r?.fees?.dropoff?.whatsapp     || '');
  const [dropoffHours,        setDropoffHours]        = useState(r?.fees?.dropoff?.hours        || '');
  const [dropoffInstructions, setDropoffInstructions] = useState(r?.fees?.dropoff?.instructions || '');

  // Retrait / arrivée (côté destination) — utilisé dans les notifications WhatsApp
  const [arrivalCity,    setArrivalCity]    = useState(r?.fees?.arrival?.city    || '');
  const [arrivalAddress, setArrivalAddress] = useState(r?.fees?.arrival?.address || '');
  const [arrivalPhone,   setArrivalPhone]   = useState(r?.fees?.arrival?.phone   || '');

  // Helpers paliers
  const updTier = (id, k, v) => setTiers(ts => ts.map(t => t.id === id ? { ...t, [k]: v } : t));
  const delTier = (id) => setTiers(ts => ts.filter(t => t.id !== id));
  const addTier = () => setTiers(ts => [...ts, {
    id: Date.now(), from: '', to: '',
    transportType: 'perKg', transportValue: '',
    cartonType: 'perUnit', cartonValue: '1.5',
    manutentionType: 'flat', manutentionValue: '', manutentionMin: '',
    douaneType: 'perKg', douaneValue: '',
    formalitesType: 'perKg', formalitesValue: '',
  }]);

  const switchMode = (mode) => {
    setTransportMode(mode);
    if (isNew || tiers === null) {
      setTiers((mode === 'sea' ? DEFAULT_SEA_TIERS_EDITOR : DEFAULT_TIERS_EDITOR).map(t => ({ ...t })));
    }
  };

  const handleSave = async () => {
    if (!origin.trim() || !destination.trim()) { setErr(/* TODO i18n */ 'Codes IATA obligatoires'); return; }
    setSaving(true); setErr('');
    try {
      const fees = {
        transportMode,
        africanRoute,
        tiers:       tiers.map(tierToApi),
        bags:        africanRoute ? { small: parseFloat(bagSmall)||5, medium: parseFloat(bagMedium)||7.5, large: parseFloat(bagLarge)||10 } : { small: 0, medium: 0, large: 0 },
        plastic:     parseFloat(plastic) || 0.6,
        saq:         africanRoute ? { casier24x65: parseFloat(saq24x65)||24.5, casier24x33: parseFloat(saq24x33)||35.83, casier12x50: parseFloat(saq12x50)||21.34 } : { casier24x65: 0, casier24x33: 0, casier12x50: 0 },
        supplements: { vetements: parseFloat(suppVetements)||2, cosmetique: parseFloat(suppCosmetique)||3, biere: africanRoute ? (parseFloat(suppBiere)||6) : 0, electronique: parseFloat(suppElectronique)||5, documents: parseFloat(suppDocuments)||-2 },
        ...(transportMode === 'sea' ? {
          bulkyPerCbm:        parseFloat(bulkyPerCbm)        || 800,
          highValueThreshold: parseFloat(highValueThreshold) || 500,
          highValuePct:       parseFloat(highValuePct)       || 2,
        } : {}),
        marginPct:   parseFloat(marginPct) || 0,
        deliveryFee: parseFloat(deliveryFeeIle) || 25,
        dropoff: {
          address:      dropoffAddress.trim()      || null,
          phone:        dropoffPhone.trim()        || null,
          whatsapp:     dropoffWhatsapp.trim()     || null,
          hours:        dropoffHours.trim()        || null,
          instructions: dropoffInstructions.trim() || null,
        },
        arrival: {
          city:    arrivalCity.trim()    || null,
          address: arrivalAddress.trim() || null,
          phone:   arrivalPhone.trim()   || null,
        },
      };
      const payload = {
        origin: origin.toUpperCase().trim(),
        destination: destination.toUpperCase().trim(),
        label: label.trim() || `${origin.toUpperCase()} → ${destination.toUpperCase()}`,
        transitDays: parseInt(transitDays) || 14,
        currency, active, fees,
      };
      const url    = isNew ? '/api/routes' : `/api/routes/${r.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setErr(d.error || t.common.error); setSaving(false); return; }
      onSaved?.();
      onClose();
    } catch { setErr(t.common.networkError); setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'white', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header sticky */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button className="btn btn--ghost btn--sm" onClick={onClose}><I.ArrowLeft />{t.common.back}</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{isNew ? t.settings.routes.new : `${t.common.edit} — ${r?.label ?? r?.code ?? ''}`}</div>
        {err && <span style={{ fontSize: 12, color: 'var(--bad-700)' }}>{err}</span>}
        <button className="btn btn--brand" onClick={handleSave} disabled={saving}><I.Check />{saving ? t.common.saving : t.common.save}</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px', width: '100%' }}>

        {/* Section 1 — Infos de base */}
        <SectionTitle>{/* TODO i18n: Informations de base */}Informations de base</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">{t.settings.routes.modal.iataOrigin}</label>
              <input className="input mono" value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} placeholder="DLA" maxLength={6} />
            </div>
            <div className="field">
              <label className="label">{t.settings.routes.modal.iataDest}</label>
              <input className="input mono" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} placeholder="YUL" maxLength={6} />
            </div>
          </div>
          {transportMode === 'sea' && isNew && (
            <div style={{ fontSize: 12, color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', lineHeight: 1.55 }}>
              <strong>Route maritime :</strong> si une route aérienne avec les mêmes codes existe déjà, ajoutez un suffixe pour les différencier — ex&nbsp;: <code>DLAM</code> pour Douala Maritime, <code>SHGM</code> pour Shanghai Maritime.
            </div>
          )}
          <div className="field">
            <label className="label">{/* TODO i18n: Libellé */}Libellé <span className="opt">/ {t.common.optional}</span></label>
            <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Douala → Montréal" />
          </div>
          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">{/* TODO i18n: Transit (jours) */}Transit (jours)</label>
              <input className="input" type="number" value={transitDays} onChange={e => setTransitDays(e.target.value)} min="1" />
            </div>
            <div className="field">
              <label className="label">{t.common.currency}</label>
              <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="CAD">CAD — Dollar canadien</option>
                <option value="USD">USD — Dollar américain</option>
                <option value="EUR">EUR — Euro</option>
                <option value="XAF">XAF — Franc CFA</option>
                <option value="CNY">CNY — Yuan chinois</option>
              </select>
            </div>
          </div>
          {!isNew && (
            <div className="field-row field-row--2">
              <div className="field">
                <label className="label">{t.common.status}</label>
                <select className="select" value={active ? 'active' : 'archived'} onChange={e => setActive(e.target.value === 'active')}>
                  <option value="active">{t.common.active}</option><option value="archived">{t.common.archived}</option>
                </select>
              </div>
            </div>
          )}
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Type de route</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {[
                { v: true,  label: '🌍  Route africaine', desc: 'Sacs, bière SAQ activés' },
                { v: false, label: '🌐  Autre route',     desc: 'Sacs & bière désactivés' },
              ].map(opt => (
                <button key={String(opt.v)} type="button" onClick={() => setAfricanRoute(opt.v)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: `2px solid ${africanRoute === opt.v ? 'var(--brand-500)' : 'var(--border)'}`, background: africanRoute === opt.v ? 'var(--brand-50)' : 'var(--bg-soft)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: africanRoute === opt.v ? 'var(--brand-700)' : 'var(--ink-600)' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 1b — Mode de transport */}
        <SectionTitle>Mode de transport</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: transportMode === 'sea' ? 20 : 0 }}>
            {[{ v: 'air', label: '✈️  Fret aérien' }, { v: 'sea', label: '🚢  Fret maritime' }].map(opt => (
              <button
                key={opt.v}
                type="button"
                onClick={() => switchMode(opt.v)}
                style={{
                  padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  border: transportMode === opt.v ? '2px solid var(--brand-500)' : '2px solid var(--border)',
                  background: transportMode === opt.v ? 'var(--brand-50)' : 'var(--bg-soft)',
                  color: transportMode === opt.v ? 'var(--brand-700)' : 'var(--ink-500)',
                }}
              >{opt.label}</button>
            ))}
          </div>
          {transportMode === 'sea' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Volumineux ($/m³)</label>
                <input className="input mono" type="number" step="10" value={bulkyPerCbm} onChange={e => setBulkyPerCbm(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Seuil haute valeur ($)</label>
                <input className="input mono" type="number" step="50" value={highValueThreshold} onChange={e => setHighValueThreshold(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Supplément haute valeur (%)</label>
                <input className="input mono" type="number" step="0.5" value={highValuePct} onChange={e => setHighValuePct(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Section 2 — Paliers de poids */}
        <SectionTitle>{transportMode === 'sea' ? 'Paliers de poids (poids facturable)' : 'Paliers de poids'}</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 14 }}>
            {/* TODO i18n: tier selection description */}
            Le palier est sélectionné en fonction du poids total du colis. Les taux s'appliquent aux composantes de prix correspondantes.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--bg-soft)' }}>
                  {/* TODO i18n: tier table headers */}
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>De (kg)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>À (kg)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Transport</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Carton</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Manutention</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Douane/Terminal</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Formalités</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '6px 8px' }}><input className="input input--sm mono" type="number" value={tier.from} onChange={e => updTier(tier.id, 'from', e.target.value)} style={{ width: 65 }} /></td>
                    <td style={{ padding: '6px 8px' }}><input className="input input--sm mono" type="number" value={tier.to} onChange={e => updTier(tier.id, 'to', e.target.value)} placeholder="∞" style={{ width: 65 }} /></td>
                    <td style={{ padding: '6px 8px' }}>
                      {/* TODO i18n: Forfait / $/kg / $/carton / $/unité tier type options */}
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.transportType} onChange={e => updTier(tier.id, 'transportType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perKg">$/kg</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.transportValue} onChange={e => updTier(tier.id, 'transportValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.cartonType} onChange={e => updTier(tier.id, 'cartonType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perUnit">$/carton</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.cartonValue} onChange={e => updTier(tier.id, 'cartonValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="select input--sm" value={tier.manutentionType} onChange={e => updTier(tier.id, 'manutentionType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 80 }}>
                          <option value="flat">Forfait</option>
                          <option value="perUnit">$/unité</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.manutentionValue} onChange={e => updTier(tier.id, 'manutentionValue', e.target.value)} style={{ width: 50 }} />
                        {tier.manutentionType === 'perUnit' && (
                          <><span style={{ fontSize: 11, color: 'var(--ink-400)' }}>min</span>
                          <input className="input input--sm mono" type="number" value={tier.manutentionMin} onChange={e => updTier(tier.id, 'manutentionMin', e.target.value)} style={{ width: 45 }} /></>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.douaneType} onChange={e => updTier(tier.id, 'douaneType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perKg">$/kg</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.douaneValue} onChange={e => updTier(tier.id, 'douaneValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.formalitesType} onChange={e => updTier(tier.id, 'formalitesType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perKg">$/kg</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.formalitesValue} onChange={e => updTier(tier.id, 'formalitesValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <button className="icon-btn" onClick={() => delTier(tier.id)} disabled={tiers.length === 1} style={{ color: tiers.length === 1 ? 'var(--ink-200)' : 'var(--bad-400)' }}><I.Trash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={addTier}><I.Plus />{t.common.add} {/* TODO i18n: un palier */}un palier</button>
        </div>

        {/* Section 3 — Emballages & conditionnement */}
        <SectionTitle>Emballages & conditionnement</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${africanRoute ? 5 : 2}, 1fr)`, gap: 12 }}>
            {[
              { label: 'Carton', sub: '(1er palier : forfait)', val: '1', readOnly: true, always: true },
              { label: 'Petit sac',  val: bagSmall,  set: setBagSmall,  african: true },
              { label: 'Moyen sac', val: bagMedium, set: setBagMedium, african: true },
              { label: 'Grand sac', val: bagLarge,  set: setBagLarge,  african: true },
              { label: 'Plastique', sub: '$/unité', val: plastic, set: setPlastic, always: true },
            ].filter(f => f.always || (f.african && africanRoute)).map(f => (
              <div key={f.label} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{f.label}{f.sub && <span className="opt"> {f.sub}</span>}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input mono" type="number" step="0.1" value={f.val} onChange={f.set ? e => f.set(e.target.value) : undefined} readOnly={f.readOnly} style={{ flex: 1, background: f.readOnly ? 'var(--bg-soft)' : undefined }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{currency}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)' }}>
            Le carton est configuré par palier (forfait sur le 1er palier, 1,50 {currency}/carton sur les suivants par défaut).
            {!africanRoute && <span style={{ color: 'var(--ink-300)' }}> · Sacs non disponibles sur cette route.</span>}
          </div>
        </div>

        {/* Section 4 — Frais SAQ (routes africaines uniquement) */}
        {africanRoute && (
          <>
            <SectionTitle>Frais SAQ (bière)</SectionTitle>
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Casier 24 × 65cl', val: saq24x65, set: setSaq24x65 },
                  { label: 'Casier 24 × 33cl', val: saq24x33, set: setSaq24x33 },
                  { label: 'Casier 12 × 50cl', val: saq12x50, set: setSaq12x50 },
                ].map(f => (
                  <div key={f.label} className="field" style={{ marginBottom: 0 }}>
                    <label className="label">{f.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="input mono" type="number" step="0.01" value={f.val} onChange={e => f.set(e.target.value)} style={{ flex: 1 }} />
                      <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Section 5 — Suppléments */}
        <SectionTitle>Suppléments par catégorie</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${africanRoute ? 5 : 4}, 1fr)`, gap: 12 }}>
            {[
              { label: 'Vêtements',    icon: '👗', val: suppVetements,    set: setSuppVetements,    always: true },
              { label: 'Cosmétiques',  icon: '💄', val: suppCosmetique,   set: setSuppCosmetique,   always: true },
              { label: 'Bière',        icon: '🍺', val: suppBiere,        set: setSuppBiere,        african: true },
              { label: 'Électronique', icon: '📱', val: suppElectronique, set: setSuppElectronique, always: true },
              { label: 'Documents',    icon: '📄', val: suppDocuments,    set: setSuppDocuments,    always: true },
            ].filter(f => f.always || (f.african && africanRoute)).map(f => (
              <div key={f.label} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{f.icon} {f.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input mono" type="number" step="0.5" value={f.val} onChange={e => f.set(e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{currency}/kg</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-400)' }}>
            Les suppléments s'ajoutent au transport pour chaque ligne de colis de cette catégorie. Un montant négatif est une réduction.
          </div>
        </div>

        {/* Section 6 — Marge & livraison */}
        <SectionTitle>{/* TODO i18n: Marge & livraison */}Marge & livraison</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">{/* TODO i18n: Marge par défaut (%) */}Marge par défaut (%)</label>
              <input className="input mono" type="number" step="1" value={marginPct} onChange={e => setMarginPct(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">{/* TODO i18n: Livraison île de Montréal */}Livraison île de Montréal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="input mono" type="number" step="1" value={deliveryFeeIle} onChange={e => setDeliveryFeeIle(e.target.value)} style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency}</span>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">{/* TODO i18n: Livraison Grand Montréal */}Livraison Grand Montréal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="input mono" type="number" step="1" value={String(Math.round((parseFloat(deliveryFeeIle) || 25) * 1.2))} readOnly style={{ flex: 1, background: 'var(--bg-soft)' }} />
                <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency} <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>(auto)</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7 — Contact & dépôt (côté départ) */}
        <SectionTitle>{/* TODO i18n: Dépôt — côté départ */}Dépôt — côté départ</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 14, lineHeight: 1.5 }}>
            {/* TODO i18n: dropoff info description */}
            Ces informations sont affichées au client dans sa confirmation de réservation pour qu'il sache où et comment déposer son colis.
          </p>
          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">{/* TODO i18n: Téléphone contact dépôt */}Téléphone contact dépôt</label>
              <PhoneInput value={dropoffPhone} onChange={setDropoffPhone} />
            </div>
            <div className="field">
              <label className="label">WhatsApp</label>
              <PhoneInput value={dropoffWhatsapp} onChange={setDropoffWhatsapp} />
            </div>
          </div>
          <div className="field">
            <label className="label">{/* TODO i18n: Adresse de dépôt */}Adresse de dépôt</label>
            <input className="input" value={dropoffAddress} onChange={e => setDropoffAddress(e.target.value)} placeholder="ex: 45 Rue de la Réunification, Akwa, Douala" />
          </div>
          <div className="field">
            <label className="label">{/* TODO i18n: Horaires */}Horaires</label>
            <input className="input" value={dropoffHours} onChange={e => setDropoffHours(e.target.value)} placeholder="ex: Lun–Sam · 08h–18h" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">{/* TODO i18n: Instructions de dépôt */}Instructions de dépôt <span className="opt">/ {/* TODO i18n */}texte libre</span></label>
            <textarea className="input" rows={4} value={dropoffInstructions} onChange={e => setDropoffInstructions(e.target.value)}
              style={{ resize: 'vertical' }}
              placeholder="ex: Venez avec une pièce d'identité et votre numéro de suivi. Un reçu vous sera remis sur place. Prévenez-nous 24h avant votre venue par WhatsApp." />
          </div>
        </div>

        {/* Section 8 — Retrait côté destination (pour notifications WhatsApp d'arrivée) */}
        <SectionTitle>{/* TODO i18n: Retrait — côté destination */}Retrait — côté destination</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 14, lineHeight: 1.5 }}>
            {/* TODO i18n: arrival info description */}
            Ces informations sont insérées automatiquement dans les notifications WhatsApp d'arrivée envoyées aux clients
            (variables <code style={{ fontSize: 11, background: 'var(--bg-soft)', padding: '1px 5px', borderRadius: 4 }}>{'{destination_city}'}</code>,{' '}
            <code style={{ fontSize: 11, background: 'var(--bg-soft)', padding: '1px 5px', borderRadius: 4 }}>{'{warehouse_address}'}</code>,{' '}
            <code style={{ fontSize: 11, background: 'var(--bg-soft)', padding: '1px 5px', borderRadius: 4 }}>{'{agent_phone}'}</code>).
          </p>
          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">{/* TODO i18n: Ville de destination */}Ville de destination</label>
              <input className="input" value={arrivalCity} onChange={e => setArrivalCity(e.target.value)}
                placeholder="ex: Montréal · ex: Douala" />
            </div>
            <div className="field">
              <label className="label">{/* TODO i18n: Téléphone contact retrait */}Téléphone contact retrait</label>
              <PhoneInput value={arrivalPhone} onChange={setArrivalPhone} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">{/* TODO i18n: Adresse de retrait / entrepôt */}Adresse de retrait / entrepôt</label>
            <input className="input" value={arrivalAddress} onChange={e => setArrivalAddress(e.target.value)}
              placeholder="ex: 5500 Pl. de la Savane, Lachine · ex: 45 Rue de la Réunification, Akwa, Douala" />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Paiement par carte (Authorize.net) ──────────────────── */
function SectionPaymentGateway() {
  const FIELDS_DEFAULT = { authnet_login_id: '', authnet_client_key: '', authnet_transaction_key: '', authnet_environment: 'sandbox' };
  const [fields, setFields]   = useState(FIELDS_DEFAULT);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [err,    setErr]      = useState('');
  const [showTx, setShowTx]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | { ok, error }

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setFields(prev => ({
        authnet_login_id:        d.authnet_login_id        ?? prev.authnet_login_id,
        authnet_client_key:      d.authnet_client_key      ?? prev.authnet_client_key,
        authnet_transaction_key: d.authnet_transaction_key ?? prev.authnet_transaction_key,
        authnet_environment:     d.authnet_environment     ?? prev.authnet_environment,
      }));
    }).catch(() => {});
  }, []);

  const set = k => e => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true); setSaved(false); setErr(''); setTestResult(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setErr(e?.message ?? 'Erreur'); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true); setTestResult(null); setErr('');
    try {
      const res = await fetch('/api/settings/authnet-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      let json;
      try { json = await res.json(); }
      catch { json = { ok: false, error: `Erreur serveur (HTTP ${res.status})` }; }
      setTestResult(json);
    } catch (e) {
      setTestResult({ ok: false, error: e?.message ?? 'Impossible de joindre le serveur' });
    }
    finally { setTesting(false); }
  }

  const env = fields.authnet_environment;
  const configured = !!(fields.authnet_login_id && fields.authnet_client_key && fields.authnet_transaction_key);

  return (
    <SettingsCard
      title="Paiement par carte"
      sub="Connectez votre compte Authorize.net pour accepter Visa, Mastercard et Amex directement depuis l'espace client."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost btn--sm" onClick={handleTest} disabled={testing || saving}>
            {testing ? 'Test…' : '⚡ Tester'}
          </button>
          <button className="btn btn--brand btn--sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Enregistrer'}
          </button>
        </div>
      }>

      {/* Status badge + test result */}
      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {configured
          ? <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'var(--ok-100)', color: 'var(--ok-700)' }}>✓ Configuré · {env === 'production' ? 'Production' : 'Sandbox'}</span>
          : <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'var(--bad-100)', color: 'var(--bad-700)' }}>Non configuré</span>
        }
        {testResult && (
          <div style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: testResult.ok ? 'var(--ok-100)' : 'var(--bad-50)', color: testResult.ok ? 'var(--ok-700)' : 'var(--bad-700)', border: `1px solid ${testResult.ok ? 'var(--ok-200)' : 'var(--bad-200)'}`, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700 }}>{testResult.ok ? '✓ Connexion Authorize.net OK' : `✗ ${testResult.error}`}</div>
            {testResult.debug && !testResult.ok && (
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, marginTop: 3, opacity: .8 }}>
                Login ID testé : {testResult.debug.loginId} · TX Key : {testResult.debug.txKeyLength} chars · Env : {testResult.debug.environment}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Environment toggle */}
      <div className="field">
        <label className="label">Environnement</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {['sandbox', 'production'].map(e => (
            <button key={e}
              className={'btn btn--sm ' + (env === e ? 'btn--brand' : 'btn--ghost')}
              onClick={() => setFields(f => ({ ...f, authnet_environment: e }))}>
              {e === 'sandbox' ? '🧪 Sandbox' : '🚀 Production'}
            </button>
          ))}
        </div>
        {env === 'sandbox' && (
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>
            Mode test — aucun vrai débit. Basculez en Production quand vous êtes prêt.
          </div>
        )}
      </div>

      {/* API Login ID */}
      <div className="field">
        <label className="label">API Login ID</label>
        <input className="input mono" value={fields.authnet_login_id} onChange={set('authnet_login_id')} placeholder="Votre API Login ID Authorize.net" />
      </div>

      {/* Public Client Key */}
      <div className="field">
        <label className="label">Public Client Key</label>
        <input className="input mono" value={fields.authnet_client_key} onChange={set('authnet_client_key')} placeholder="Clé publique Accept.js (Compte Authorize.net → Sécurité → Manage Public Client Key)" />
        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 4 }}>
          Sécurité → Manage Public Client Key dans votre tableau de bord Authorize.net.
        </div>
      </div>

      {/* Transaction Key — masked */}
      <div className="field">
        <label className="label">
          Transaction Key
          <button onClick={() => setShowTx(v => !v)}
            style={{ marginLeft: 8, fontSize: 11, color: 'var(--brand-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {showTx ? 'Masquer' : 'Afficher'}
          </button>
        </label>
        <input
          className="input mono"
          type={showTx ? 'text' : 'password'}
          value={fields.authnet_transaction_key}
          onChange={set('authnet_transaction_key')}
          placeholder="Clé de transaction (confidentielle — jamais exposée au client)"
          autoComplete="off"
        />
        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 4 }}>
          Compte Authorize.net → Sécurité → API Credentials & Keys.
        </div>
      </div>

      {err && <div style={{ fontSize: 13, color: 'var(--bad-700)', background: 'var(--bad-50)', borderRadius: 8, padding: '10px 12px' }}>{err}</div>}

      <div style={{ fontSize: 12.5, color: 'var(--ink-400)', borderTop: '1px solid var(--border-soft)', paddingTop: 14, lineHeight: 1.65 }}>
        La Transaction Key n'est jamais transmise au navigateur client — elle reste côté serveur uniquement.<br />
        Les numéros de carte sont tokenisés directement par Authorize.net (scope PCI SAQ A).
      </div>
    </SettingsCard>
  );
}

/* ── Main screen ──────────────────────────────────────────── */
export default function SettingsScreen({ onNav }) {
  const t = useAdminT();
  const initialTab = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('tab') ?? 'company')
    : 'company';
  const [section, setSection]         = useState(initialTab);
  const [editRoute, setEditRoute]     = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);
  const [routes, setRoutes]           = useState([]);

  const loadRoutes = () =>
    fetch('/api/routes').then(r => r.json()).then(data => setRoutes(Array.isArray(data) ? data : [])).catch(() => {});

  useEffect(() => { loadRoutes(); }, []);

  useEffect(() => {
    const handler = (e) => setSection(e.detail ?? 'company');
    window.addEventListener('jumla:nav-settings', handler);
    return () => window.removeEventListener('jumla:nav-settings', handler);
  }, []);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title">{t.settings.title}</div>
          <div className="page__sub">{/* TODO i18n: "Configurez votre entreprise, vos routes, vos tarifs et vos automatisations" */}Configurez votre entreprise, vos routes, vos tarifs et vos automatisations</div>
        </div>
      </div>

      <div>
        {/* Content */}
        <div>
          {section === 'company'   && <SectionCompany />}
          {section === 'landing'   && <LandingEditor />}
          {section === 'routes'    && (
            <>
              <SectionRoutes routes={routes} onEdit={setEditRoute} onDetail={setRouteDetail} />
              <SectionPricing routes={routes} onEdit={setEditRoute} />
            </>
          )}
          {section === 'devises'   && <SectionDevises routes={routes} />}
          {section === 'whatsapp'  && <><SectionWhatsapp /><SectionPushSetup /><SectionWaTemplates /></>}
          {section === 'auto'      && <SectionAutoNotif />}
          {section === 'campaigns' && <SectionCampaigns />}
          {section === 'codes'     && <SectionCodes />}
          {section === 'payment'   && <SectionPaymentGateway />}
        </div>
      </div>

      {editRoute && (
        <RouteEditModal
          editRoute={editRoute}
          onClose={() => setEditRoute(null)}
          onSaved={loadRoutes}
        />
      )}

      {routeDetail && (
        <Drawer onClose={() => setRouteDetail(null)}>
          <div className="drawer__head">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{routeDetail.label || routeDetail.code}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4, display: 'flex', gap: 8 }}>
                <RoutePill from={routeDetail.fromIATA} to={routeDetail.toIATA} />
                <span>{routeDetail.active ? `✓ ${t.common.active}` : t.common.archived}</span>
                <span>· Transit {routeDetail.transitDays ?? 14} j · {routeDetail.currency ?? 'CAD'}</span>
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => { setRouteDetail(null); setEditRoute(routeDetail); }}><I.Edit />{t.common.edit}</button>
          </div>
          <div className="drawer__body" style={{ padding: 22 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>{/* TODO i18n: Grille tarifaire */}Grille tarifaire</div>
            {routeDetail.fees?.tiers?.length > 0 ? (
              <TarifGrid
                tiers={routeDetail.fees.tiers}
                fees={{ ...DEFAULT_FEES_META, ...routeDetail.fees }}
                currency={routeDetail.currency ?? 'CAD'}
                isDefault={false}
              />
            ) : (
              <TarifGrid
                tiers={DEFAULT_TIERS}
                fees={DEFAULT_FEES_META}
                currency={routeDetail.currency ?? 'CAD'}
                isDefault={true}
              />
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
