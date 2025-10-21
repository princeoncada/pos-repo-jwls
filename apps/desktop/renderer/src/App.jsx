import React from 'react';
import LoginForm from './components/LoginForm.jsx';
import ItemsHeader from './components/ItemsHeader.jsx';
import ItemsTable from './components/ItemsTable.jsx';

export default function App() {
  const [user, setUser] = React.useState(null);
  const [email, setEmail] = React.useState('admin@example.com');
  const [password, setPassword] = React.useState('admin123');
  const [items, setItems] = React.useState([]);

  async function doLogin(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    console.log('[UI] doLogin clicked', { email });      // <— LOG

    try {
      const u = await window.api.auth.login({ email, password });
      console.log('[UI] login success', u);              // <— LOG
      setUser(u);
      const res = await window.api.items.list({});
      setItems(res.items);
    } catch (err) {
      console.error('[UI] login failed', err);           // <— LOG
      alert(`Login failed: ${err?.message ?? String(err)}`);
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  async function addDemoItem() {
    const dto = {
      title: '22K Bracelet',
      category: 'bracelet',
      metal: 'Au',
      karat: '22K',
      weight_g: 8.5,
      condition: 'NEW',
      currentState: 'READY'
    };
    await globalThis.api.items.create(dto);
    const res = await globalThis.api.items.list({});
    setItems(res.items);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={doLogin}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <ItemsHeader title="Items" onAddDemo={addDemoItem} />
      <ItemsTable items={items} />
      <button onClick={() => setUser(null)} className="mt-4 px-3 py-2 rounded bg-red-600 text-white">
        Logout
      </button>
    </div>
  );
}
