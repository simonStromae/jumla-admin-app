'use client';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import I from '../components/Icons.jsx';
import { useT } from '../lib/i18n';

const ADDR_KEY = 'jumla_addresses';

function loadAddresses() {
  try {
    return JSON.parse(localStorage.getItem(ADDR_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAddresses(list) {
  localStorage.setItem(ADDR_KEY, JSON.stringify(list));
}

const card = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: '0 1px 1px rgba(15,23,42,.04)',
  padding: 24,
  marginBottom: 18,
};

const cardTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--ink-900)',
  marginBottom: 18,
};

const inputStyle = {
  width: '100%',
  height: 36,
  padding: '0 11px',
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--ink-800)',
  boxSizing: 'border-box',
};

const inputReadOnly = {
  ...inputStyle,
  background: 'var(--bg-soft)',
  color: 'var(--ink-400)',
  cursor: 'not-allowed',
};

const label = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-700)',
  marginBottom: 5,
};

const fieldStyle = { marginBottom: 14 };

const btnBrand = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  height: 34,
  padding: '0 13px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid transparent',
  background: 'var(--brand-500)',
  color: 'white',
};

const btnGhost = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  height: 34,
  padding: '0 13px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--ink-600)',
};

const btnDanger = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  height: 34,
  padding: '0 13px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid var(--bad-200)',
  background: 'transparent',
  color: 'var(--bad-600)',
};

const alertOk = {
  padding: '10px 14px',
  borderRadius: 8,
  marginBottom: 14,
  fontSize: 13,
  background: 'var(--ok-50)',
  border: '1px solid var(--ok-100)',
  color: 'var(--ok-700)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const alertBad = {
  padding: '10px 14px',
  borderRadius: 8,
  marginBottom: 14,
  fontSize: 13,
  background: 'var(--bad-50)',
  border: '1px solid var(--bad-100)',
  color: 'var(--bad-700)',
};

export default function ClientProfile() {
  const t = useT();

  // --- Profile info ---
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', city: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    fetch('/api/me/profile')
      .then(r => r.json())
      .then(d => {
        setProfile({ name: d.name ?? '', email: d.email ?? '', phone: d.phone ?? '', city: d.city ?? '' });
        setAddresses(Array.isArray(d.savedAddresses) ? d.savedAddresses : []);
        setRecipients(Array.isArray(d.savedRecipients) ? d.savedRecipients : []);
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    if (!profile.name.trim()) { setProfileMsg('error:' + t('profile.info.name')); return; }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, city: profile.city }),
      });
      if (!res.ok) {
        const d = await res.json();
        setProfileMsg('error:' + (d.error || t('error.network')));
      } else {
        setProfileMsg('success');
      }
    } catch {
      setProfileMsg('error:' + t('error.network'));
    }
    setProfileSaving(false);
  };

  // --- Addresses (stored in DB) ---
  const [addresses, setAddresses] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', address: '', apt: '', city: '', province: '', postal: '' });

  // --- Recipients (stored in DB) ---
  const [recipients, setRecipients] = useState([]);
  const [showRecipForm, setShowRecipForm] = useState(false);
  const [newRecip, setNewRecip] = useState({ label: '', name: '', phone: '', city: '' });

  const saveAddressesToDB = async (list) => {
    try {
      await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedAddresses: list }),
      });
    } catch {}
  };

  const handleAddAddress = async () => {
    if (!newAddr.address.trim()) return;
    const entry = { ...newAddr, id: Date.now().toString() };
    const updated = [...addresses, entry];
    setAddresses(updated);
    await saveAddressesToDB(updated);
    setNewAddr({ label: '', address: '', apt: '', city: '', province: '', postal: '' });
    setShowAddrForm(false);
  };

  const handleDeleteAddress = async (id) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    await saveAddressesToDB(updated);
  };

  const saveRecipientsToDB = async (list) => {
    try {
      await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedRecipients: list }),
      });
    } catch {}
  };

  const handleAddRecipient = async () => {
    if (!newRecip.name.trim()) return;
    const entry = { ...newRecip, id: Date.now().toString() };
    const updated = [...recipients, entry];
    setRecipients(updated);
    await saveRecipientsToDB(updated);
    setNewRecip({ label: '', name: '', phone: '', city: '' });
    setShowRecipForm(false);
  };

  const handleDeleteRecipient = async (id) => {
    const updated = recipients.filter(r => r.id !== id);
    setRecipients(updated);
    await saveRecipientsToDB(updated);
  };

  // --- Delete account ---
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      const res = await fetch('/api/client/account', { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) {
        setDeleteErr(d.error || 'Erreur lors de la suppression');
        setDeleting(false);
        return;
      }
      signOut({ callbackUrl: '/' });
    } catch {
      setDeleteErr('Erreur réseau');
      setDeleting(false);
    }
  };

  // --- Password ---
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (!pw.currentPassword) { setPwMsg('error:' + t('profile.security.current')); return; }
    if (pw.newPassword.length < 8) { setPwMsg('error:' + t('error.passwordMismatch')); return; }
    if (pw.newPassword !== pw.confirmPassword) { setPwMsg('error:' + t('error.passwordMismatch')); return; }
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPwMsg('error:' + (d.error || t('error.network')));
      } else {
        setPwMsg('success');
        setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      setPwMsg('error:' + t('error.network'));
    }
    setPwSaving(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-900)', marginBottom: 24 }}>
        {t('profile.title')}
      </div>

      {/* Card 1 — info */}
      <div style={card}>
        <div style={cardTitle}>{t('profile.info.title')}</div>
        {profileLoading ? (
          <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>{t('loading')}</div>
        ) : (
          <form onSubmit={handleProfileSave}>
            <div style={fieldStyle}>
              <label style={label}>{t('profile.info.name')}</label>
              <input
                style={inputStyle}
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder={t('profile.info.namePlaceholder')}
                autoComplete="name"
              />
            </div>
            <div style={fieldStyle}>
              <label style={label}>{t('profile.info.email')}</label>
              <input
                style={inputReadOnly}
                type="email"
                value={profile.email}
                readOnly
                tabIndex={-1}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={label}>{t('profile.info.phone')}</label>
                <input
                  style={inputStyle}
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 514 000 0000"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label style={label}>{t('profile.info.city')}</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={profile.city}
                  onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                  placeholder={t('profile.info.cityPlaceholder')}
                />
              </div>
            </div>

            {profileMsg && profileMsg !== 'success' && (
              <div style={alertBad}>{profileMsg.replace('error:', '')}</div>
            )}
            {profileMsg === 'success' && (
              <div style={alertOk}>
                <I.Check style={{ width: 14, height: 14, flexShrink: 0 }} />
                {t('profile.info.saved')}
              </div>
            )}

            <button type="submit" style={btnBrand} disabled={profileSaving}>
              {profileSaving ? t('profile.info.saving') : t('profile.info.save')}
            </button>
          </form>
        )}
      </div>

      {/* Card 2 — Addresses */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={cardTitle}>{t('profile.addresses.title')}</div>
          <button
            type="button"
            style={{ ...btnGhost, height: 30, fontSize: 12 }}
            onClick={() => setShowAddrForm(v => !v)}
          >
            <I.Plus style={{ width: 12, height: 12 }} />
            {t('profile.addresses.add')}
          </button>
        </div>

        {addresses.length === 0 && !showAddrForm && (
          <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
            {t('profile.addresses.empty')}
          </div>
        )}

        {addresses.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '12px 14px', marginBottom: 8,
            background: 'var(--bg-soft)', borderRadius: 8,
            border: '1px solid var(--border-soft)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {a.label && (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 3 }}>
                  {a.label}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--ink-800)' }}>
                {a.address}{a.apt ? `, apt. ${a.apt}` : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
                {[a.city, a.province, a.postal].filter(Boolean).join(', ')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteAddress(a.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-400)', padding: 4, marginLeft: 8, flexShrink: 0,
              }}
              title={t('profile.addresses.delete')}
            >
              <I.Trash style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ))}

        {showAddrForm && (
          <div style={{
            padding: 16, marginTop: 12,
            background: 'var(--bg-soft)', borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 12 }}>
              {t('profile.addresses.new')}
            </div>
            <div style={fieldStyle}>
              <label style={label}>{t('profile.addresses.label')} <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>({t('profile.addresses.optional')})</span></label>
              <input style={inputStyle} type="text" placeholder={t('profile.addresses.labelPlaceholder')}
                value={newAddr.label} onChange={e => setNewAddr(a => ({ ...a, label: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label style={label}>{t('profile.addresses.address')}</label>
              <input style={inputStyle} type="text" placeholder={t('profile.addresses.addressPlaceholder')}
                value={newAddr.address} onChange={e => setNewAddr(a => ({ ...a, address: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={label}>{t('profile.addresses.apt')} <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>({t('profile.addresses.optional')})</span></label>
                <input style={inputStyle} type="text" placeholder={t('profile.addresses.aptPlaceholder')}
                  value={newAddr.apt} onChange={e => setNewAddr(a => ({ ...a, apt: e.target.value }))} />
              </div>
              <div>
                <label style={label}>{t('profile.info.city')}</label>
                <input style={inputStyle} type="text" placeholder={t('profile.info.cityPlaceholder')}
                  value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} />
              </div>
              <div>
                <label style={label}>{t('profile.addresses.province')}</label>
                <input style={inputStyle} type="text" placeholder="QC"
                  value={newAddr.province} onChange={e => setNewAddr(a => ({ ...a, province: e.target.value }))} />
              </div>
              <div>
                <label style={label}>{t('profile.addresses.postal')}</label>
                <input style={inputStyle} type="text" placeholder="H1A 1A1"
                  value={newAddr.postal} onChange={e => setNewAddr(a => ({ ...a, postal: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnBrand} onClick={handleAddAddress}
                disabled={!newAddr.address.trim()}>
                <I.Check style={{ width: 13, height: 13 }} />
                {t('profile.addresses.addBtn')}
              </button>
              <button type="button" style={btnGhost} onClick={() => {
                setShowAddrForm(false);
                setNewAddr({ label: '', address: '', apt: '', city: '', province: '', postal: '' });
              }}>
                {t('profile.addresses.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card 3 — Recipients */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={cardTitle}>{t('profile.recipients.title')}</div>
          <button
            type="button"
            style={{ ...btnGhost, height: 30, fontSize: 12 }}
            onClick={() => setShowRecipForm(v => !v)}
          >
            <I.Plus style={{ width: 12, height: 12 }} />
            {t('profile.recipients.add')}
          </button>
        </div>

        {recipients.length === 0 && !showRecipForm && (
          <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
            {t('profile.recipients.empty')}
          </div>
        )}

        {recipients.map(r => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '10px 14px', marginBottom: 8,
            background: 'var(--bg-soft)', borderRadius: 8,
            border: '1px solid var(--border-soft)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {r.label && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{r.label}</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 1 }}>
                {[r.phone, r.city].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteRecipient(r.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', padding: 4, marginLeft: 8, flexShrink: 0 }}
              title={t('profile.recipients.delete')}
            >
              <I.Trash style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ))}

        {showRecipForm && (
          <div style={{ padding: 16, marginTop: 12, background: 'var(--bg-soft)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 12 }}>{t('profile.recipients.new')}</div>
            <div style={fieldStyle}>
              <label style={label}>{t('profile.recipients.label')} <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>({t('profile.recipients.optional')})</span></label>
              <input style={inputStyle} type="text" placeholder={t('profile.recipients.labelPlaceholder')}
                value={newRecip.label} onChange={e => setNewRecip(r => ({ ...r, label: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label style={label}>{t('profile.recipients.name')}</label>
              <input style={inputStyle} type="text" placeholder={t('profile.recipients.namePlaceholder')}
                value={newRecip.name} onChange={e => setNewRecip(r => ({ ...r, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={label}>{t('profile.recipients.phone')}</label>
                <input style={inputStyle} type="tel" placeholder="+237 6XX XXX XXX"
                  value={newRecip.phone} onChange={e => setNewRecip(r => ({ ...r, phone: e.target.value }))} />
              </div>
              <div>
                <label style={label}>{t('profile.recipients.city')}</label>
                <input style={inputStyle} type="text" placeholder={t('profile.recipients.cityPlaceholder')}
                  value={newRecip.city} onChange={e => setNewRecip(r => ({ ...r, city: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnBrand} onClick={handleAddRecipient} disabled={!newRecip.name.trim()}>
                <I.Check style={{ width: 13, height: 13 }} />
                {t('profile.recipients.addBtn')}
              </button>
              <button type="button" style={btnGhost} onClick={() => {
                setShowRecipForm(false);
                setNewRecip({ label: '', name: '', phone: '', city: '' });
              }}>
                {t('profile.recipients.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card 4 — Security */}
      <div style={card}>
        <div style={cardTitle}>{t('profile.security.title')}</div>
        <form onSubmit={handlePasswordChange}>
          <div style={fieldStyle}>
            <label style={label}>{t('profile.security.current')}</label>
            <input
              style={inputStyle}
              type="password"
              value={pw.currentPassword}
              onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div style={fieldStyle}>
            <label style={label}>{t('profile.security.new')}</label>
            <input
              style={inputStyle}
              type="password"
              value={pw.newPassword}
              onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
              placeholder={t('profile.security.newHint')}
              autoComplete="new-password"
            />
          </div>
          <div style={{ ...fieldStyle, marginBottom: 18 }}>
            <label style={label}>{t('profile.security.confirm')}</label>
            <input
              style={inputStyle}
              type="password"
              value={pw.confirmPassword}
              onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {pwMsg && pwMsg !== 'success' && (
            <div style={alertBad}>{pwMsg.replace('error:', '')}</div>
          )}
          {pwMsg === 'success' && (
            <div style={alertOk}>
              <I.Check style={{ width: 14, height: 14, flexShrink: 0 }} />
              {t('profile.security.success')}
            </div>
          )}

          <button type="submit" style={btnBrand} disabled={pwSaving}>
            {pwSaving ? t('profile.security.updating') : t('profile.security.update')}
          </button>
        </form>
      </div>

      {/* Card 5 — Danger */}
      <div style={card}>
        <div style={cardTitle}>{t('profile.danger.title')}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 16 }}>
          {t('profile.danger.logoutHint')}
        </div>
        <button
          type="button"
          style={btnDanger}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <I.Logout style={{ width: 14, height: 14 }} />
          {t('profile.danger.logout')}
        </button>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bad-700)', marginBottom: 6 }}>
            Supprimer mon compte
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 14 }}>
            Cette action est irréversible. Votre compte et vos données seront définitivement supprimés.
          </div>
          {deleteErr && (
            <div style={{ ...alertBad, marginBottom: 14 }}>{deleteErr}</div>
          )}
          {!deleteConfirm ? (
            <button type="button" style={btnDanger} onClick={() => setDeleteConfirm(true)}>
              <I.Trash style={{ width: 14, height: 14 }} />
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bad-700)' }}>
                Êtes-vous sûr ? Cette action ne peut pas être annulée.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={{ ...btnDanger, background: 'var(--bad-600)', color: 'white', border: 'none' }}
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  <I.Trash style={{ width: 14, height: 14 }} />
                  {deleting ? 'Suppression...' : 'Confirmer la suppression'}
                </button>
                <button type="button" style={btnGhost} onClick={() => { setDeleteConfirm(false); setDeleteErr(''); }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
