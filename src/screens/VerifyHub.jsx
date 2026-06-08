import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { RoutePill, Skel } from '../components/Shell.jsx';

export default function VerifyHubScreen({ onNav }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => {
        const all = Array.isArray(data) ? data : [];
        setCampaigns(all.filter(c => c.status === 'in-transit' || c.status === 'arrived'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pending = campaigns;

  if (loading) {
    return (
      <div className="page">
        <div className="page__head" style={{ marginBottom: 20 }}>
          <div>
            <div className="page__title">Vérification d'arrivée</div>
            <div className="page__sub">Contrôle article par article des colis à la réception de la cargaison</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} className="kpi">
              <Skel w={80} h={11} style={{ marginBottom: 10 }} />
              <Skel w={50} h={28} style={{ marginBottom: 8 }} />
              <Skel w={120} h={11} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2].map(i => (
            <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Skel w={10} h={10} r={999} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Skel w={72} h={22} r={6} />
                  <Skel w={120} h={18} r={999} />
                  <Skel w={70} h={18} r={999} />
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <Skel w={60} h={12} /><Skel w={60} h={12} /><Skel w={80} h={12} />
                </div>
              </div>
              <Skel w={140} h={32} r={8} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__head" style={{ marginBottom: 20 }}>
        <div>
          <div className="page__title">Vérification d'arrivée</div>
          <div className="page__sub">Contrôle article par article des colis à la réception de la cargaison</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div className="kpi">
          <div className="kpi__label">Cargaisons en transit</div>
          <div className="kpi__value">{pending.length}</div>
          <div className="kpi__delta">en attente de réception</div>
        </div>
        <div className="kpi" style={{ background: 'var(--warn-50)', borderColor: 'var(--warn-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--warn-700)' }}>Colis à vérifier</div>
          <div className="kpi__value" style={{ color: 'var(--warn-700)' }}>
            {pending.reduce((acc, c) => acc + (c.parcels || 0), 0)}
          </div>
          <div className="kpi__delta">tous statuts confondus</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Articles totaux</div>
          <div className="kpi__value">{pending.reduce((acc, c) => acc + (c.parcels || 0) * 2, 0)}</div>
          <div className="kpi__delta">estimé ~2 articles/colis</div>
        </div>
      </div>

      {/* Campaign list */}
      {pending.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '60px 24px', background: 'white', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', color: 'var(--ink-400)', textAlign: 'center',
        }}>
          <I.Check style={{ width: 40, height: 40, color: 'var(--ok-400)' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ok-700)' }}>Aucune vérification en attente</div>
          <div style={{ fontSize: 13 }}>Toutes les cargaisons sont clôturées ou non encore en transit.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.map(c => (
            <div key={c.id} style={{
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {/* Indicator */}
              <div style={{
                width: 10, height: 10, borderRadius: 999, flexShrink: 0,
                background: 'var(--warn-500)',
                boxShadow: '0 0 0 3px var(--warn-100)',
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{c.code}</span>
                  <RoutePill from={c.from} to={c.to} size="sm" />
                  {c.status === 'arrived' ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--ok-100)', color: 'var(--ok-800)' }}>Arrivée</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--warn-100)', color: 'var(--warn-800)' }}>En transit</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', gap: 14 }}>
                  <span><I.Box style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2, marginRight: 4 }} />{c.parcels} colis</span>
                  <span><I.Scale style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2, marginRight: 4 }} />{(c.weight || 0).toLocaleString('fr')} kg</span>
                  <span><I.Calendar style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2, marginRight: 4 }} />Départ {c.dep}</span>
                </div>
              </div>

              {/* Action */}
              <button
                className="btn btn--primary btn--sm"
                onClick={() => onNav('/admin/campaigns/' + c.id + '/verify')}
              >
                <I.Check />Lancer la vérification
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div style={{
        marginTop: 20, display: 'flex', gap: 10, padding: '12px 16px',
        background: 'var(--info-50, #EFF6FF)', border: '1px solid var(--info-100, #DBEAFE)',
        borderRadius: 'var(--radius-xl)',
      }}>
        <I.Info style={{ width: 16, height: 16, color: 'var(--info-600, #2563EB)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.6 }}>
          La vérification permet de contrôler chaque article des colis à la réception : quantités reçues, état, manquants.
          Les anomalies sont enregistrées et restent visibles dans le détail de la cargaison.
        </div>
      </div>
    </div>
  );
}
