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

  ipcMain.handle('items:list',   async (_evt, params)       => inventory.listItems(params || {}));
  ipcMain.handle('items:create', async (_evt, { dto })      => inventory.createItem(dto));
  ipcMain.handle('items:get',    async (_evt, { id })       => inventory.getItem(id));
  ipcMain.handle('items:update', async (_evt, { id, dto })  => inventory.updateItem(id, dto));
  ipcMain.handle('items:delete', async (_evt, { id })       => inventory.deleteItem(id));

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

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
