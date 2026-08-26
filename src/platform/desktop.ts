import { isDesktopRuntime } from './detect';

export type DesktopBridge = {
	confirmRestore(): Promise<{ status: 'completed' | 'already-completed' | 'no-source' | 'failed'; error?: string }>;
	getBackendStatus(): Promise<'starting' | 'ready' | 'degraded' | 'stopped'>;
	getRestoreOffer(): Promise<{ available: boolean; sourceLabel: string }>;
	getRuntimeInfo(): Promise<{ appVersion: string; dataDirLabel: string; isDesktop: true }>;
	openLogFolder(): Promise<void>;
	retryBackend(): Promise<'starting' | 'ready' | 'degraded' | 'stopped'>;
	skipRestore(): Promise<{ status: 'completed' | 'already-completed' | 'no-source' | 'failed'; error?: string }>;
};

export function getDesktopBridge(): DesktopBridge {
	const bridge = (window as Window & { desktop?: DesktopBridge }).desktop;
	if (!isDesktopRuntime() || !bridge) {
		throw new Error('Desktop bridge is only available in the desktop shell.');
	}
	return bridge;
}
