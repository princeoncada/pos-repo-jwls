// renderer/windows/AddItemsWindow.jsx
import React from 'react';

const KARATS_UI = ['10K', '14K', '18K', '21K', '22K', '24K'];
const STATUSES = ['AVAILABLE', 'SOLD', 'TRANSFERRED'];

export default function AddItemsWindow() {
  const [branches, setBranches] = React.useState([]);
  const [suppliers, setSuppliers] = React.useState([]);
  const [categories, setCategories] = React.useState([]);

  const [header, setHeader] = React.useState({
    title: '',
    categoryId: '',
    branchId: '',
    supplierId: '',            // ✅ required
    metal: '',
    karat: '14K',
    weight_g: '',
    condition: '',
    status: 'AVAILABLE',
    cost: '',
    count: 1,
  });

  const [grid, setGrid] = React.useState([]);
  const [showGrid, setShowGrid] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState([]);
  const [seqBase, setSeqBase] = React.useState(null); // base = MAX+1

  // for keyboard nav
  const editableCols = ['title', 'metal', 'karat', 'weight_g', 'condition', 'status', 'cost']; // no branch/category/supplier in-grid
  const cellRefs = React.useRef([]); // 2D refs [row][col]
  const [focusCell, setFocusCell] = React.useState({ r: 0, c: 0, mode: 'nav' }); // 'nav' | 'edit'

  React.useEffect(() => {
    (async () => {
      const [b, s, c] = await Promise.all([
        window.api.refs.branches(),
        window.api.refs.suppliers(),
        window.api.refs.categories(),
      ]);
      setBranches(b || []);
      setSuppliers(s || []);
      setCategories(c || []);
    })();
  }, []);

  const onHeaderChange = (k, v) => setHeader(h => ({ ...h, [k]: v }));

  const selectedBranch = React.useMemo(() => branches.find(b => b.id === header.branchId), [branches, header.branchId]);
  const selectedCategory = React.useMemo(() => categories.find(c => c.id === header.categoryId), [categories, header.categoryId]);
  const selectedSupplier = React.useMemo(() => suppliers.find(s => s.id === header.supplierId), [suppliers, header.supplierId]);

  // base sequence (MAX+1) for preview
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!header.branchId || !header.categoryId) { setSeqBase(null); return; }
      try {
        const base = await window.api.items.nextSeq(header.branchId, header.categoryId);
        if (!cancelled) setSeqBase(Number(base || 1));
      } catch { if (!cancelled) setSeqBase(1); }
    })();
    return () => { cancelled = true; };
  }, [header.branchId, header.categoryId]);

  const buildGrid = () => {
    const n = Math.max(1, Number(header.count) || 1);
    const rows = Array.from({ length: n }, () => ({
      title: header.title || '',
      categoryId: header.categoryId || '',
      branchId: header.branchId || '',
      supplierId: header.supplierId || '',    // ✅ lock supplier for all rows
      metal: header.metal || '',
      karat: header.karat || '14K',
      weight_g: header.weight_g || '',
      condition: header.condition || '',
      status: header.status || 'AVAILABLE',
      cost: header.cost || '',
    }));
    setGrid(rows);
    setShowGrid(true);
    // reset focus matrix
    cellRefs.current = Array.from({ length: n }, () => Array(editableCols.length).fill(null));
    setFocusCell({ r: 0, c: 0 });
  };

  const changeCell = (i, key, val) => {
    setGrid(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: val };
      return next;
    });
  };

  const addRow = (seedFromHeader = false) => {
    setGrid(prev => {
      const r = seedFromHeader ? {
        title: header.title || '',
        categoryId: header.categoryId || '',
        branchId: header.branchId || '',
        supplierId: header.supplierId || '',
        metal: header.metal || '',
        karat: header.karat || '14K',
        weight_g: header.weight_g || '',
        condition: header.condition || '',
        status: header.status || 'AVAILABLE',
        cost: header.cost || '',
      } : {
        title: '',
        categoryId: header.categoryId || '',
        branchId: header.branchId || '',
        supplierId: header.supplierId || '',
        metal: '',
        karat: '14K',
        weight_g: '',
        condition: '',
        status: 'AVAILABLE',
        cost: '',
      };
      const next = [...prev, r];
      // grow refs
      cellRefs.current = Array.from({ length: next.length }, (_, ri) =>
        cellRefs.current[ri] ? cellRefs.current[ri] : Array(editableCols.length).fill(null)
      );
      return next;
    });
  };

  const removeRow = (i) => {
    setGrid(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      cellRefs.current.splice(i, 1);
      return next;
    });
  };

  const previewCodeAt = (rowIndex) => {
    if (!selectedBranch || !selectedCategory || seqBase == null) return '—';
    const seq = seqBase + rowIndex; // seqBase is already MAX+1
    return `${selectedBranch.code}-${selectedCategory.code}-${seq}`;
  };

  const canShowGrid = !!header.branchId && !!header.categoryId && !!header.supplierId; // ✅ supplier required

  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const payload = grid.map(r => ({
        title: r.title,
        categoryId: r.categoryId || header.categoryId,
        branchId: r.branchId || header.branchId,
        supplierId: r.supplierId || header.supplierId,  // ✅ enforced
        metal: r.metal,
        karat: r.karat,
        weight_g: r.weight_g === '' ? undefined : r.weight_g,
        condition: r.condition,
        status: r.status,
        cost: r.cost === '' ? undefined : r.cost,
      }));

      const res = await window.api.items.createBulk(payload);
      const created = (res || []).filter(r => !r?.__error);
      const failed = (res || []).filter(r => r?.__error);

      if (created.length) {
        window.opener?.postMessage({ type: 'items:prepend', payload: created }, '*');
      }
      if (failed.length) {
        setErrors(failed.map(f => f.__message || `Row ${String(f.__rowIndex + 1)}: invalid data`));
      }
      if (created.length && failed.length === 0) {
        window.close();
      }
    } catch (e) {
      setErrors([e?.message || String(e)]);
    } finally {
      setSaving(false);
    }
  };

  // ---- keyboard navigation helpers ----
  const focusAt = (r, c, mode = 'nav') => {
    const row = Math.max(0, Math.min(grid.length - 1, r));
    const col = Math.max(0, Math.min(editableCols.length - 1, c));
    setFocusCell({ r: row, c: col, mode });
    const el = cellRefs.current[row]?.[col];
    if (el) el.focus();
  };

  const move = (dr, dc, mode = focusCell.mode) => {
    focusAt(focusCell.r + dr, focusCell.c + dc, mode);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Add Item/s</h1>

      {!showGrid && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" value={header.title} onChange={v => onHeaderChange('title', v)} />
          <Select
            label="Category"
            value={header.categoryId}
            onChange={v => onHeaderChange('categoryId', v)}
            options={categories.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
          />
          <Select
            label="Branch"
            value={header.branchId}
            onChange={v => onHeaderChange('branchId', v)}
            options={branches.map(b => ({ value: b.id, label: `${b.code} — ${b.name}` }))}
          />
          <Select
            label="Supplier"
            value={header.supplierId}
            onChange={v => onHeaderChange('supplierId', v)}
            options={[{ value: '', label: '— choose supplier —' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
          />

          <Field label="Metal" value={header.metal} onChange={v => onHeaderChange('metal', v)} />
          <Select
            label="Karat"
            value={header.karat}
            onChange={v => onHeaderChange('karat', v)}
            options={KARATS_UI.map(k => ({ value: k, label: k }))}
          />
          <Field label="Weight (g)" type="number" value={header.weight_g} onChange={v => onHeaderChange('weight_g', v)} />
          <Field label="Condition" value={header.condition} onChange={v => onHeaderChange('condition', v)} />

          <Select
            label="Status"
            value={header.status}
            onChange={v => onHeaderChange('status', v)}
            options={STATUSES.map(s => ({ value: s, label: s }))}
          />
          <Field label="Cost (₱/g)" type="number" value={header.cost} onChange={v => onHeaderChange('cost', v)} />
          <Field label="Count" type="number" min={1} value={header.count} onChange={v => onHeaderChange('count', v)} />
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {!showGrid ? (
          <>
            <button
              onClick={buildGrid}
              disabled={!canShowGrid}
              className="px-3 py-2 rounded-2xl bg-black text-white text-sm shadow hover:shadow-md disabled:opacity-50"
              title={!canShowGrid ? 'Select Branch, Category, and Supplier first' : ''}
            >
              Show Grid
            </button>
            <button onClick={() => window.close()} className="px-3 py-2 rounded-2xl bg-gray-200 text-gray-900 text-sm">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => addRow(true)} className="px-3 py-2 rounded-2xl bg-gray-100 text-sm">+ Row (seeded)</button>
            <button onClick={() => addRow(false)} className="px-3 py-2 rounded-2xl bg-gray-100 text-sm">+ Row (blank)</button>
            <button onClick={save} disabled={saving} className="px-3 py-2 rounded-2xl bg-black text-white text-sm shadow hover:shadow-md disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Items'}
            </button>
            <button onClick={() => window.close()} className="px-3 py-2 rounded-2xl bg-gray-200 text-gray-900 text-sm">Cancel</button>

            {/* ✅ Supplier info card */}
            <div className="ml-auto px-3 py-2 rounded-xl border bg-white text-sm flex items-center gap-2">
              <span className="text-gray-500">Supplier:</span>
              <span className="font-medium">{selectedSupplier ? selectedSupplier.name : '—'}</span>
            </div>
          </>
        )}
      </div>

      {showGrid && (
        <div className="border rounded-2xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th className="w-56">ID (Preview)</Th>
                  <Th>Title</Th>
                  {/* Category/Branch/Supplier removed in-grid by request */}
                  <Th>Metal</Th>
                  <Th>Karat</Th>
                  <Th>Weight (g)</Th>
                  <Th>Condition</Th>
                  <Th>Status</Th>
                  <Th>Cost (₱/g)</Th>
                  <Th className="w-16"></Th>
                </tr>
              </thead>
              <tbody className="align-top">
                {grid.map((row, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <Td>
                      <div className="px-2 py-1 bg-gray-100 rounded font-mono text-xs text-gray-700">
                        {previewCodeAt(i)}
                      </div>
                    </Td>

                    {/* Editable cells with keyboard navigation */}
                    <NavCell
                      row={i} col={0} cellRefs={cellRefs} focusCell={focusCell} setFocusCell={setFocusCell}
                      value={row.title} onChange={v => changeCell(i, 'title', v)}
                    />

                    <NavCell
                      row={i} col={1} cellRefs={cellRefs} focusCell={focusCell} setFocusCell={setFocusCell}
                      value={row.metal} onChange={v => changeCell(i, 'metal', v)}
                    />

                    {/* Selects: karat, status */}
                    <NavSelect
                      row={i} col={2} cellRefs={cellRefs} focusCell={focusCell} setFocusCell={setFocusCell}
                      value={row.karat} onChange={v => changeCell(i, 'karat', v)}
                      options={KARATS_UI}
                    />

                    <NavCell
                      row={i} col={3} cellRefs={cellRefs} focusCell={focusCell} setFocusCell={setFocusCell}
                      type="number"
                      value={row.weight_g} onChange={v => changeCell(i, 'weight_g', v)}
                    />

                    <NavCell
                      row={i} col={4} cellRefs={cellRefs} focusCell={focusCell} setFocusCell={setFocusCell}
                      value={row.condition} onChange={v => changeCell(i, 'condition', v)}
                    />

                    <NavSelect
                      row={i} col={5} cellRefs={cellRefs} focusCell={focusCell} setFocusCell={setFocusCell}
                      value={row.status} onChange={v => changeCell(i, 'status', v)}
                      options={STATUSES}
                    />

                    <NavCell
                      row={i} col={6} cellRefs={cellRefs} focusCell={focusCell} setFocusCell={setFocusCell}
                      type="number"
                      value={row.cost} onChange={v => changeCell(i, 'cost', v)}
                    />

                    <Td>
                      <button className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200"
                        onClick={() => removeRow(i)}>Remove</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!!errors.length && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-3">
          <div className="font-medium mb-1">Some rows failed:</div>
          <ul className="list-disc ml-5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Nav-aware cell components ---------- */

function NavCell({ row, col, cellRefs, focusCell, setFocusCell, value, onChange, type = 'text' }) {
  const ref = React.useRef(null);
  const editing = focusCell.r === row && focusCell.c === col && focusCell.mode === 'edit';

  // register in matrix
  React.useEffect(() => {
    if (!cellRefs.current[row]) cellRefs.current[row] = [];
    cellRefs.current[row][col] = ref.current;
  }, [row, col]);

  // focus behavior
  React.useEffect(() => {
    if (focusCell.r === row && focusCell.c === col) {
      ref.current?.focus();
      if (!editing) {
        try { ref.current?.setSelectionRange(0, String(value ?? '').length); } catch { }
      } else {
        // caret at end in edit mode
        requestAnimationFrame(() => {
          try {
            const len = String(value ?? '').length;
            ref.current?.setSelectionRange(len, len);
          } catch { }
        });
      }
    }
  }, [focusCell, editing, value, row, col]);

  const isPrintableKey = (e) => e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
  const parseNumber = (txt) => {
    const t = String(txt ?? '').trim();
    if (!t) return '';
    const n = Number(t);
    return Number.isFinite(n) ? n : t;
  };

  const startEditAndReplaceWith = (ch) => {
    setFocusCell({ r: row, c: col, mode: 'edit' });
    const next = type === 'number' ? parseNumber(ch) : ch;
    onChange(next);
    requestAnimationFrame(() => {
      try {
        const len = String(next ?? '').length;
        ref.current?.setSelectionRange(len, len);
      } catch { }
    });
  };

  const onKeyDown = (e) => {
    // NAV MODE
    if (!editing) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const delta = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
        setFocusCell(fc => ({ r: Math.max(0, fc.r + delta[0]), c: Math.max(0, fc.c + delta[1]), mode: 'nav' }));
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setFocusCell({ r: row, c: col, mode: 'edit' });
        return;
      }
      // paste in nav: replace value, stay in nav
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        // let onPaste handle it (no preventDefault here)
        return;
      }
      if (isPrintableKey(e)) {
        e.preventDefault();
        startEditAndReplaceWith(e.key);
        return;
      }
      return;
    }

    // EDIT MODE
    if (e.key === 'Escape') {
      e.preventDefault();
      setFocusCell({ r: row, c: col, mode: 'nav' });
      requestAnimationFrame(() => {
        try { ref.current?.setSelectionRange(0, String(value ?? '').length); } catch { }
      });
      return;
    }
    // NEW: move up/down while keeping edit mode
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dr = e.key === 'ArrowUp' ? -1 : 1;
      const nextR = Math.max(0, Math.min(row + dr, cellRefs.current.length - 1));
      setFocusCell({ r: nextR, c: col, mode: 'edit' });
      return;
    }
    // Left/Right in edit mode: let input handle; Ctrl/Cmd+V: default paste
  };

  const onPaste = (e) => {
    if (focusCell.mode !== 'edit') {
      // nav-mode paste: replace and remain nav
      e.preventDefault();
      const text = e.clipboardData.getData('text') ?? '';
      const line = text.split(/\r?\n/)[0];
      const next = type === 'number' ? parseNumber(line) : line;
      onChange(next);
      requestAnimationFrame(() => {
        try { ref.current?.setSelectionRange(0, String(next ?? '').length); } catch { }
      });
    }
  };

  const onDoubleClick = () => {
    setFocusCell({ r: row, c: col, mode: 'edit' });
    requestAnimationFrame(() => {
      try {
        const len = String(value ?? '').length;
        ref.current?.setSelectionRange(len, len);
      } catch { }
    });
  };

  return (
    <Td onDoubleClick={onDoubleClick}>
      <input
        ref={ref}
        className={`w-full px-2 py-1 border rounded ${!editing ? 'bg-gray-50' : ''}`}
        value={value ?? ''}
        type={type}
        readOnly={!editing}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onChange={(e) => {
          if (type === 'number') {
            const raw = e.target.value;
            onChange(raw === '' ? '' : (Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : Number(raw) || 0));
          } else {
            onChange(e.target.value);
          }
        }}
        onBlur={() => {
          // leave edit when you click away
          if (focusCell.r === row && focusCell.c === col) {
            setFocusCell({ r: row, c: col, mode: 'nav' });
          }
        }}
      />
    </Td>
  );
}

function NavSelect({ row, col, cellRefs, focusCell, setFocusCell, value, onChange, options }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!cellRefs.current[row]) cellRefs.current[row] = [];
    cellRefs.current[row][col] = ref.current;
  }, [row, col]);

  React.useEffect(() => {
    if (focusCell.r === row && focusCell.c === col) ref.current?.focus();
  }, [focusCell, row, col]);

  const onKeyDown = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !e.altKey) {
      // left/right change column; up/down open/select is default behavior in select, so only hijack left/right
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const move = e.key === 'ArrowLeft' ? [0, -1] : [0, 1];
        setFocusCell(fc => ({ r: Math.max(0, fc.r + move[0]), c: Math.max(0, fc.c + move[1]) }));
      }
    }
  };

  return (
    <Td>
      <select
        ref={ref}
        className="w-full px-2 py-1 border rounded bg-white"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </Td>
  );
}

/* ---------- small UI helpers ---------- */
function Th({ children, className = '' }) {
  return <th className={`text-left font-semibold px-3 py-2 ${className}`}>{children}</th>;
}
function Td({ children, className = '', onDoubleClick }) {
  return <td className={`px-3 py-2 ${className}`} onDoubleClick={onDoubleClick}>{children}</td>;
}
function Field({ label, value, onChange, type = 'text', min }) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-gray-600">{label}</span>
      <input className="w-full px-3 py-2 border rounded-2xl" type={type} min={min} value={value}
        onChange={e => onChange(e.target.value)} />
    </label>
  );
}
function Select({ label, value, onChange, options = [] }) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-gray-600">{label}</span>
      <select className="w-full px-3 py-2 border rounded-2xl" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </label>
  );
}
