'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import I from '@/src/components/Icons.jsx';

export default function ChangePasswordPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) { setError('Au moins 8 caractères requis.'); return; }
    if (form.newPassword !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: form.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Erreur'); setLoading(false); return; }
      // Refresh session to clear mustChangePassword flag
      await updateSession({ mustChangePassword: false });
      router.push('/admin/campaigns');
    } catch {
      setError('Erreur réseau');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-soft)' }}>
      <div style={{ width: 420, background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,.10)', padding: 36 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--brand-50)', border: '2px solid var(--brand-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <I.Lock style={{ width: 22, height: 22, color: 'var(--brand-600)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Créer votre mot de passe</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0, lineHeight: 1.5 }}>
            Votre compte a été créé avec un mot de passe temporaire.<br />
            Choisissez un nouveau mot de passe pour continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="label">Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={show ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => upd('newPassword', e.target.value)}
                placeholder="Minimum 8 caractères"
                style={{ paddingRight: 40 }}
                autoFocus
              />
              <button type="button" onClick={() => setShow(s => !s)}
                style={{ position: 'absolute', right: 10, top: 9, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', padding: 2 }}>
                {show ? <I.EyeOff style={{ width: 16, height: 16 }} /> : <I.Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="label">Confirmer le mot de passe</label>
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={form.confirm}
              onChange={e => upd('confirm', e.target.value)}
              placeholder="Répétez le mot de passe"
            />
          </div>

          {error && (
            <div style={{ background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--bad-700)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--brand" disabled={loading} style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}>
            <I.Check />{loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
