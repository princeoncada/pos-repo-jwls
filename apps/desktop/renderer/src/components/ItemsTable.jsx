// renderer/components/ItemsTable.jsx
import React from 'react';

export default function ItemsTable({
  items = [],
  loading,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onEdit,
  onDelete,
}) {
  const allChecked = items.length > 0 && items.every(it => selectedIds.has(it.id));

  const prettyCat = (it) => {
    const c = it.category;
    if (!c) return '—';
    const code = c.code ?? '';
    const name = c.name ?? '';
    return code && name ? `${name}` : (code || name || '—');
  };

  const prettyBranch = (it) => {
    const b = it.branch;
    if (!b) return '—';
    const code = b.code ?? '';
    const name = b.name ?? '';
    return code && name ? `${name}` : (code || name || '—');
  };

  const prettySupplier = (it) => it.supplier?.name ?? '—';

  if (loading) {
    return (
      <div className="p-6 text-gray-500">Loading…</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <Th className="w-10">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onToggleAll?.(e.target.checked)}
              />
            </Th>
            {/* NEW: Item ID */}
            <Th>Item ID</Th>
            <Th>Title</Th>
            <Th>Category</Th>
            <Th>Branch</Th>
            <Th>Supplier</Th>
            <Th>Metal</Th>
            <Th>Karat</Th>
            <Th>Weight (g)</Th>
            <Th>Condition</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="odd:bg-white even:bg-gray-50">
              <Td className="w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.has(it.id)}
                  onChange={(e) => onToggleRow?.(it.id, e.target.checked)}
                />
              </Td>
              {/* NEW: Item ID */}
              <Td className="whitespace-nowrap font-mono text-xs text-gray-700">{it.itemCode}</Td>
              <Td>{it.title}</Td>
              <Td>{prettyCat(it)}</Td>
              <Td>{prettyBranch(it)}</Td>
              <Td>{prettySupplier(it)}</Td>
              <Td>{it.metal}</Td>
              <Td>{normalizeKaratUI(it.karat)}</Td>
              <Td>{it.weight_g ?? '—'}</Td>
              <Td>{it.condition}</Td>
              <Td>{it.status}</Td>
              <Td className="space-x-2 flex flex-row">
                <button className="px-2 py-1 rounded border" onClick={() => onEdit?.(it.id)}>Edit</button>
                <button className="px-2 py-1 rounded border text-rose-700 border-rose-200" onClick={() => onDelete?.(it.id)}>Delete</button>
              </Td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <Td colSpan={12} className="p-6 text-center text-gray-500">No items found.</Td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = '' }) {
  return <th className={`text-left font-semibold px-3 py-2 ${className}`}>{children}</th>;
}
function Td({ children, className = '', colSpan }) {
  return <td className={`px-3 py-2 ${className}`} colSpan={colSpan}>{children}</td>;
}

// Convert backend enum "K14" -> "14K" for display
function normalizeKaratUI(kEnum) {
  if (!kEnum) return '—';
  const m = String(kEnum).match(/^K(\d{2})$/i);
  return m ? `${m[1]}K` : kEnum;
}
