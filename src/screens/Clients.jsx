import { useState, useEffect } from 'react';

import I from '../components/Icons.jsx';
import { Bi, Avatar, Drawer, Skel } from '../components/Shell.jsx';
import { Pagination, ViewToggle } from '../components/Pagination.jsx';
import ClientFormModal from './ClientForm.jsx';

export default function ClientsScreen({ onNav }) {
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const loadClients = () => {
    setLoading(true);
    setFetchError('');
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setClients(d);
        } else {
          setFetchError(d?.error || 'Erreur de chargement');
        }
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Erreur réseau');
        setLoading(false);
      });
  };

  useEffect(() => { loadClients(); }, []);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Expéditeurs" en="Senders" /></div>
          <div className="page__sub">Expéditeurs enregistrés — basés à Douala, Lagos et autres villes d'origine</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Exporter CSV</button>
          <button className="btn btn--brand" onClick={() => setEditing('new')}><I.UserPlus />Nouvel expéditeur</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Nom, téléphone, code client..." style={{ width: 260, paddingLeft: 32 }} />
        </div>
        <button className="btn btn--ghost btn--sm"><I.Filter />Filtres</button>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, padding: 14, background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Skel w={40} h={40} r={999} />
                <div style={{ flex: 1 }}>
                  <Skel w="60%" h={14} style={{ marginBottom: 6 }} />
                  <Skel w="80%" h={11} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                <div><Skel w="50%" h={10} style={{ marginBottom: 5 }} /><Skel w="70%" h={14} /></div>
                <div><Skel w="50%" h={10} style={{ marginBottom: 5 }} /><Skel w="70%" h={14} /></div>
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--err-600)', fontSize: 14 }}>
          Erreur : {fetchError}
        </div>
      ) : clients.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
          <I.Users style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucun expéditeur enregistré</div>
          <div style={{ fontSize: 12 }}>Les clients qui se créent un compte apparaissent ici.</div>
        </div>
      ) : view === 'grid'
        ? <ClientsGridView clients={clients} setOpen={setOpen} />
        : <ClientsListView clients={clients} setOpen={setOpen} page={page} pageSize={pageSize} />
      }

      <Pagination total={clients.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sizes={view === 'grid' ? [12, 24, 48] : [10, 25, 50, 100]} />

      {open && <ClientDrawer cl={open} onClose={() => setOpen(null)} onEdit={() => { setEditing(open); setOpen(null); }} onNav={onNav} />}

      {editing && (
        <ClientFormModal
          mode={editing === 'new' ? 'create' : 'edit'}
          client={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(andNew) => {
            loadClients();
            if (andNew) setEditing('new');
            else setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ClientsGridView({ clients, setOpen }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, background: 'white', border: '1px solid var(--border)', borderTop: 0, padding: 14 }}>
      {clients.map(cl => (
        <div key={cl.id} className="card" style={{ padding: 14, position: 'relative', cursor: 'pointer' }} onClick={() => setOpen(cl)}>
          {cl.loyal && (
            <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--brand-500)' }}>
              <I.Star style={{ width: 14, height: 14 }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar initials={cl.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={cl.color} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{cl.name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{cl.code}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-600)', marginBottom: 8, fontWeight: 500 }}>
            {cl.city}, Cameroun
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }} className="mono">
            <I.Phone style={{ width: 12, height: 12 }} />
            {cl.phone}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '10px 0', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)', marginBottom: 10 }}>
            <Mini label="Cargaisons" v={cl.campaigns} />
            <Mini label="Poids" v={cl.weight + ' kg'} />
            <Mini label="CA" v={(cl.amount / 1000).toFixed(1) + 'k'} unit="CAD" />
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <I.Calendar style={{ width: 11, height: 11 }} />
            Dernière : <span className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{cl.lastCampaign}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientsListView({ clients, setOpen, page, pageSize }) {
  const paged = clients.slice((page - 1) * pageSize, page * pageSize);
  return (
    <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <thead>
        <tr>
          <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
          <th>Expéditeur</th>
          <th>Ville</th>
          <th>Téléphone</th>
          <th style={{ textAlign: 'center' }}>Nb d'envois</th>
          <th style={{ textAlign: 'right' }}>Poids</th>
          <th style={{ textAlign: 'right' }}>CA total</th>
          <th>Dernière</th>
          <th style={{ borderRadius: 0, width: 60 }}></th>
        </tr>
      </thead>
      <tbody>
        {paged.map(cl => (
          <tr key={cl.id} style={{ cursor: 'pointer' }} onClick={() => setOpen(cl)}>
            <td onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={cl.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={cl.color} size="sm" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {cl.name}
                    {cl.loyal && <I.Star style={{ width: 11, height: 11, color: 'var(--brand-500)' }} />}
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{cl.code}</div>
                </div>
              </div>
            </td>
            <td style={{ fontSize: 12.5 }}>{cl.city}, Cameroun</td>
            <td className="mono" style={{ fontSize: 12 }}>{cl.phone}</td>
            <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{cl.campaigns}</td>
            <td className="mono" style={{ textAlign: 'right' }}>{cl.weight}<span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 2 }}>kg</span></td>
            <td style={{ textAlign: 'right' }}>
              <span className="mono" style={{ fontWeight: 700 }}>{(cl.amount / 1000).toFixed(1)}k</span>
              <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 2 }}>CAD</span>
            </td>
            <td className="mono" style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{cl.lastCampaign}</td>
            <td onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <button className="icon-btn"><I.Whatsapp style={{ color: 'var(--ok-600)', width: 14, height: 14 }} /></button>
                <button className="icon-btn" onClick={() => setOpen(cl)}><I.ChevronRight /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Mini({ label, v, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
        {v}{unit && <span style={{ fontSize: 10, color: 'var(--ink-400)', marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

const CAMP_STATUS_CLS = {
  open:       'ok',
  in_transit: 'info',
  arrived:    'ok',
  closed:     'neutral',
};
const CAMP_STATUS_LBL = {
  open:       'Ouverte',
  in_transit: 'En transit',
  arrived:    'Arrivée',
  closed:     'Clôturée',
};

function ClientDrawer({ cl, onClose, onEdit, onNav }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients/' + cl.id)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cl.id]);

  const parcels   = detail?.parcels ?? [];
  const unpaidAmt = parcels.filter(p => !p.paid).reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalAmt  = parcels.reduce((s, p) => s + (p.amount ?? 0), 0);
  const since     = detail?.createdAt
    ? new Date(detail.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <Drawer width={560} onClose={onClose}>
      <div className="drawer__head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Profil client</div>
        </div>
        <button className="icon-btn" onClick={onClose}><I.Cross /></button>
      </div>

      <div className="drawer__body">
        <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border-soft)' }}>
          <Avatar initials={cl.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={cl.color} size="xl" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>
              {cl.name}
              {cl.loyal && <I.Star style={{ width: 14, height: 14, color: 'var(--brand-500)', marginLeft: 6, verticalAlign: -1 }} />}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
              Client depuis {since}
            </div>
            {cl.city && cl.city !== '—' && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--ink-600)', fontWeight: 500 }}>{cl.city}</div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderBottom: '1px solid var(--border-soft)' }}>
          {loading ? [1,2,3].map(i => (
            <div key={i}><Skel w="50%" h={10} style={{ marginBottom: 6 }} /><Skel w="70%" h={20} /></div>
          )) : [
            { label: 'Colis',      value: parcels.length },
            { label: 'CA total',   value: totalAmt.toLocaleString('fr') + ' CAD', color: 'var(--ok-600)' },
            { label: 'Impayés',    value: unpaidAmt > 0 ? unpaidAmt.toLocaleString('fr') + ' CAD' : '0 CAD', color: unpaidAmt > 0 ? 'var(--bad-600)' : 'var(--ink-400)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--ink-900)', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <DrawerRow icon={<I.Phone />}    label="Téléphone" value={cl.phone !== '—' ? cl.phone : '—'} mono />
            <DrawerRow icon={<I.Pin />}      label="Ville"     value={cl.city  !== '—' ? cl.city  : '—'} />
            <DrawerRow icon={<I.Whatsapp />} label="Email"     value={detail?.email ?? '—'} />
          </div>
        </div>

        <div style={{ padding: '16px 22px' }}>
          <div className="section-title">
            Historique de colis <span className="section-title__count">{parcels.length}</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1,2,3].map(i => <Skel key={i} w="100%" h={36} />)}
            </div>
          ) : parcels.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
              Aucun colis enregistré.
            </div>
          ) : (
            <table className="tbl tbl--compact">
              <thead>
                <tr>
                  <th style={{ borderRadius: 0 }}>Code</th>
                  <th>Cargaison</th>
                  <th style={{ textAlign: 'right' }}>Poids</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                  <th style={{ borderRadius: 0 }}>Paiement</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map(p => (
                  <tr key={p.id} style={{ cursor: onNav ? 'pointer' : 'default' }}
                    onClick={() => onNav?.('/admin/parcels/' + p.id)}>
                    <td className="mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--brand-700)' }}>{p.trackingCode}</td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.campaign.code}</div>
                      <span className={'badge badge--dot badge--' + (CAMP_STATUS_CLS[p.campaign.status] ?? 'neutral')} style={{ fontSize: 10.5 }}>
                        {CAMP_STATUS_LBL[p.campaign.status] ?? p.campaign.status}
                      </span>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12 }}>
                      {p.weightKg ? p.weightKg + ' kg' : '—'}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                      {p.amount ? p.amount.toLocaleString('fr') + ' CAD' : '—'}
                    </td>
                    <td>
                      <span className={'badge badge--dot badge--' + (p.paid ? 'ok' : 'warn')}>
                        {p.paid ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="drawer__foot">
        <button className="btn btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}><I.Edit />Modifier</button>
        <button className="btn btn--soft" style={{ flex: 1, justifyContent: 'center' }}><I.Whatsapp style={{ color: 'var(--ok-600)' }} />WhatsApp</button>
      </div>
    </Drawer>
  );
}

function DrawerRow({ icon, label, value, mono, ok }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: ok ? 'var(--ok-600)' : 'var(--ink-800)', fontWeight: 500 }}>
        <span style={{ color: 'var(--ink-400)', display: 'flex' }}>{icon}</span>
        <span className={mono ? 'mono' : ''}>{value}</span>
      </div>
    </div>
  );
}
