import React, { useState } from 'react';
import { useLoad, mga } from '../../lib/util';
import { Async, Button, Empty, PageHeader, Stat, Tabs } from '../../ui/kit';
import { InvoiceTable, NewInvoice } from './Dossier';
import { InvoiceView } from '../client/Profil';

export default function Invoices() {
  const [status, setStatus] = useState('');
  const state = useLoad('/admin/invoices' + (status ? `?status=${status}` : ''));
  const all = useLoad('/admin/invoices');
  const clients = useLoad('/admin/clients');
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState(null);
  const sum = (st) => (all.data ? all.data.invoices.filter((i) => i.status === st).reduce((s, i) => s + i.amount_mga, 0) : 0);
  const count = (st) => (all.data ? all.data.invoices.filter((i) => i.status === st).length : 0);
  const reload = () => { state.reload(); all.reload(); };
  return (
    <div className="page">
      <PageHeader title="Facturation" actions={<Button icon="plus" onClick={() => setCreating(true)}>Nouvelle facture</Button>} />
      <div className="grid-3">
        <Stat icon="invoice" label="À confirmer" value={count('declaree')} sub={`${mga(sum('declaree'))} déclarés payés`} />
        <Stat icon="clock" tone="terra" label="En attente" value={count('en_attente')} sub={mga(sum('en_attente'))} />
        <Stat icon="check" label="Encaissé (total)" value={mga(sum('payee'))} />
      </div>
      <Tabs tabs={[['', 'Toutes'], ['declaree', 'À confirmer', count('declaree')], ['en_attente', 'En attente'], ['payee', 'Payées'], ['annulee', 'Annulées']]} value={status} onChange={setStatus} />
      <Async state={state}>
        {({ invoices }) => (invoices.length ? <InvoiceTable invoices={invoices} showClient onChange={reload} onView={setView} /> : <Empty icon="invoice" title="Aucune facture" />)}
      </Async>
      {creating && clients.data ? <NewInvoice clients={clients.data.clients.filter((c) => c.active)} onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} /> : null}
      {view ? <InvoiceView invoice={view} client={`${view.first_name} ${view.last_name}`} onClose={() => setView(null)} /> : null}
    </div>
  );
}
