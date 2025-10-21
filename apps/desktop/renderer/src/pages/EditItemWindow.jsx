import React from 'react';

export default function EditItemWindow({ itemId }) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '', category: '', metal: '', karat: '14K', weight_g: 0,
    condition: '', currentState: 'READY', currentBranchId: null
  });

  // Document title for clarity
  React.useEffect(() => {
    document.title = form.title ? `Edit: ${form.title} — Jewelry POS` : 'Edit Item — Jewelry POS';
  }, [form.title]);
  React.useEffect(() => {
    if (!itemId) {
      alert('Missing item ID');
      window.close();
      return;
    }
    let alive = true;
    (async () => {
      try {
        const it = await window.api.items.get(itemId);
        if (!it) throw new Error('Item not found');
        setForm({
          title: it.title ?? '',
          category: it.category ?? '',
          metal: it.metal ?? '',
          karat: it.karat ?? '14K',
          weight_g: Number.isFinite(Number(it.weight_g)) ? Number(it.weight_g) : 0,
          condition: it.condition ?? '',
          currentState: it.currentState ?? 'READY',
          currentBranchId: it.currentBranchId ?? null
        });
      } catch (e) {
        if (alive) {
          alert(`Failed to load item: ${e?.message ?? String(e)}`);
          window.close();
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [itemId]);

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSave() {
    setSaving(true);
    try {
      const dto = {
        title: form.title,
        category: form.category,
        metal: form.metal,
        karat: form.karat,
        weight_g: Number.isFinite(Number(form.weight_g)) ? Number(form.weight_g) : 0,
        condition: form.condition,
        currentState: form.currentState,
        currentBranchId: form.currentBranchId || null
      };
      await window.api.items.update(itemId, dto);
      window.close();
    } catch (e) {
      alert(`Save failed: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function onCancel() { window.close(); }

  // Keyboard shortcuts: Ctrl/Cmd+S to save, Esc to cancel
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); onSave(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit Item</h1>
        </header>

        <div className="rounded-xl border bg-white p-4 space-y-3">
          <Input label="Title" value={form.title} onChange={v => setField('title', v)} />
          <Input label="Category" value={form.category} onChange={v => setField('category', v)} />
          <Input label="Metal" value={form.metal} onChange={v => setField('metal', v)} />
          <Select label="Karat" value={form.karat} onChange={v => setField('karat', v)}
            options={['10K', '14K', '18K', '21K', '22K', '24K']} />
          <Input label="Weight (g)" type="number" value={form.weight_g} onChange={v => setField('weight_g', v)} />
          <Input label="Condition" value={form.condition} onChange={v => setField('condition', v)} />
          <Select label="State" value={form.currentState} onChange={v => setField('currentState', v)}
            options={['DRAFT', 'QA', 'READY', 'RESERVED']} />
        </div>

        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 rounded border" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}


function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <input
        className="w-full border p-2 rounded"
        value={value ?? ''}
        type={type}
        onChange={(e) => {
          if (type === 'number') {
            const n = e.target.valueAsNumber;
            onChange(Number.isFinite(n) ? n : e.target.value === '' ? '' : Number(e.target.value) || 0);
          } else {
            onChange(e.target.value);
          }
        }}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <select className="w-full border p-2 rounded" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
}
