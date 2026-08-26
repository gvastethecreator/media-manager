import type {
	BackendStatus,
	DesktopRestoreOffer,
	DesktopRestoreResult,
	DesktopRuntimeInfo,
} from './ipc-contract';

export interface DesktopBridge {
	confirmRestore(): Promise<DesktopRestoreResult>;
	getBackendStatus(): Promise<BackendStatus>;
	getRestoreOffer(): Promise<DesktopRestoreOffer>;
	getRuntimeInfo(): Promise<DesktopRuntimeInfo>;
	openLogFolder(): Promise<void>;
	retryBackend(): Promise<BackendStatus>;
	skipRestore(): Promise<DesktopRestoreResult>;
}
