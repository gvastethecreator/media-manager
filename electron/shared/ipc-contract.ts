export const DEV_WINDOW_ORIGIN = 'http://127.0.0.1:5173';

export const DESKTOP_CHANNELS = {
	confirmRestore: 'desktop:confirm-restore',
	getBackendStatus: 'desktop:get-backend-status',
	getRestoreOffer: 'desktop:get-restore-offer',
	getRuntimeInfo: 'desktop:get-runtime-info',
	openLogFolder: 'desktop:open-log-folder',
	retryBackend: 'desktop:retry-backend',
	skipRestore: 'desktop:skip-restore',
} as const;

export type DesktopChannel = (typeof DESKTOP_CHANNELS)[keyof typeof DESKTOP_CHANNELS];

export const DESKTOP_METHODS = [
	DESKTOP_CHANNELS.getRuntimeInfo,
	DESKTOP_CHANNELS.getBackendStatus,
	DESKTOP_CHANNELS.retryBackend,
	DESKTOP_CHANNELS.openLogFolder,
	DESKTOP_CHANNELS.getRestoreOffer,
	DESKTOP_CHANNELS.confirmRestore,
	DESKTOP_CHANNELS.skipRestore,
] as const;

export const FORBIDDEN_DESKTOP_APIS = ['deleteFile', 'openPath', 'invoke', 'ipcRenderer'] as const;

export type BackendStatus = 'starting' | 'ready' | 'degraded' | 'stopped';

export interface DesktopRuntimeInfo {
	appVersion: string;
	dataDirLabel: string;
	isDesktop: true;
}

export interface DesktopRestoreOffer {
	available: boolean;
	sourceLabel: string;
}

export interface DesktopRestoreResult {
	status: 'completed' | 'already-completed' | 'no-source' | 'failed';
	error?: string;
}

export function isAllowedDesktopChannel(channel: string): channel is DesktopChannel {
	return (DESKTOP_METHODS as readonly string[]).includes(channel);
}

export function resolveAllowedWindowOrigin(mode: 'development' | 'production', publicPort: number): string {
	if (mode === 'development') return DEV_WINDOW_ORIGIN;
	return `http://127.0.0.1:${publicPort}`;
}
