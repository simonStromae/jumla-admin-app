import { useState } from 'react';
import { DATA, STATUS } from '../data.js';
import I from '../components/Icons.jsx';
import { Avatar, StatusDot } from '../components/Shell.jsx';

export default function MobileScreen({ onNav }) {
  const [tab, setTab] = useState('parcels');
  const parcels = DATA.PARCELS;

  return (
    <div style={{ background: '#E5E7EB', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{
        width: 390, maxWidth: '100%',
        background: 'var(--bg-page)',
        borderRadius: 36,
        boxShadow: '0 24px 60px -12px rgba(0,0,0,.25), 0 0 0 10px #111, 0 0 0 12px #333',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 800,
        fontFamily: 'var(--ff-sans)',
      }}>
        {/* Status bar */}
        <div style={{ height: 44, background: 'var(--bg-page)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
          <span className="mono">9:41</span>
          <div style={{ width: 110, height: 30, background: '#000', borderRadius: 999, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 7 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="2" height="4" fill="#000"/><rect x="3.5" y="5" width="2" height="6" fill="#000"/><rect x="7" y="3" width="2" height="8" fill="#000"/><rect x="10.5" y="1" width="2" height="10" fill="#000"/><rect x="14" y="0" width="2" height="11" fill="#000"/></svg>
            <svg width="14" height="11" viewBox="0 0 14 11"><circle cx="7" cy="9" r="2" fill="#000"/><path fill="none" stroke="#000" strokeWidth="1.5" d="M3 6a5.7 5.7 0 0 1 8 0"/><path fill="none" stroke="#000" strokeWidth="1.5" d="M1 4a8.5 8.5 0 0 1 12 0"/></svg>
            <svg width="24" height="11" viewBox="0 0 24 11"><rect x=".5" y=".5" width="21" height="10" rx="2.5" fill="none" stroke="#000"/><rect x="2" y="2" width="14" height="7" rx="1" fill="#000"/><path d="M22 3.5h1.5v4H22z" fill="#000"/></svg>
          </div>
        </div>

        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--border)', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="icon-btn" onClick={() => onNav('/campaigns')}><I.ArrowLeft /></button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }} className="mono">DLA-YUL-APR-02</span>
                <StatusDot kind="info" label="" />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>64 colis · 1 842 kg · 32,4k CAD</div>
            </div>
            <button className="icon-btn"><I.Filter /></button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {[
              { l: 'Perçu',     v: '18,9k', cls: 'var(--ok-600)' },
              { l: 'Reste',     v: '13,5k', cls: 'var(--bad-600)' },
              { l: '% Recouv.', v: '58%',   cls: 'var(--warn-700)' },
            ].map((k, i) => (
              <div key={i} style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-soft)', borderRadius: 7 }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: k.cls }}>{k.v}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase' }}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '10px 14px', display: 'flex', gap: 6, overflowX: 'auto', background: 'white', borderBottom: '1px solid var(--border-soft)' }}>
          {['Tous (64)', 'Impayés (12)', 'À livrer (28)', 'Sans BL (4)'].map((f, i) => (
            <button key={i} style={{
              padding: '4px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 999,
              background: i === 0 ? 'var(--ink-900)' : 'var(--bg-soft)',
              color: i === 0 ? 'white' : 'var(--ink-600)',
              border: 'none', whiteSpace: 'nowrap', cursor: 'pointer',
            }}>{f}</button>
          ))}
        </div>

        {/* Parcel cards */}
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 540, overflowY: 'auto' }}>
          {parcels.slice(0, 5).map(p => (
            <div key={p.id} style={{
              background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 12,
              boxShadow: 'var(--sh-xs)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-700)' }}>{p.code}</span>
                <span className={'badge badge--dot badge--' + STATUS.payment[p.paid].cls} style={{ fontSize: 10 }}>
                  {STATUS.payment[p.paid].label}
                </span>
                <div style={{ flex: 1 }} />
                <button className="icon-btn" style={{ width: 24, height: 24 }}><I.More style={{ width: 14, height: 14 }} /></button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Avatar initials={p.recipName.split(' ').map(x => x[0]).join('')} color={(p.id.charCodeAt(0) % 8) + 1} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.recipName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                    <span className="mono">{p.recipPhone}</span> · {p.recipCity}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{p.amount}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 600 }}>CAD</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--ink-500)', paddingTop: 8, borderTop: '1px solid var(--border-soft)', marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} className="mono">
                  <I.Scale style={{ width: 11, height: 11 }} /> {p.actualKg} kg
                  {p.overrun && <span style={{ color: 'var(--warn-700)' }}>⚠</span>}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  {p.delivery === 'home'
                    ? <><I.Truck style={{ width: 11, height: 11 }} /> Domicile</>
                    : <><I.Warehouse style={{ width: 11, height: 11 }} /> Retrait</>}
                </span>
                {p.slip && <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-400)' }}>{p.slip}</span>}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 7, background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--ok-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                  <I.Chat style={{ width: 13, height: 13 }} /> WhatsApp
                </button>
                {p.paid !== 'paid'
                  ? <button style={{ flex: 1, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 7, background: 'var(--brand-500)', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                      <I.Check style={{ width: 13, height: 13 }} /> Marquer payé
                    </button>
                  : <button style={{ flex: 1, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 7, background: 'var(--bg-soft)', color: 'var(--ink-700)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                      <I.FileText style={{ width: 13, height: 13 }} /> Bordereau
                    </button>}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tab bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'white', borderTop: '1px solid var(--border)',
          padding: '8px 12px 22px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
        }}>
          {[
            { id: 'home',     l: 'Cargaisons', Icon: I.Plane },
            { id: 'parcels',  l: 'Colis',      Icon: I.Box },
            { id: 'messages', l: 'Messages',   Icon: I.Chat },
            { id: 'clients',  l: 'Clients',    Icon: I.Users },
          ].map(t => {
            const Ic = t.Icon;
            const sel = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 0', border: 'none', background: 'transparent',
                color: sel ? 'var(--brand-700)' : 'var(--ink-400)',
                fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
              }}>
                <Ic style={{ width: 20, height: 20 }} />
                {t.l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
