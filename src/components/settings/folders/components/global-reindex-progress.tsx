import { memo } from 'react';
import { Progress } from '@/components/ui/progress';

/**
 * Barra de progreso para reindexado global
 * Muestra el porcentaje de avance durante el proceso
 */
export const GlobalReindexProgress = memo(function GlobalReindexProgress({
	show,
	progress,
}: {
	show: boolean;
	progress: number;
}) {
	if (!show) {
		return null;
	}

	return (
		<div className="mt-2">
			<Progress className="h-2" data-testid="reindex-global-progress" value={progress} />
			<p className="mt-1 text-center text-muted-foreground text-xs">Reindexando... {Math.round(progress)}%</p>
		</div>
	);
});
