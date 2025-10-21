import React from 'react';
import LoginForm from './components/LoginForm.jsx';
import ItemsPage from './pages/ItemsPage.jsx'; 

export default function App() {
  const [user, setUser] = React.useState(null);
  const [email, setEmail] = React.useState('admin@example.com');
  const [password, setPassword] = React.useState('admin123');
  const [view, setView] = React.useState('menu'); // 'menu' | 'items' | 'reports'
  const [loading, setLoading] = React.useState(false);

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

  // Menu
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Main Menu</h1>
        <div className="grid grid-cols-1 gap-3">
          <button className="p-4 rounded-xl border bg-white text-left hover:shadow"
                  onClick={() => setView('items')}>
            <div className="text-lg font-semibold">Items</div>
            <div className="text-sm text-gray-500">View, edit, and manage inventory</div>
          </button>
          <button className="p-4 rounded-xl border bg-white text-left hover:shadow"
                  onClick={() => setView('reports')}>
            <div className="text-lg font-semibold">Reports</div>
            <div className="text-sm text-gray-500">Sales & inventory reports (soon)</div>
          </button>
        </div>
      </div>
    </div>
  );
}
