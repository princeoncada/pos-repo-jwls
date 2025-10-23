import React from 'react';

export default function AdminSuppliers() {
  const [rows, setRows] = React.useState([]);
  const [name, setName] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const load = React.useCallback(async () => {
    const data = await window.api.refs.suppliers();
    setRows(data || []);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name) return alert('Provide supplier name');
    await window.api.admin.createSupplier({ name: name.trim(), notes: notes.trim() || undefined });
    setName(''); setNotes('');
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Suppliers</h1>
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <input className="px-3 py-2 border rounded-2xl" placeholder="Supplier name" value={name} onChange={e => setName(e.target.value)} />
          <input className="px-3 py-2 border rounded-2xl" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <button className="px-3 py-2 rounded-2xl bg-black text-white" onClick={add}>Add</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <Td>{r.name}</Td>
                <Td className="text-gray-600">{r.notes || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) { return <th className="text-left font-semibold px-3 py-2">{children}</th>; }
function Td({ children, className='' }) { return <td className={`px-3 py-2 ${className}`}>{children}</td>; }
