const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (isDev) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
}

app.whenReady().then(async () => {
  console.log('[MAIN] ready');

  // dynamic imports (ESM modules from CJS)
  const auth = await import('@modules/auth');
  const audit = await import('@modules/audit');
  const inventory = await import('@modules/inventory');

  ipcMain.handle('auth:login', async (_evt, cred) => {
    console.log('[MAIN] auth:login', cred?.email);           // <— LOG
    try {
      const u = await auth.login(cred);
      await audit.logAuthEvent({ outcome: 'SUCCESS', emailTried: cred.email, userId: u.id });
      await audit.logTask(u.id, 'LOGIN_SUCCESS', { email: cred.email });
      console.log('[MAIN] auth:login success', u.email);     // <— LOG
      return u;
    } catch (err) {
      console.error('[MAIN] auth:login fail', err?.message || err); // <— LOG
      await audit.logAuthEvent({ outcome: 'FAIL', emailTried: cred.email, reason: String(err?.message || err) });
      throw err; // ← IMPORTANT: let renderer see the error
    }
  });

  ipcMain.handle('items:list', async (_evt, params) => {
    console.log('[MAIN] items:list');                         // <— LOG
    return inventory.listItems(params || {});
  });

  ipcMain.handle('items:create', async (_evt, dto) => {
    console.log('[MAIN] items:create');                       // <— LOG
    return inventory.createItem(dto);
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
