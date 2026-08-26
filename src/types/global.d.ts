declare global {
	interface Window {
		desktop?: {
			confirmRestore(): Promise<{ status: 'completed' | 'already-completed' | 'no-source' | 'failed'; error?: string }>;
			getBackendStatus(): Promise<'starting' | 'ready' | 'degraded' | 'stopped'>;
			getRestoreOffer(): Promise<{ available: boolean; sourceLabel: string }>;
			getRuntimeInfo(): Promise<{ appVersion: string; dataDirLabel: string; isDesktop: true }>;
			openLogFolder(): Promise<void>;
			retryBackend(): Promise<'starting' | 'ready' | 'degraded' | 'stopped'>;
			skipRestore(): Promise<{ status: 'completed' | 'already-completed' | 'no-source' | 'failed'; error?: string }>;
		};
	}

	interface RequestInit {
		duplex?: 'half';
	}

	const ENV: Record<string, string | undefined>;
}
