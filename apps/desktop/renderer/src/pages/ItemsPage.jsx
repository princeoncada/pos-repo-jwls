import React from 'react';
import ItemsTable from '../components/ItemsTable.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 25;

export default function ItemsPage({ onBack }) {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));


  const load = React.useCallback(async () => {
    setLoading(true);
    const skip = (page - 1) * PAGE_SIZE;
    const res = await window.api.items.list({ take: PAGE_SIZE, skip });
    setItems(res.items || []);
    setTotal(res.total || 0);
    setSelectedIds(new Set());
    setLoading(false);
  }, [page]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const skip = (page - 1) * PAGE_SIZE;
        const res = await window.api.items.list({ take: PAGE_SIZE, skip });
        if (!alive) return;
        setItems(res.items || []);
        setTotal(res.total || 0);
        setSelectedIds(new Set());
      } catch (e) {
        if (alive) alert(`Failed to load items: ${e?.message ?? String(e)}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [page]);

  // Refresh when window regains focus (helps after closing Edit modal)
  React.useEffect(() => {
    function handleFocus() { load(); }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [load]);

  function toggleSelect(id, checked) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked) {
    if (checked) setSelectedIds(new Set(items.map(i => i.id)));
    else setSelectedIds(new Set());
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Items</h1>
            <p className="text-sm text-gray-500">{total} total • page {page} of {totalPages}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded border" onClick={onBack}>Back</button>
          </div>
        </header>

        <div className="rounded-xl border bg-white overflow-hidden">
          <ItemsTable
            items={items}
            loading={loading}
            selectedIds={selectedIds}
            onToggleRow={toggleSelect}
            onToggleAll={toggleSelectAll}
            onEdit={async (id) => {
              await window.api.items.openEditWindow(id);
              // after closing edit window, refresh list:
              load();
            }}
            onDelete={async (id) => {
              if (!confirm('Are you sure you want to remove this item from Inventory?')) return;
              try {
                await window.api.items.remove(id);
                load();
              } catch (e) {
                alert(`Delete failed: ${e?.message ?? String(e)}`);
              }
            }}
          />
          <div className="p-3 border-t">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
              onGo={(n) => setPage(n)}
            />
          </div>
        </div>

        {/* Bulk action scaffold (UI only for now) */}
        <div className="rounded-xl border bg-white p-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">
            Selected: <b>{selectedIds.size}</b>
          </span>
          <button className="px-3 py-2 rounded border disabled:opacity-50" disabled>
            Edit selected (soon)
          </button>
          <button className="px-3 py-2 rounded border disabled:opacity-50" disabled>
            Delete selected (soon)
          </button>
          <div className="ml-auto text-sm text-gray-500">
            Add group of items (UI coming next)
          </div>
        </div>
      </div>
    </div>
  );
}
