const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (cred) => {
      console.log('[PRELOAD] auth:login', cred?.email);
      return ipcRenderer.invoke('auth:login', cred);
    }
  },
  items: {
    list: (params) => ipcRenderer.invoke('items:list', params),
    create: (dto) => ipcRenderer.invoke('items:create', dto),
    get: (id) => ipcRenderer.invoke('items:get', { id }),
    update: (id, dto) => ipcRenderer.invoke('items:update', { id, dto }),
    remove: (id) => ipcRenderer.invoke('items:delete', { id }),
    openEditWindow: (id) => ipcRenderer.invoke('items:openEditWindow', { id }),
    openAddWindow: () => ipcRenderer.invoke('items:openAddWindow'),
    createBulk: (rows) => ipcRenderer.invoke('items:createBulk', rows),
    nextSeq: (branchId, categoryId) => ipcRenderer.invoke('items:nextSeq', { branchId, categoryId }),

  },
  refs: {
    branches: () => ipcRenderer.invoke('refs:branches'),
    suppliers: () => ipcRenderer.invoke('refs:suppliers'),
    categories: () => ipcRenderer.invoke('refs:categories'),
  },
  admin: {
    createBranch: (dto) => ipcRenderer.invoke('admin:createBranch', dto),
    createSupplier: (dto) => ipcRenderer.invoke('admin:createSupplier', dto),
    createCategory: (dto) => ipcRenderer.invoke('admin:createCategory', dto),
  }
});
