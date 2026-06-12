'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/src/styles/tokens.css';

export default function ForgotPasswordPage() {
  const router  = useRouter();
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [errMsg, setErrMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus('sent');
    } catch {
      setErrMsg('Erreur réseau. Réessayez.');
      setStatus('error');
    }
  }

  const input = {
    width: '100%', height: 42, padding: '0 12px', fontSize: 14,
    border: '1.5px solid #d1d5db', background: 'white',
    outline: 'none', boxSizing: 'border-box',
  };
  const btn = {
    width: '100%', height: 44, background: '#1a1408', color: 'white',
    border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    opacity: status === 'loading' ? .6 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '40px 36px' }}>
          {/* Logo */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#F5A524,#D97706)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, color: 'white' }}>J</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1408' }}>Jumla Shipping</div>
            </div>
          </div>

          {status === 'sent' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: '#111827' }}>Email envoyé</h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <button onClick={() => router.push('/login')} style={{ ...btn, background: '#f3f4f6', color: '#374151' }}>
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Mot de passe oublié</h2>
              <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#6b7280' }}>
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              {(status === 'error') && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{errMsg}</div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Adresse email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.com" style={input} autoFocus />
                </div>
                <button type="submit" disabled={status === 'loading'} style={btn}>
                  {status === 'loading' ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
                  ← Retour à la connexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
