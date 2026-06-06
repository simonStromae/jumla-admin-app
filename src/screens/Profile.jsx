import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import I from '../components/Icons.jsx';
import { Avatar } from '../components/Shell.jsx';

export default function ProfileScreen({ onNav }) {
  const { data: session } = useSession();
  const user = session?.user;
  const [pwData, setPwData] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const roleLabel =
    user?.role === 'admin' ? 'Administrateur'
    : user?.role === 'agent' ? 'Agent'
    : user?.role || '—';

  const upd = (k, v) => setPwData(d => ({ ...d, [k]: v }));

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (!pwData.current) { setPwMsg('Veuillez saisir le mot de passe actuel.'); return; }
    if (pwData.next.length < 6) { setPwMsg('Le nouveau mot de passe doit contenir au moins 6 caractères.'); return; }
    if (pwData.next !== pwData.confirm) { setPwMsg('Les mots de passe ne correspondent pas.'); return; }
    setPwSaving(true);
    // TODO: implement /api/auth/change-password endpoint
    // await fetch('/api/auth/change-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ current: pwData.current, next: pwData.next }),
    // });
    await new Promise(r => setTimeout(r, 1000));
    setPwSaving(false);
    setPwMsg('success');
    setPwData({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="page" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page__head">
        <div className="page__title">Mon profil</div>
      </div>

      {/* Identity card */}
      <div className="card" style={{ padding: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--brand-100)', color: 'var(--brand-700)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, flexShrink: 0,
          fontFamily: 'var(--ff-mono)',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>
            {user?.name || '—'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-500)', marginBottom: 8 }}>
            {user?.email || '—'}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: user?.role === 'admin' ? 'var(--brand-100)' : 'var(--ok-50)',
            color: user?.role === 'admin' ? 'var(--brand-700)' : 'var(--ok-700)',
            border: '1px solid ' + (user?.role === 'admin' ? 'var(--brand-200)' : 'var(--ok-100)'),
          }}>
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Password change */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 18 }}>
          Changer le mot de passe
        </div>
        <form onSubmit={handlePasswordChange}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="label">Mot de passe actuel</label>
            <input
              className="input"
              type="password"
              value={pwData.current}
              onChange={e => upd('current', e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="label">Nouveau mot de passe</label>
            <input
              className="input"
              type="password"
              value={pwData.next}
              onChange={e => upd('next', e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label className="label">Confirmer le nouveau mot de passe</label>
            <input
              className="input"
              type="password"
              value={pwData.confirm}
              onChange={e => upd('confirm', e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {pwMsg && pwMsg !== 'success' && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
              background: 'var(--bad-50)', border: '1px solid var(--bad-100)', color: 'var(--bad-700)',
            }}>
              {pwMsg}
            </div>
          )}
          {pwMsg === 'success' && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
              background: 'var(--ok-50)', border: '1px solid var(--ok-100)', color: 'var(--ok-700)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <I.Check style={{ width: 14, height: 14 }} />
              Mot de passe mis à jour avec succès.
            </div>
          )}

          <button className="btn btn--brand" type="submit" disabled={pwSaving}>
            {pwSaving ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 6 }}>
          Session
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 16 }}>
          Vous serez redirigé vers la page de connexion.
        </div>
        <button
          className="btn btn--ghost"
          style={{ color: 'var(--bad-600)', borderColor: 'var(--bad-200)' }}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <I.Logout />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
