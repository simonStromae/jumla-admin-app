'use client';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import I from '../components/Icons.jsx';

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
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    if (!profile.name.trim()) { setProfileMsg('error:Le nom est obligatoire.'); return; }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, city: profile.city }),
      });
      if (!res.ok) {
        const d = await res.json();
        setProfileMsg('error:' + (d.error || 'Erreur lors de la sauvegarde.'));
      } else {
        setProfileMsg('success');
      }
    } catch {
      setProfileMsg('error:Erreur réseau.');
    }
    setProfileSaving(false);
  };

  // --- Addresses ---
  const [addresses, setAddresses] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', address: '', apt: '', city: '', province: '', postal: '' });

  useEffect(() => {
    setAddresses(loadAddresses());
  }, []);

  const handleAddAddress = () => {
    if (!newAddr.address.trim()) return;
    const entry = { ...newAddr, id: Date.now().toString() };
    const updated = [...addresses, entry];
    setAddresses(updated);
    saveAddresses(updated);
    setNewAddr({ label: '', address: '', apt: '', city: '', province: '', postal: '' });
    setShowAddrForm(false);
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    saveAddresses(updated);
  };

  // --- Password ---
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (!pw.currentPassword) { setPwMsg('error:Veuillez saisir le mot de passe actuel.'); return; }
    if (pw.newPassword.length < 8) { setPwMsg('error:Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    if (pw.newPassword !== pw.confirmPassword) { setPwMsg('error:Les mots de passe ne correspondent pas.'); return; }
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPwMsg('error:' + (d.error || 'Erreur lors du changement.'));
      } else {
        setPwMsg('success');
        setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      setPwMsg('error:Erreur réseau.');
    }
    setPwSaving(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-900)', marginBottom: 24 }}>
        Mon profil
      </div>

      {/* Card 1 — Mes informations */}
      <div style={card}>
        <div style={cardTitle}>Mes informations</div>
        {profileLoading ? (
          <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>Chargement…</div>
        ) : (
          <form onSubmit={handleProfileSave}>
            <div style={fieldStyle}>
              <label style={label}>Nom complet</label>
              <input
                style={inputStyle}
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Votre nom"
                autoComplete="name"
              />
            </div>
            <div style={fieldStyle}>
              <label style={label}>Adresse e-mail</label>
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
                <label style={label}>Téléphone</label>
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
                <label style={label}>Ville</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={profile.city}
                  onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                  placeholder="Montréal"
                />
              </div>
            </div>

            {profileMsg && profileMsg !== 'success' && (
              <div style={alertBad}>{profileMsg.replace('error:', '')}</div>
            )}
            {profileMsg === 'success' && (
              <div style={alertOk}>
                <I.Check style={{ width: 14, height: 14, flexShrink: 0 }} />
                Informations mises à jour.
              </div>
            )}

            <button type="submit" style={btnBrand} disabled={profileSaving}>
              {profileSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        )}
      </div>

      {/* Card 2 — Adresses de livraison */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={cardTitle}>Adresses de livraison</div>
          <button
            type="button"
            style={{ ...btnGhost, height: 30, fontSize: 12 }}
            onClick={() => setShowAddrForm(v => !v)}
          >
            <I.Plus style={{ width: 12, height: 12 }} />
            Ajouter
          </button>
        </div>

        {addresses.length === 0 && !showAddrForm && (
          <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
            Aucune adresse enregistrée.
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
              title="Supprimer"
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
              Nouvelle adresse
            </div>
            <div style={fieldStyle}>
              <label style={label}>Étiquette <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>(optionnel)</span></label>
              <input style={inputStyle} type="text" placeholder="ex: Maison, Bureau…"
                value={newAddr.label} onChange={e => setNewAddr(a => ({ ...a, label: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label style={label}>Adresse</label>
              <input style={inputStyle} type="text" placeholder="123 rue Exemple"
                value={newAddr.address} onChange={e => setNewAddr(a => ({ ...a, address: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={label}>Appartement <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>(optionnel)</span></label>
                <input style={inputStyle} type="text" placeholder="Apt. 4B"
                  value={newAddr.apt} onChange={e => setNewAddr(a => ({ ...a, apt: e.target.value }))} />
              </div>
              <div>
                <label style={label}>Ville</label>
                <input style={inputStyle} type="text" placeholder="Montréal"
                  value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} />
              </div>
              <div>
                <label style={label}>Province</label>
                <input style={inputStyle} type="text" placeholder="QC"
                  value={newAddr.province} onChange={e => setNewAddr(a => ({ ...a, province: e.target.value }))} />
              </div>
              <div>
                <label style={label}>Code postal</label>
                <input style={inputStyle} type="text" placeholder="H1A 1A1"
                  value={newAddr.postal} onChange={e => setNewAddr(a => ({ ...a, postal: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnBrand} onClick={handleAddAddress}
                disabled={!newAddr.address.trim()}>
                <I.Check style={{ width: 13, height: 13 }} />
                Ajouter l'adresse
              </button>
              <button type="button" style={btnGhost} onClick={() => {
                setShowAddrForm(false);
                setNewAddr({ label: '', address: '', apt: '', city: '', province: '', postal: '' });
              }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card 3 — Sécurité */}
      <div style={card}>
        <div style={cardTitle}>Sécurité</div>
        <form onSubmit={handlePasswordChange}>
          <div style={fieldStyle}>
            <label style={label}>Mot de passe actuel</label>
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
            <label style={label}>Nouveau mot de passe</label>
            <input
              style={inputStyle}
              type="password"
              value={pw.newPassword}
              onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="••••••••  (min. 8 caractères)"
              autoComplete="new-password"
            />
          </div>
          <div style={{ ...fieldStyle, marginBottom: 18 }}>
            <label style={label}>Confirmer le nouveau mot de passe</label>
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
              Mot de passe mis à jour avec succès.
            </div>
          )}

          <button type="submit" style={btnBrand} disabled={pwSaving}>
            {pwSaving ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>

      {/* Card 4 — Danger */}
      <div style={card}>
        <div style={cardTitle}>Danger</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 16 }}>
          Vous serez redirigé vers la page de connexion.
        </div>
        <button
          type="button"
          style={btnDanger}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <I.Logout style={{ width: 14, height: 14 }} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
