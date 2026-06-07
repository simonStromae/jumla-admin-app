'use client';
import { useRouter, useSearchParams, Suspense } from 'next/navigation';

function SuiviContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';
  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Suivi de colis</h2>
      <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginBottom: 24 }}>
        Entrez votre numéro de suivi pour voir l'état de votre colis.
      </p>
      <form onSubmit={e => { e.preventDefault(); const v = e.target.code.value.trim(); if (v) router.push('/client/suivi?code=' + encodeURIComponent(v)); }}
        style={{ display: 'flex', gap: 10 }}>
        <input name="code" defaultValue={code} placeholder="JMS-12345" className="input" style={{ flex: 1 }} />
        <button type="submit" className="btn btn--brand">Suivre</button>
      </form>
      {code && (
        <div style={{ marginTop: 24, padding: 20, background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
          <p style={{ color: 'var(--ink-400)', fontSize: 13 }}>
            Fonctionnalité de suivi public à venir. Consultez <strong>Mes colis</strong> pour le suivi de vos envois.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ClientSuiviPage() {
  return <Suspense><SuiviContent /></Suspense>;
}
