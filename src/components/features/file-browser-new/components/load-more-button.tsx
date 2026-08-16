/**
 * @file Botón de cargar más para File Browser
 * @module file-browser-new/components/load-more-button
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LoadMoreButtonProps {
	/** Clase CSS adicional */
	className?: string;
	/** Si hay más items */
	hasMore: boolean;
	/** Si está cargando */
	isLoading: boolean;
	/** Items cargados */
	loadedCount: number;
	/** Handler de carga */
	onLoadMore: () => void;
	/** Total de items */
	totalCount: number;
}

export function LoadMoreButton({
	hasMore,
	isLoading,
	loadedCount,
	totalCount,
	onLoadMore,
	className,
}: LoadMoreButtonProps) {
	if (!(hasMore || isLoading)) return null;

	const remaining = totalCount - loadedCount;

	return (
		<div
			className={cn('flex items-center justify-center gap-3 border-t bg-muted/30 py-3', className)}
			data-testid="load-more-button"
		>
			<Button disabled={isLoading || !hasMore} onClick={onLoadMore} size="sm" variant="outline">
				{isLoading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Loading...
					</>
				) : (
					<>
						Load more
						{remaining > 0 && (
							<span className="ml-1 text-muted-foreground">({remaining.toLocaleString()} restantes)</span>
						)}
					</>
				)}
			</Button>
			<span className="text-muted-foreground text-xs">
				{loadedCount.toLocaleString()} de {totalCount.toLocaleString()}
			</span>
		</div>
	);
}
