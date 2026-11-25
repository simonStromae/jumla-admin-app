'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 18, height: 18 }}>
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

const EMPTY = { name: '', phone: '', city: '', address: '', notes: '' };

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const load = () => {
    setLoading(true);
    fetch('/api/client/contacts')
      .then(r => r.json())
      .then(d => { setContacts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { if (status === 'authenticated') load(); }, [status]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true); };
  const openEdit = (c) => { setEditing(c.id); setForm({ name: c.name, phone: c.phone ?? '', city: c.city ?? '', address: c.address ?? '', notes: c.notes ?? '' }); setError(''); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return; }
    setSaving(true);
    setError('');
    const url    = editing ? `/api/client/contacts/${editing}` : '/api/client/contacts';
    const method = editing ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? 'Erreur'); setSaving(false); return; }
      setShowForm(false);
      load();
    } catch { setError('Erreur réseau'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`/api/client/contacts/${id}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch {}
    setDeleting(null);
  };

  if (status === 'loading') return null;

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>Mes contacts</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Destinataires réutilisables à la création d'un colis</p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 40,
          background: 'linear-gradient(135deg,#00B4D8,#1B4FD8)', color: 'white',
          border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          <PlusIcon /> Ajouter
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 520, margin: '0 auto',
            background: 'white', borderRadius: '20px 20px 0 0', padding: '24px 16px 36px',
          }}>
            <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 99, margin: '0 auto 20px' }} />
            <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#111827' }}>
              {editing ? 'Modifier le contact' : 'Nouveau contact'}
            </h2>

            {error && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}

            {[
              { key: 'name',    label: 'Nom complet *', placeholder: 'Jean Dupont', type: 'text' },
              { key: 'phone',   label: 'Téléphone',     placeholder: '+237 6XX XXX XXX', type: 'tel' },
              { key: 'city',    label: 'Ville',         placeholder: 'Douala', type: 'text' },
              { key: 'address', label: 'Adresse',       placeholder: 'Quartier, rue...', type: 'text' },
              { key: 'notes',   label: 'Notes',         placeholder: 'Infos supplémentaires...', type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: '11px 13px', borderRadius: 10,
                    border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit',
                    boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, height: 46, borderRadius: 10, border: 'none',
                background: '#F4F5F7', color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, height: 46, borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#00B4D8,#1B4FD8)', color: 'white',
                fontWeight: 700, fontSize: 15, cursor: saving ? 'default' : 'pointer',
                opacity: saving ? .7 : 1,
              }}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 14 }}>Chargement…</div>
        ) : contacts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'white', borderRadius: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,.07)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, color: '#374151', fontSize: 15, marginBottom: 6 }}>Aucun contact</div>
            <div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>Ajoutez vos destinataires habituels pour les retrouver rapidement lors de la création d'un colis.</div>
            <button onClick={openNew} style={{
              marginTop: 20, padding: '0 20px', height: 44, borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#00B4D8,#1B4FD8)', color: 'white',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>Ajouter un contact</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contacts.map(c => (
              <div key={c.id} style={{
                background: 'white', borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,.07)',
                padding: '14px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#1B4FD8',
                }}>
                  <PersonIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 2 }}>{c.name}</div>
                  {c.phone   && <div style={{ fontSize: 13, color: '#6B7280' }}>{c.phone}</div>}
                  {c.city    && <div style={{ fontSize: 13, color: '#6B7280' }}>{c.city}{c.address ? ` — ${c.address}` : ''}</div>}
                  {c.notes   && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' }}>{c.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(c)} style={{
                    width: 34, height: 34, borderRadius: 8, border: 'none',
                    background: '#EFF6FF', color: '#1B4FD8', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><EditIcon /></button>
                  <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} style={{
                    width: 34, height: 34, borderRadius: 8, border: 'none',
                    background: '#FEF2F2', color: '#DC2626', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: deleting === c.id ? .5 : 1,
                  }}><TrashIcon /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
