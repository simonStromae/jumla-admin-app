// ============================================
// ZENDIT — Printable delivery slip
// ============================================

function SlipPrintScreen({ onNav }) {
  return (
    <div style={{ background: '#E5E7EB', minHeight: '100vh', padding: '24px 0', fontFamily: 'var(--ff-sans)' }}>
      {/* Print toolbar (non-print) */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 10,
        maxWidth: 920, margin: '0 auto 18px',
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--sh-sm)',
      }}>
        <button className="btn btn--ghost btn--sm" onClick={() => onNav('/slip/BL-2604-01')}>
          <I.ArrowLeft />Retour
        </button>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Aperçu avant impression</span>
        <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>— A4 portrait, marges 12 mm</span>
        <div className="spacer" style={{flex:1}}/>
        <button className="btn btn--ghost btn--sm"><I.Download />PDF</button>
        <button className="btn btn--brand btn--sm" onClick={() => window.print()}><I.Print />Imprimer</button>
      </div>

      {/* Paper */}
      <div style={{
        width: 794, // A4 width at 96dpi
        margin: '0 auto',
        background: 'white',
        padding: '44px 48px',
        boxShadow: 'var(--sh-md)',
        borderRadius: 4,
        color: '#0F172A',
        fontSize: 12,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: 'linear-gradient(135deg, #F5A524, #D97706)',
              color: 'white', display: 'grid', placeItems: 'center',
              fontSize: 22, fontWeight: 700,
            }}>Z</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Zendit Cargo</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Fret aérien international</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: 4, fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 600 }}>
              <span>DLA</span> ✈ <span>YUL</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 6 }}>Douala → Montréal · Transit 14 jours</div>
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, marginTop: 18, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>Bordereau de livraison</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Delivery slip · for inspection on arrival</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>N° bordereau</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 18, fontWeight: 700 }}>BL-2604-01</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid #D1D5DB', borderRadius: 4, marginBottom: 18 }}>
          {[
            { l: 'Cargaison', v: 'DLA-YUL-APR-02' },
            { l: 'N° client', v: 'CL-0418' },
            { l: 'Date départ', v: '28 avr. 2026' },
            { l: 'Date arrivée', v: '12 mai 2026' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRight: i < 3 ? '1px solid #E5E7EB' : 'none' }}>
              <div style={{ fontSize: 9.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{k.l}</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Sender / Recipient */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
          {[
            { kind: 'EXPÉDITEUR / SENDER', name: 'Client A', code: 'CL-0142', phone: '+237 6** ** ** 12', addr: 'BP 1842, Akwa, Douala — Cameroun' },
            { kind: 'DESTINATAIRE / RECIPIENT', name: 'Client J', code: 'CL-0418', phone: '+1 514 *** **45', addr: '1234 Rue Saint-Denis, Montréal H2X 3K2 — Canada' },
          ].map((p, i) => (
            <div key={i} style={{ border: '1px solid #D1D5DB', borderRadius: 4 }}>
              <div style={{ padding: '6px 12px', background: '#F4F5F7', borderBottom: '1px solid #D1D5DB', fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em' }}>
                {p.kind}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name} <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: '#6B7280', fontWeight: 500, marginLeft: 6 }}>{p.code}</span></div>
                <div style={{ fontSize: 11.5, color: '#374151', marginTop: 4, lineHeight: 1.55 }}>{p.addr}</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: '#374151', marginTop: 2 }}>{p.phone}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Item verification */}
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', marginBottom: 8, color: '#374151' }}>
          DÉTAIL DU CONTENU / CONTENT INSPECTION
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D1D5DB', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F4F5F7' }}>
              <th style={cellH(40)}>#</th>
              <th style={cellH(null, 'left')}>Article / Item</th>
              <th style={cellH(60)}>Colis</th>
              <th style={cellH(60)}>Pièces</th>
              <th style={cellH(110)}>Vérification</th>
              <th style={cellH(null, 'left')}>Note</th>
            </tr>
          </thead>
          <tbody>
            {[
              { n: 1, name: 'Valise médium — vêtements adulte', packs: 1, pieces: 1, st: '☑ Conforme', note: '—' },
              { n: 2, name: 'Valise large — chaussures, sacs',  packs: 1, pieces: 1, st: '☑ Conforme', note: '—' },
              { n: 3, name: 'Carton — ndolè, épices, café',     packs: 1, pieces: 8, st: '☑ Conforme', note: '8 sachets vérifiés' },
              { n: 4, name: 'Carton — produits cosmétiques',    packs: 1, pieces: 12, st: '⚠ Manquant', note: '2 flacons manquants à l\'ouverture' },
              { n: 5, name: 'Sachet — bijoux fantaisie',        packs: 1, pieces: 6, st: '＋ En plus', note: '1 article supplémentaire trouvé' },
            ].map((r) => (
              <tr key={r.n}>
                <td style={{...cell, fontFamily: 'var(--ff-mono)', color: '#6B7280'}}>{r.n}</td>
                <td style={{...cell, fontWeight: 500}}>{r.name}</td>
                <td style={{...cell, textAlign: 'center', fontFamily: 'var(--ff-mono)'}}>{r.packs}</td>
                <td style={{...cell, textAlign: 'center', fontFamily: 'var(--ff-mono)'}}>{r.pieces}</td>
                <td style={{...cell, textAlign: 'center', fontWeight: 600}}>{r.st}</td>
                <td style={{...cell, fontSize: 11, color: '#374151'}}>{r.note}</td>
              </tr>
            ))}
            <tr style={{ background: '#F4F5F7', fontWeight: 700 }}>
              <td colSpan="2" style={{...cell, fontSize: 11.5}}>TOTAL</td>
              <td style={{...cell, textAlign: 'center', fontFamily: 'var(--ff-mono)'}}>5</td>
              <td style={{...cell, textAlign: 'center', fontFamily: 'var(--ff-mono)'}}>28</td>
              <td style={{...cell, textAlign: 'center', fontSize: 11}}>3 OK · 1 manquant · 1 en plus</td>
              <td style={cell}></td>
            </tr>
          </tbody>
        </table>

        {/* Payment summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 20 }}>
          <div style={{ border: '1px solid #D1D5DB', borderRadius: 4, padding: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: '#6B7280', marginBottom: 6 }}>OBSERVATIONS</div>
            <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.6, minHeight: 60 }}>
              Colis remis en bon état général. Vérification réalisée en présence du destinataire le 26 avril 2026 à 14:32.
              Deux flacons cosmétiques manquants signalés au destinataire — note transmise à l'expéditeur via WhatsApp.
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D1D5DB', fontSize: 12 }}>
            <tbody>
              {[
                { l: 'Poids facturé', v: '14 kg × 18 CAD', amt: '252,00' },
                { l: 'Dépassement', v: '+2 kg × 22 CAD', amt: '44,00' },
                { l: 'Livraison domicile', v: 'Forfait', amt: '25,00' },
                { l: 'Manutention', v: '', amt: '8,00' },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{...cell, fontSize: 11}}>{r.l} <span style={{ color: '#9CA3AF', marginLeft: 4 }}>{r.v}</span></td>
                  <td style={{...cell, textAlign: 'right', fontFamily: 'var(--ff-mono)', fontWeight: 600 }}>{r.amt}</td>
                </tr>
              ))}
              <tr style={{ background: '#0F172A', color: 'white', fontWeight: 700 }}>
                <td style={{...cell, color: 'white', fontSize: 12}}>TOTAL DÛ</td>
                <td style={{...cell, color: 'white', textAlign: 'right', fontFamily: 'var(--ff-mono)', fontSize: 14}}>329,00 CAD</td>
              </tr>
              <tr>
                <td style={{...cell, fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Réglé · 26/04/2026 · Virement Interac</td>
                <td style={{...cell, textAlign: 'right' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 26 }}>
          {[
            { lbl: 'Agent Zendit', name: 'Marc Lefèvre — Montréal' },
            { lbl: 'Destinataire', name: 'Client J' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: '#6B7280', marginBottom: 36 }}>
                SIGNATURE — {s.lbl.toUpperCase()}
              </div>
              <div style={{ borderBottom: '1px solid #0F172A', marginBottom: 6 }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
                <span>{s.name}</span>
                <span>Date : ____ / ____ / 2026</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #D1D5DB', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280' }}>
          <span>Zendit Cargo · BP 1842, Akwa, Douala · +237 6** ** ** 00</span>
          <span>Entrepôt YUL : 5500 Pl. de la Savane, Lachine, QC · +1 514 *** ****</span>
          <span>support@zendit.cargo</span>
        </div>
      </div>
    </div>
  );
}

const cell = { padding: '7px 10px', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', verticalAlign: 'top' };
const cellH = (w, align) => ({ ...cell, fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: '#374151', textAlign: align || 'center', width: w || 'auto', borderBottom: '1px solid #D1D5DB' });

window.SlipPrintScreen = SlipPrintScreen;
