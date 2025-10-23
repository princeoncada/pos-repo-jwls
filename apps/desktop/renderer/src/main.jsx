import { createRoot } from 'react-dom/client';
import './styles/tailwind.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import App from './App.jsx';
import EditItemWindow from './windows/EditItemWindow.jsx';
import AddItemsWindow from './windows/AddItemsWindow.jsx'; // ✅ NEW

const params = new URLSearchParams(window.location.search);
const editId = params.get('edit');
const isAddWindow = params.has('addItems'); // ✅ NEW flag

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');

// ✅ conditional rendering based on URL params
let content;
if (isAddWindow) {
  content = <AddItemsWindow />;            // open Add Item/s window
} else if (editId) {
  content = <EditItemWindow itemId={editId} />; // open Edit modal
} else {
  content = <App />;                     // default main app
}

createRoot(rootEl).render(content);
