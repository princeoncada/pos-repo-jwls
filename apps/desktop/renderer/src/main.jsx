import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tailwind.css';
import App from './App.jsx';
import EditItemWindow from './pages/EditItemWindow.jsx';

const params = new URLSearchParams(window.location.search);
const editId = params.get('edit');

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');
createRoot(rootEl).render(editId ? <EditItemWindow itemId={editId} /> : <App />);
