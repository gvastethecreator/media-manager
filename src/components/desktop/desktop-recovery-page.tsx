import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getDesktopBridge } from '@/platform/desktop';

export function DesktopRecoveryPage() {
	const [busy, setBusy] = useState(false);
	const [logError, setLogError] = useState<string | null>(null);

	async function handleRetry() {
		setBusy(true);
		try {
			await getDesktopBridge().retryBackend();
		} finally {
			setBusy(false);
		}
	}

	async function handleShowLogs() {
		try {
			await getDesktopBridge().openLogFolder();
			setLogError(null);
		} catch {
			setLogError('Unable to open the log folder');
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
			<section className="max-w-md space-y-4">
				<h1 className="font-semibold text-2xl">Unable to start the local library</h1>
				<p>Media Manager cannot start the local server. Close other copies of the app, then try again.</p>
				{logError ? <p className="text-destructive text-sm">{logError}</p> : null}
				<div className="flex gap-3">
					<Button disabled={busy} onClick={() => void handleRetry()}>
						Try again
					</Button>
					<Button onClick={() => void handleShowLogs()} variant="outline">
						Show logs
					</Button>
				</div>
			</section>
		</main>
	);
}
