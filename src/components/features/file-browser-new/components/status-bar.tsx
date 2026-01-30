/**
 * @file Componente de Status Bar del File Browser
 * @module file-browser-new/components/status-bar
 */

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StatusBarProps } from '../types';

export function FileBrowserStatusBar({
	totalItems,
	shownItems,
	selectedCount,
	isLoading = false,
	pagination,
	onPrevPage,
	onNextPage,
	className,
}: StatusBarProps) {
	const hasPages = pagination && pagination.totalPages > 1;
	const canPrev = pagination && pagination.page > 0;
	const canNext = pagination && (pagination.page < pagination.totalPages - 1 || pagination.hasMore);

	return (
		<div
			className={cn(
				'flex items-center justify-between border-t px-3 py-1.5 text-caption text-muted-foreground',
				className
			)}
			data-testid="file-browser-status-bar"
			style={{ backgroundColor: 'color-mix(in oklab, var(--muted), transparent 70%)' }}
		>
			{/* Lado izquierdo: conteos */}
			<div className="flex items-center gap-3">
				{isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
				<span>
					{shownItems.toLocaleString()} de {totalItems.toLocaleString()} elementos
				</span>
				{selectedCount > 0 && (
					<span className="text-primary">
						• {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
					</span>
				)}
			</div>

			{/* Centro: info de paginación */}
			{hasPages && (
				<div className="flex items-center gap-2">
					<span>
						Página {(pagination.page + 1).toLocaleString()} de {pagination.totalPages.toLocaleString()}
					</span>
				</div>
			)}

			{/* Lado derecho: navegación de páginas */}
			{hasPages && (
				<div className="flex items-center gap-1">
					<Button className="h-6 w-6" disabled={!canPrev || isLoading} onClick={onPrevPage} size="icon" variant="ghost">
						<ChevronLeft className="h-3 w-3" />
						<span className="sr-only">Página anterior</span>
					</Button>
					<Button className="h-6 w-6" disabled={!canNext || isLoading} onClick={onNextPage} size="icon" variant="ghost">
						<ChevronRight className="h-3 w-3" />
						<span className="sr-only">Página siguiente</span>
					</Button>
				</div>
			)}
		</div>
	);
}
