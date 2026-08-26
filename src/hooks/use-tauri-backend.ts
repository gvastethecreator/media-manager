import { useEffect, useState } from 'react';
import { isDesktopRuntime } from '@/platform/detect';
import { getDesktopBridge } from '@/platform/desktop';
import { clientLogger } from '@/lib/logger/client-logger';

interface BackendStatus {
	error: string | null;
	isChecking: boolean;
	isRunning: boolean;
}

export function useDesktopBackend() {
	const [status, setStatus] = useState<BackendStatus>({
		isRunning: false,
		isChecking: true,
		error: null,
	});

	useEffect(() => {
		if (!isDesktopRuntime()) {
			setStatus({ error: null, isChecking: false, isRunning: false });
			return;
		}
		let cancelled = false;
		const poll = async () => {
			try {
				const next = await getDesktopBridge().getBackendStatus();
				if (!cancelled) {
					setStatus({ error: null, isChecking: false, isRunning: next === 'ready' });
				}
			} catch (error) {
				clientLogger.warn('Backend not available:', error);
				if (!cancelled) {
					setStatus({ error: String(error), isChecking: false, isRunning: false });
				}
			}
		};
		void poll();
		const interval = setInterval(() => void poll(), 15_000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, []);

	return status;
}

export function useDesktopContext() {
	return isDesktopRuntime();
}

/** @deprecated Use useDesktopBackend */
export const useTauriBackend = useDesktopBackend;
/** @deprecated Use useDesktopContext */
export const useTauriContext = useDesktopContext;

export function getApiBaseUrl(): string {
	return '/api';
}
