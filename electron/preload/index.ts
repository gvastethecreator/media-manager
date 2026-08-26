import { createRequire } from 'node:module';
import type { DesktopBridge } from '../shared/desktop-api';
import { DESKTOP_CHANNELS } from '../shared/ipc-contract';

const { contextBridge, ipcRenderer } = createRequire(import.meta.url)('electron') as typeof import('electron');

const desktop: DesktopBridge = {
	confirmRestore: () => ipcRenderer.invoke(DESKTOP_CHANNELS.confirmRestore),
	getBackendStatus: () => ipcRenderer.invoke(DESKTOP_CHANNELS.getBackendStatus),
	getRestoreOffer: () => ipcRenderer.invoke(DESKTOP_CHANNELS.getRestoreOffer),
	getRuntimeInfo: () => ipcRenderer.invoke(DESKTOP_CHANNELS.getRuntimeInfo),
	openLogFolder: () => ipcRenderer.invoke(DESKTOP_CHANNELS.openLogFolder),
	retryBackend: () => ipcRenderer.invoke(DESKTOP_CHANNELS.retryBackend),
	skipRestore: () => ipcRenderer.invoke(DESKTOP_CHANNELS.skipRestore),
};

contextBridge.exposeInMainWorld('desktop', desktop);
