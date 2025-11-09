import { AlertCircle } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';

export const ErrorCard = memo(function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<div className="rounded-sm border-none bg-muted/30">
			<div className="flex flex-col gap-2 p-3">
				<div className="flex items-center gap-2 text-destructive">
					<AlertCircle className="h-4 w-4" />
					<p className="text-sm">{message}</p>
				</div>
				<Button className="mt-1 w-full text-xs" onClick={onRetry} size="sm" variant="outline">
					Reintentar
				</Button>
			</div>
		</div>
	);
});

// Optimización adicional: memoizar el callback de retry para evitar re-renders del ErrorCard
export const MemoizedErrorWrapper = memo(function MemoizedErrorWrapper({
	displayError,
	setErrorMessage,
	setError,
	loadStats,
}: {
	displayError: string;
	setErrorMessage: (msg: string | null) => void;
	setError: (err: string | null) => void;
	loadStats: () => void;
}) {
	const handleRetry = useCallback(() => {
		setErrorMessage(null);
		setError(null);
		loadStats();
	}, [setErrorMessage, setError, loadStats]);

	return <ErrorCard message={displayError} onRetry={handleRetry} />;
});
