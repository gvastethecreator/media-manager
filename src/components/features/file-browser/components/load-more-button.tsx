import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadMoreButtonProps {
	hasMore: boolean;
	isLoadingMore: boolean;
	loadMore: () => void;
	loadedCount: number;
	totalCount: number;
	className?: string;
}

/**
 * Botón "Cargar más" para chunked loading
 * Muestra progreso y estadísticas de carga
 */
export function LoadMoreButton({
	hasMore,
	isLoadingMore,
	loadMore,
	loadedCount,
	totalCount,
	className,
}: LoadMoreButtonProps) {
	if (!hasMore) {
		return null;
	}

	const remaining = totalCount - loadedCount;
	const percentage = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;

	return (
		<div className={cn('flex flex-col items-center gap-3 border-t bg-background/50 p-4 backdrop-blur-sm', className)}>
			{/* Progress indicator */}
			<div className="flex w-full max-w-md items-center gap-3">
				<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
					<div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${percentage}%` }} />
				</div>
				<span className="font-medium text-muted-foreground text-sm">{percentage}%</span>
			</div>

			{/* Load more button */}
			<Button className="group relative" disabled={isLoadingMore} onClick={loadMore} size="sm" variant="outline">
				{isLoadingMore ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Cargando...
					</>
				) : (
					<>
						<ChevronDown className="mr-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
						Cargar {Math.min(remaining, 150)} más ({remaining} restantes)
					</>
				)}
			</Button>

			{/* Stats */}
			<p className="text-center text-muted-foreground text-xs">
				Mostrando {loadedCount.toLocaleString()} de {totalCount.toLocaleString()} archivos
			</p>
		</div>
	);
}
