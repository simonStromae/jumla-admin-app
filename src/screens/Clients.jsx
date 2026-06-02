import { useState } from 'react';
import { DATA } from '../data.js';
import I from '../components/Icons.jsx';
import { Bi, Avatar, Drawer } from '../components/Shell.jsx';
import { Pagination, ViewToggle } from '../components/Pagination.jsx';
import ClientFormModal from './ClientForm.jsx';

export default function ClientsScreen({ onNav }) {
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const clients = DATA.CLIENTS;

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

      {view === 'grid'
        ? <ClientsGridView clients={clients} setOpen={setOpen} />
        : <ClientsListView clients={clients} setOpen={setOpen} page={page} pageSize={pageSize} />
      }

      <Pagination total={clients.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sizes={view === 'grid' ? [12, 24, 48] : [10, 25, 50, 100]} />

      {open && <ClientDrawer cl={open} onClose={() => setOpen(null)} onEdit={() => { setEditing(open); setOpen(null); }} />}

      {editing && (
        <ClientFormModal
          mode={editing === 'new' ? 'create' : 'edit'}
          client={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={() => setEditing(null)}
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
          <th style={{ textAlign: 'center' }}>Cargaisons</th>
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

function ClientDrawer({ cl, onClose, onEdit }) {
  return (
    <Drawer width={560} onClose={onClose}>
      <div className="drawer__head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Profil expéditeur / Sender profile</div>
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
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{cl.code} · Expéditeur depuis fév. 2024</div>
            <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--ink-600)', fontWeight: 500 }}>
              {cl.city}, Cameroun
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderBottom: '1px solid var(--border-soft)' }}>
          {[
            { label: 'Cargaisons', value: cl.campaigns, color: null },
            { label: 'CA total',   value: cl.amount.toLocaleString('fr') + ' CAD', color: 'var(--ok-600)' },
            { label: 'Impayés',    value: '0 CAD', color: 'var(--ink-400)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--ink-900)', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <DrawerRow icon={<I.Phone />} label="Téléphone" value={cl.phone} mono />
            <DrawerRow icon={<I.Pin />} label="Ville" value={cl.city + ', Cameroun'} />
            <DrawerRow icon={<I.Whatsapp />} label="WhatsApp" value={cl.phone} mono ok />
          </div>
        </div>

        <div style={{ padding: '16px 22px' }}>
          <div className="section-title">Historique d'envois <span className="section-title__count">{cl.campaigns}</span></div>
          <table className="tbl tbl--compact">
            <thead>
              <tr>
                <th style={{ borderRadius: 0 }}>Cargaison</th>
                <th>Poids</th>
                <th>Montant</th>
                <th style={{ borderRadius: 0 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {[
                { c: 'DLA-YUL-APR-02', w: 14, a: 329, s: 'in-transit' },
                { c: 'DLA-YUL-MAR-02', w: 18, a: 384, s: 'closed' },
                { c: 'DLA-YUL-MAR-01', w: 12, a: 248, s: 'closed' },
                { c: 'DLA-YUL-FEB-02', w: 9,  a: 198, s: 'closed' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontWeight: 600 }}>{row.c}</td>
                  <td className="mono">{row.w} kg</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{row.a} CAD</td>
                  <td>
                    <span className={'badge badge--dot badge--' + (row.s === 'in-transit' ? 'info' : 'ok')}>
                      {row.s === 'in-transit' ? 'En transit' : 'Clôturée'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="drawer__foot">
        <button className="btn btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}><I.Edit />Modifier</button>
        <button className="btn btn--soft" style={{ flex: 1, justifyContent: 'center' }}><I.Whatsapp style={{ color: 'var(--ok-600)' }} />WhatsApp</button>
        <button className="btn btn--brand" style={{ flex: 1, justifyContent: 'center' }}><I.Send />Envoyer facture</button>
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
