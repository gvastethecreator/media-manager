import { useEffect, useState } from 'react';
import App from '@/App';
import { DesktopRecoveryPage } from '@/components/desktop/desktop-recovery-page';
import { RestoreLibraryDialog } from '@/components/desktop/restore-library-dialog';
import { GlobalErrorHandler } from '@/components/core/global-error-handler';
import { getDesktopBridge } from '@/platform/desktop';
import { isDesktopRuntime } from '@/platform/detect';
import { AppProvider } from '@/providers/app-provider';

function DesktopGate({ children }: { children: import('react').ReactNode }) {
	const [status, setStatus] = useState<'ready' | 'blocked' | 'loading'>('loading');
	const [restoreAvailable, setRestoreAvailable] = useState(false);
	const [restoreFailed, setRestoreFailed] = useState(false);

	useEffect(() => {
		if (!isDesktopRuntime()) {
			setStatus('ready');
			return;
		}
		let cancelled = false;
		const poll = async () => {
			const offer = await getDesktopBridge().getRestoreOffer();
			if (cancelled) return;
			if (offer.available) {
				setRestoreAvailable(true);
				setStatus('ready');
				return;
			}
			setRestoreAvailable(false);
			const next = await getDesktopBridge().getBackendStatus();
			if (!cancelled) setStatus(next === 'ready' || next === 'starting' ? 'ready' : 'blocked');
		};
		void poll();
		const timer = window.setInterval(() => void poll(), 2_000);
		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, []);

	if (!isDesktopRuntime()) return children;
	if (restoreAvailable) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
				<RestoreLibraryDialog
					failed={restoreFailed}
					onRestore={() => {
						void (async () => {
							const result = await getDesktopBridge().confirmRestore();
							if (result.status === 'failed') {
								setRestoreFailed(true);
								return;
							}
							setRestoreFailed(false);
							setRestoreAvailable(false);
						})();
					}}
					onStartEmpty={() => {
						void (async () => {
							await getDesktopBridge().skipRestore();
							setRestoreFailed(false);
							setRestoreAvailable(false);
						})();
					}}
					onRetry={() => {
						void (async () => {
							const result = await getDesktopBridge().confirmRestore();
							if (result.status === 'failed') {
								setRestoreFailed(true);
								return;
							}
							setRestoreFailed(false);
							setRestoreAvailable(false);
						})();
					}}
				/>
			</main>
		);
	}
	if (status === 'loading') {
		return <main className="min-h-screen bg-background" />;
	}
	if (status === 'blocked') {
		return <DesktopRecoveryPage />;
	}
	return children;
}

export function AppShell() {
	return (
		<GlobalErrorHandler>
			<AppProvider>
				<div className="root">
					<DesktopGate>
						<App />
					</DesktopGate>
				</div>
			</AppProvider>
		</GlobalErrorHandler>
	);
}
