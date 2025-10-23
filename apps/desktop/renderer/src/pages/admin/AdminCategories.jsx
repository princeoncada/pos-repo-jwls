import React from 'react';

export default function AdminCategories() {
  const [rows, setRows] = React.useState([]);
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');

  const load = React.useCallback(async () => {
    const data = await window.api.refs.categories();
    setRows(data || []);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!code || !name) return alert('Provide code and name');
    await window.api.admin.createCategory({ code: code.trim(), name: name.trim() });
    setCode(''); setName('');
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <input className="px-3 py-2 border rounded-2xl" placeholder="Code (e.g. blet, bgl, chn)" value={code} onChange={e => setCode(e.target.value)} />
          <input className="px-3 py-2 border rounded-2xl" placeholder="Name (e.g. Bracelet, Bangle, Chain)" value={name} onChange={e => setName(e.target.value)} />
          <button className="px-3 py-2 rounded-2xl bg-black text-white" onClick={add}>Add</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <Td className="font-mono">{r.code}</Td>
                <Td>{r.name}</Td>
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
