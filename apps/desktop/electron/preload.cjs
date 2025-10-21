// apps/desktop/electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

function safeInvoke(channel, payload) {
  // adds consistent error surface to renderer
  return ipcRenderer.invoke(channel, payload);
}

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (cred) => {
      console.log('[PRELOAD] invoke auth:login', cred?.email);  // <— LOG
      return safeInvoke('auth:login', cred);
    }
  },
  items: {
    list: (params) => {
      console.log('[PRELOAD] invoke items:list');               // <— LOG
      return safeInvoke('items:list', params);
    },
    create: (dto) => {
      console.log('[PRELOAD] invoke items:create');             // <— LOG
      return safeInvoke('items:create', dto);
    }
  }
});
