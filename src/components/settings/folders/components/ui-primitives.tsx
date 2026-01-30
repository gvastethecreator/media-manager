import { AlertCircle, Folder } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Provider global de tooltips optimizado para evitar 3400+ renders
 */
export const GlobalTooltipProvider = memo(function GlobalTooltipProvider({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider delayDuration={300} skipDelayDuration={100}>
			{children}
		</TooltipProvider>
	);
});

/**
 * Estado vacío cuando no hay carpetas indexadas
 */
export const EmptyFoldersState = memo(function EmptyFoldersState() {
	return (
		<div className="col-span-full py-8 text-center">
			<Folder className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
			<p className="text-muted-foreground text-sm">No hay carpetas indexadas</p>
			<p className="mt-1 text-muted-foreground/75 text-xs">Agrega una carpeta para comenzar a indexar imágenes</p>
		</div>
	);
});

/**
 * Tarjeta de error con botón de reintentar
 */
export const ErrorCard = memo(function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<div className="rounded-dt-md border-none bg-muted/30 shadow-sm">
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

/**
 * Wrapper memoizado para ErrorCard con callbacks optimizados
 */
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
