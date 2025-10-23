const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.webContents.on('did-finish-load', () => {
    console.log('[MAIN] Renderer finished load');
    win.show();
  });
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[MAIN] did-fail-load', code, desc, url);
  });

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
    win.loadURL('http://localhost:5173').catch(err => console.error('[MAIN] loadURL error', err));
  } else {
    win.loadFile(path.join(__dirname, '../renderer/dist/index.html')).catch(err => console.error('[MAIN] loadFile error', err));
  }
}

app.whenReady().then(async () => {
  console.log('[MAIN] ready');

  // ESM modules: import dynamically
  const auth = await import('@modules/auth');
  const audit = await import('@modules/audit');
  const inventory = await import('@modules/inventory');

  ipcMain.handle('auth:login', async (_evt, cred) => {
    console.log('[MAIN] auth:login', cred?.email);
    try {
      const u = await auth.login(cred);
      await audit.logAuthEvent({ outcome: 'SUCCESS', emailTried: cred.email, userId: u.id });
      await audit.logTask(u.id, 'LOGIN_SUCCESS', { email: cred.email });
      console.log('[MAIN] auth:login success', u.email);
      return u;
    } catch (err) {
      console.error('[MAIN] auth:login fail', err?.message || err);
      await audit.logAuthEvent({ outcome: 'FAIL', emailTried: cred.email, reason: String(err?.message || err) });
      throw err; // rethrow so renderer can show it
    }
  });

  ipcMain.handle('items:list', async (_evt, params) => inventory.listItems(params || {}));
  ipcMain.handle('items:create', async (_evt, { dto }) => inventory.createItem(dto));
  ipcMain.handle('items:get', async (_evt, { id }) => inventory.getItem(id));
  ipcMain.handle('items:update', async (_evt, { id, dto }) => inventory.updateItem(id, dto));
  ipcMain.handle('items:delete', async (_evt, { id }) => inventory.deleteItem(id));

  // Reference lists
  ipcMain.handle('refs:branches', async () => inventory.listBranches());
  ipcMain.handle('refs:suppliers', async () => inventory.listSuppliers());
  ipcMain.handle('refs:categories', async () => inventory.listCategories());

  // Admin creates (protect with your auth/role check as needed)
  ipcMain.handle('admin:createBranch', async (_e, dto) => inventory.createBranch(dto));
  ipcMain.handle('admin:createSupplier', async (_e, dto) => inventory.createSupplier(dto));
  ipcMain.handle('admin:createCategory', async (_e, dto) => inventory.createCategory(dto));

  // Open a NEW EDIT WINDOW
  ipcMain.handle('items:openEditWindow', async (_e, { id }) => {
    const child = new BrowserWindow({
      width: 640,
      height: 720,
      parent: win,
      modal: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    if (isDev) {
      await child.loadURL(`http://localhost:5173/?edit=${encodeURIComponent(id)}`);
    } else {
      await child.loadFile(path.join(__dirname, '../renderer/dist/index.html'), {
        search: `?edit=${encodeURIComponent(id)}`
      });
    }
    child.once('ready-to-show', () => child.show());
    return true;
  });

  /** NEW: Open Add Item/s window */
  ipcMain.handle('items:openAddWindow', async () => {
    const child = new BrowserWindow({
      width: 1100,
      height: 720,
      parent: win,
      modal: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    if (isDev) {
      await child.loadURL(`http://localhost:5173/?addItems=1`);
    } else {
      await child.loadFile(path.join(__dirname, '../renderer/dist/index.html'), {
        search: `?addItems=1`
      });
    }
    child.once('ready-to-show', () => child.show());
    return true;
  });

  /** NEW: bulk create (sequential) */
  ipcMain.handle('items:createBulk', async (_evt, rows) => {
    return inventory.createItemsBulk(rows || []);
  });

  ipcMain.handle('items:nextSeq', async (_e, { branchId, categoryId }) => {
    return inventory.getNextSeq({ branchId, categoryId });
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
