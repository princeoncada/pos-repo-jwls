// renderer/pages/admin/AdminHome.jsx
import React from 'react';

export default function AdminHome({ onGo }) {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-gray-500">Manage reference data for Items (Branches, Suppliers, Categories).</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card title="Branches" desc="Add/view store branches (slug + name).">
          <button className="px-3 py-2 rounded-2xl bg-black text-white text-sm" onClick={() => onGo('admin:branches')}>
            Open Branches
          </button>
        </Card>

        <Card title="Suppliers" desc="Add/view supplier companies or persons.">
          <button className="px-3 py-2 rounded-2xl bg-black text-white text-sm" onClick={() => onGo('admin:suppliers')}>
            Open Suppliers
          </button>
        </Card>

        <Card title="Categories" desc="Add/view jewelry categories and their codes.">
          <button className="px-3 py-2 rounded-2xl bg-black text-white text-sm" onClick={() => onGo('admin:categories')}>
            Open Categories
          </button>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, desc, children }) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-2 shadow-sm">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-600">{desc}</div>
      <div>{children}</div>
    </div>
  );
}
