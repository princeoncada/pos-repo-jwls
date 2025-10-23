// renderer/windows/EditItemWindow.jsx
import React from 'react';

const KARATS_UI = ['10K', '14K', '18K', '21K', '22K', '24K'];
const STATUSES = ['AVAILABLE', 'SOLD', 'TRANSFERRED'];

export default function EditItemWindow({ itemId }) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [branches, setBranches] = React.useState([]);   // [{id, slug, name}]
  const [suppliers, setSuppliers] = React.useState([]); // [{id, name}]
  const [categories, setCategories] = React.useState([]); // [{id, code, name}]

  const [itemCode, setItemCode] = React.useState(''); // readonly display
  const [costCode, setCostCode] = React.useState(''); // readonly display (server-generated)

  const [form, setForm] = React.useState({
    title: '',
    categoryId: '',
    branchId: '',
    supplierId: '',
    metal: '',
    karat: '14K',
    weight_g: '',
    condition: '',
    status: 'AVAILABLE',
    cost: '',
  });

  // Document title for clarity
  React.useEffect(() => {
    document.title = form.title ? `Edit: ${form.title} — Jewelry POS` : 'Edit Item — Jewelry POS';
  }, [form.title]);

  // Load refs + item
  React.useEffect(() => {
    if (!itemId) {
      alert('Missing item ID');
      window.close();
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [b, s, c] = await Promise.all([
          window.api.refs.branches(),
          window.api.refs.suppliers(),
          window.api.refs.categories(),
        ]);
        if (!alive) return;
        setBranches(b || []);
        setSuppliers(s || []);
        setCategories(c || []);

        const it = await window.api.items.get(itemId);
        if (!alive) return;
        if (!it) throw new Error('Item not found');

        setItemCode(it.itemCode || '');
        setCostCode(it.costCode || '');

        setForm({
          title: it.title ?? '',
          categoryId: it.category?.id ?? it.categoryId ?? '',
          branchId: it.branch?.id ?? it.branchId ?? '',
          supplierId: it.supplier?.id ?? it.supplierId ?? '',
          metal: it.metal ?? '',
          // backend stores "K14" etc; present as "14K" if needed
          karat: normalizeKaratUI(it.karat) || '14K',
          weight_g: it.weight_g ?? '',
          condition: it.condition ?? '',
          status: it.status ?? 'AVAILABLE',
          cost: it.cost ?? '',
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

  function setField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function onSave() {
    setSaving(true);
    try {
      // We DO NOT allow changing branchId/categoryId here (to keep itemCode stable)
      const dto = {
        title: form.title,
        supplierId: (form.supplierId || '').trim() === '' ? undefined : form.supplierId,
        metal: form.metal,
        karat: form.karat, // "14K"; backend maps to enum
        weight_g: form.weight_g === '' ? undefined : Number(form.weight_g),
        condition: form.condition,
        status: form.status,
        cost: form.cost === '' ? undefined : Number(form.cost),
      };
      const updated = await window.api.items.update(itemId, dto);
      // Reflect any updated server fields (e.g., costCode recomputed)
      setCostCode(updated?.costCode || costCode);
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

  const branchOpts = branches.map(b => ({ value: b.id, label: `${b.code} — ${b.name}` }));
  const supplierOpts = [{ value: '', label: '— none —' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))];
  const categoryOpts = categories.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` }));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit Item</h1>
        </header>

        <div className="rounded-xl border bg-white p-4 space-y-3">
          {/* Readonly identifiers */}
          <Readonly label="Item ID" value={itemCode} mono />
          {costCode ? <Readonly label="Cost Code" value={costCode} mono /> : null}

          {/* Reference selects (branch/category locked to preserve itemCode) */}
          <Select
            label="Branch"
            value={form.branchId}
            options={branchOpts}
            onChange={() => {}}
            disabled
            hint="Branch cannot be changed after creation (keeps Item ID stable)."
          />
          <Select
            label="Category"
            value={form.categoryId}
            options={categoryOpts}
            onChange={() => {}}
            disabled
            hint="Category cannot be changed after creation (keeps Item ID stable)."
          />

          {/* Editable supplier */}
          <Select
            label="Supplier"
            value={form.supplierId}
            options={supplierOpts}
            onChange={v => setField('supplierId', v)}
          />

          {/* Core fields */}
          <Input label="Title" value={form.title} onChange={v => setField('title', v)} />
          <Input label="Metal" value={form.metal} onChange={v => setField('metal', v)} />
          <Select
            label="Karat"
            value={form.karat}
            options={KARATS_UI.map(k => ({ value: k, label: k }))}
            onChange={v => setField('karat', v)}
          />
          <Input label="Weight (g)" type="number" value={form.weight_g} onChange={v => setField('weight_g', v)} />
          <Input label="Condition" value={form.condition} onChange={v => setField('condition', v)} />
          <Select
            label="Status"
            value={form.status}
            options={STATUSES.map(s => ({ value: s, label: s }))}
            onChange={v => setField('status', v)}
          />
          <Input label="Cost (₱/g)" type="number" value={form.cost} onChange={v => setField('cost', v)} />
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

/* ---------- helpers & inputs ---------- */

function normalizeKaratUI(kEnum) {
  // Converts "K14" -> "14K"
  if (!kEnum) return '';
  const m = String(kEnum).match(/^K(\d{2})$/i);
  return m ? `${m[1]}K` : kEnum; // already UI?
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
            const raw = e.target.value;
            // allow blank; otherwise coerce to number
            onChange(raw === '' ? '' : (Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : Number(raw) || 0));
          } else {
            onChange(e.target.value);
          }
        }}
      />
    </label>
  );
}

function Select({ label, value, onChange, options = [], disabled = false, hint }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <select
        className="w-full border p-2 rounded disabled:opacity-60"
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        title={hint || undefined}
      >
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </label>
  );
}

function Readonly({ label, value, mono = false }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <input
        readOnly
        className={`w-full border p-2 rounded bg-gray-100 ${mono ? 'font-mono text-sm' : ''}`}
        value={value ?? ''}
      />
    </label>
  );
}
