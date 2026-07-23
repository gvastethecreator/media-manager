/**
 * @file Componente de Status Bar del File Browser
 * @module file-browser-new/components/status-bar
 */

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StatusBarProps } from '../types/props.types';

export function FileBrowserStatusBar({
	totalItems,
	shownItems,
	selectedCount,
	isLoading = false,
	pagination,
	onPrevPage,
	onNextPage,
	startupRecovery,
	startupRecoveryUnavailable = false,
	className,
}: StatusBarProps) {
	const hasPages = pagination && pagination.totalPages > 1;
	const canPrev = pagination && pagination.page > 0;
	const canNext = pagination && (pagination.page < pagination.totalPages - 1 || pagination.hasMore);
	const pageLabel = hasPages ? `${pagination.page + 1}/${pagination.totalPages}` : null;
	const summaryLabel = `${shownItems.toLocaleString()}/${totalItems.toLocaleString()}`;
	const selectionLabel = selectedCount > 0 ? `${selectedCount.toLocaleString()} sel.` : null;
	const recoveryLabel = startupRecoveryUnavailable
		? 'Rec. sin estado'
		: startupRecovery?.state === 'manual_review_required'
			? `Rec. ${startupRecovery.manual} revisión`
			: startupRecovery?.state === 'pending'
				? `Rec. ${startupRecovery.pending} pendiente${startupRecovery.pending === 1 ? '' : 's'}`
				: startupRecovery?.state === 'resolved'
					? `Rec. ${startupRecovery.completed} resuelta${startupRecovery.completed === 1 ? '' : 's'}`
					: null;
	const recoveryTitle = startupRecoveryUnavailable
		? 'No se pudo comprobar el estado de recuperación al iniciar.'
		: startupRecovery?.state === 'manual_review_required'
			? `La recuperación de inicio requiere revisión manual para ${startupRecovery.manual} ${startupRecovery.manual === 1 ? 'operación' : 'operaciones'}.${startupRecovery.pending > 0 ? ` Además, ${startupRecovery.pending} ${startupRecovery.pending === 1 ? 'operación sigue pendiente' : 'operaciones siguen pendientes'} de reconciliación.` : ''}`
			: startupRecovery?.state === 'pending'
				? `${startupRecovery.pending} ${startupRecovery.pending === 1 ? 'operación sigue pendiente' : 'operaciones siguen pendientes'} de reconciliación.`
				: startupRecovery?.state === 'resolved'
					? `${startupRecovery.completed} ${startupRecovery.completed === 1 ? 'operación se reconcilió' : 'operaciones se reconciliaron'} al iniciar.`
					: undefined;

	return (
		<div
			className={cn(
				'grid h-[15px] min-h-[15px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-t px-2 font-medium text-[10px] leading-none text-muted-foreground',
				className
			)}
			data-testid="file-browser-status-bar"
			style={{ backgroundColor: 'color-mix(in oklab, var(--muted), transparent 70%)' }}
		>
			<div className="flex min-w-0 items-center gap-1 overflow-hidden tabular-nums">
				{isLoading && <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />}
				<span className="truncate">{summaryLabel}</span>
				{selectionLabel && <span className="truncate text-primary">• {selectionLabel}</span>}
			</div>

			{hasPages && (
				<div className="justify-self-center tabular-nums">
					<span>Pág. {pageLabel}</span>
				</div>
			)}

			<div className="flex min-w-0 items-center justify-end gap-0.5 tabular-nums">
				{recoveryLabel && (
					<span
						aria-live="polite"
						className={cn(
							'mr-1 truncate',
							(startupRecoveryUnavailable || startupRecovery?.state === 'manual_review_required') && 'text-destructive',
							startupRecovery?.state === 'pending' && 'text-primary'
						)}
						aria-label={recoveryTitle}
						data-testid="file-browser-startup-recovery"
						title={recoveryTitle}
					>
						{recoveryLabel}
					</span>
				)}
				{hasPages ? (
					<>
						<Button
							className="h-3.5 w-3.5 rounded-sm p-0 hover:bg-accent/70"
							disabled={!canPrev || isLoading}
							onClick={onPrevPage}
							size="icon"
							variant="ghost"
						>
							<ChevronLeft className="h-2.5 w-2.5" />
							<span className="sr-only">Página anterior</span>
						</Button>
						<Button
							className="h-3.5 w-3.5 rounded-sm p-0 hover:bg-accent/70"
							disabled={!canNext || isLoading}
							onClick={onNextPage}
							size="icon"
							variant="ghost"
						>
							<ChevronRight className="h-2.5 w-2.5" />
							<span className="sr-only">Página siguiente</span>
						</Button>
					</>
				) : isLoading ? (
					<span className="truncate opacity-80">Cargando…</span>
				) : (
					!recoveryLabel && <span className="truncate opacity-80">Listo</span>
				)}
			</div>
		</div>
	);
}
