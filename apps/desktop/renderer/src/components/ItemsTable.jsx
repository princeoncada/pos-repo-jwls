export default function ItemsTable({
  items,
  loading = false,
  selectedIds = new Set(),
  onToggleRow,
  onToggleAll,
  onEdit,
  onDelete
}) {
  const allChecked = items.length > 0 && items.every(i => selectedIds.has(i.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-2 border-r w-10">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </th>
            <th className="p-2">Title</th>
            <th className="p-2">Category</th>
            <th className="p-2">Metal</th>
            <th className="p-2">Karat</th>
            <th className="p-2">Weight (g)</th>
            <th className="p-2">Condition</th>
            <th className="p-2">State</th>
            <th className="p-2">Branch</th>
            <th className="p-2 text-right w-40">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {loading && (
            <tr>
              <td colSpan={10} className="p-4 text-center text-gray-500">Loading…</td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={10} className="p-4 text-center text-gray-500">No items</td>
            </tr>
          )}
          {!loading && items.map((it) => (
            <tr key={it.id} className="hover:bg-gray-50">
              <td className="p-2 border-r">
                <input
                  type="checkbox"
                  checked={selectedIds.has(it.id)}
                  onChange={(e) => onToggleRow(it.id, e.target.checked)}
                />
              </td>
              <td className="p-2">{it.title}</td>
              <td className="p-2">{it.category}</td>
              <td className="p-2">{it.metal}</td>
              <td className="p-2">{it.karat}</td>
              <td className="p-2">{it.weight_g}</td>
              <td className="p-2">{it.condition}</td>
              <td className="p-2">{it.currentState}</td>
              <td className="p-2">{it.branch?.name ?? '—'}</td>
              <td className="p-2">
                <div className="flex justify-end gap-2">
                  <button
                    className="px-2 py-1 rounded border text-sm"
                    onClick={() => onEdit(it.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 rounded border text-sm"
                    onClick={() => onDelete(it.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
