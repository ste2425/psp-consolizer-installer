import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('mainAPI', {
    async program() {
        await ipcRenderer.invoke('program');
    },
    onLog(cb: (event: IpcRendererEvent, ...messages: string[]) => void) {
        ipcRenderer.on('log', cb);
    },
    onLogError(cb: (event: IpcRendererEvent, ...messages: string[]) => void) {
        ipcRenderer.on('log:error', cb);
    }
});