import { Button } from '@/components/ui/button';

interface RestoreLibraryDialogProps {
	failed?: boolean;
	onRestore: () => void;
	onStartEmpty: () => void;
	onRetry?: () => void;
}

export function RestoreLibraryDialog({ failed, onRestore, onStartEmpty, onRetry }: RestoreLibraryDialogProps) {
	if (failed) {
		return (
			<section className="max-w-md space-y-4">
				<h1 className="font-semibold text-2xl">Unable to restore the previous library</h1>
				<p>The earlier library was not changed. You can start empty or try restore again.</p>
				<div className="flex gap-3">
					<Button onClick={onRetry ?? onRestore}>Try restore again</Button>
					<Button onClick={onStartEmpty} variant="outline">
						Start empty
					</Button>
				</div>
			</section>
		);
	}

	return (
		<section className="max-w-md space-y-4">
			<h1 className="font-semibold text-2xl">Restore your previous library?</h1>
			<p>A Media Manager library from the earlier desktop app was found. Restore it into this app. The original files stay in place.</p>
			<div className="flex gap-3">
				<Button onClick={onRestore}>Restore library</Button>
				<Button onClick={onStartEmpty} variant="outline">
					Start empty
				</Button>
			</div>
		</section>
	);
}
