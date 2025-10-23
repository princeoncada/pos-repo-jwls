// renderer/App.jsx
import React from 'react';
import LoginForm from './components/LoginForm.jsx';
import ItemsPage from './pages/ItemsPage.jsx';

// Admin pages (from my previous message)
import AdminHome from './pages/admin/AdminHome.jsx';
import AdminBranches from './pages/admin/AdminBranches.jsx';
import AdminSuppliers from './pages/admin/AdminSuppliers.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';

export default function App() {
  const [user, setUser] = React.useState(null);
  const [email, setEmail] = React.useState('admin@example.com');
  const [password, setPassword] = React.useState('admin123');

  // views: 'menu' | 'items' | 'reports' | 'admin:home' | 'admin:branches' | 'admin:suppliers' | 'admin:categories'
  const [view, setView] = React.useState('menu');
  const [loading, setLoading] = React.useState(false);

const isAdmin = user?.role?.name?.toLowerCase() === 'owner';
console.log('currentUser:', user);
console.log('isAdmin:', isAdmin);

  async function doLogin(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const u = await window.api.auth.login({ email, password });
      setUser(u);
      setView('menu');
    } catch (err) {
      alert(`Login failed: ${err?.message ?? String(err)}`);
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm
          email={email}
          password={password}
          loading={loading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={doLogin}
        />
      </div>
    );
  }

  if (view === 'items') {
    return <ItemsPage onBack={() => setView('menu')} />;
  }

  if (view === 'reports') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Reports</h1>
            <button className="px-3 py-2 rounded border" onClick={() => setView('menu')}>Back</button>
          </header>
          <div className="p-6 rounded-xl border bg-white text-gray-500">
            (Reports coming soon)
          </div>
        </div>
      </div>
    );
  }

  // --- Admin views ---
  if (isAdmin && view === 'admin:home') {
    return <AdminScreenWrapper title="Admin" onBack={() => setView('menu')}>
      <AdminHome onGo={setView} />
    </AdminScreenWrapper>;
  }
  if (isAdmin && view === 'admin:branches') {
    return <AdminScreenWrapper title="Branches" onBack={() => setView('admin:home')}>
      <AdminBranches />
    </AdminScreenWrapper>;
  }
  if (isAdmin && view === 'admin:suppliers') {
    return <AdminScreenWrapper title="Suppliers" onBack={() => setView('admin:home')}>
      <AdminSuppliers />
    </AdminScreenWrapper>;
  }
  if (isAdmin && view === 'admin:categories') {
    return <AdminScreenWrapper title="Categories" onBack={() => setView('admin:home')}>
      <AdminCategories />
    </AdminScreenWrapper>;
  }

  // --- Main Menu ---
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <header className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">Main Menu</h1>
          <div className="text-xs text-gray-500 text-right">
            {user?.email}
            {isAdmin && <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">admin</div>}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3">
          <button
            className="p-4 rounded-xl border bg-white text-left hover:shadow"
            onClick={() => setView('items')}
          >
            <div className="text-lg font-semibold">Items</div>
            <div className="text-sm text-gray-500">View, edit, and manage inventory</div>
          </button>

          <button
            className="p-4 rounded-xl border bg-white text-left hover:shadow"
            onClick={() => setView('reports')}
          >
            <div className="text-lg font-semibold">Reports</div>
            <div className="text-sm text-gray-500">Sales & inventory reports (soon)</div>
          </button>

          {isAdmin && (
            <button
              className="p-4 rounded-xl border bg-white text-left hover:shadow"
              onClick={() => setView('admin:home')}
            >
              <div className="text-lg font-semibold">Admin</div>
              <div className="text-sm text-gray-500">Branches, Suppliers, and Categories</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small layout wrapper to keep Admin pages consistent with back button/title */
function AdminScreenWrapper({ title, onBack, children }) {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          <button className="px-3 py-2 rounded border" onClick={onBack}>Back</button>
        </header>
        {children}
      </div>
    </div>
  );
}
