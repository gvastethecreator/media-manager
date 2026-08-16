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
	onReviewRecovery,
	recoveryRepairing = false,
	startupRecovery,
	startupRecoveryUnavailable = false,
	className,
}: StatusBarProps) {
	const hasPages = pagination && pagination.totalPages > 1;
	const canPrev = pagination && pagination.page > 0;
	const canNext = pagination && (pagination.page < pagination.totalPages - 1 || pagination.hasMore);
	const pageLabel = hasPages ? `${pagination.page + 1}/${pagination.totalPages}` : null;
	const summaryLabel = `${shownItems.toLocaleString()}/${totalItems.toLocaleString()}`;
	const selectionLabel = selectedCount > 0 ? `${selectedCount.toLocaleString()} selected` : null;
	const recoveryLabel = startupRecoveryUnavailable
		? 'Recovery unavailable'
		: startupRecovery?.state === 'manual_review_required'
			? `Recovery: ${startupRecovery.manual} review`
			: startupRecovery?.state === 'pending'
				? `Recovery: ${startupRecovery.pending} pending`
				: startupRecovery?.state === 'resolved'
					? `Recovery: ${startupRecovery.completed} resolved`
					: null;
	const recoveryTitle = startupRecoveryUnavailable
		? 'Startup recovery status could not be checked.'
		: startupRecovery?.state === 'manual_review_required'
			? `Startup recovery requires manual review for ${startupRecovery.manual} ${startupRecovery.manual === 1 ? 'operation' : 'operations'}.${startupRecovery.pending > 0 ? ` In addition, ${startupRecovery.pending} ${startupRecovery.pending === 1 ? 'operation remains' : 'operations remain'} pending reconciliation.` : ''}`
			: startupRecovery?.state === 'pending'
				? `${startupRecovery.pending} ${startupRecovery.pending === 1 ? 'operation remains' : 'operations remain'} pending reconciliation.`
				: startupRecovery?.state === 'resolved'
					? `${startupRecovery.completed} ${startupRecovery.completed === 1 ? 'operation was' : 'operations were'} reconciled at startup.`
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
					<span>Page {pageLabel}</span>
				</div>
			)}

			<div className="flex min-w-0 items-center justify-end gap-0.5 tabular-nums">
				{recoveryLabel &&
					(startupRecovery?.state === 'manual_review_required' && onReviewRecovery ? (
						<Button
							aria-label={recoveryTitle}
							aria-live="polite"
							className="mr-1 h-3.5 min-h-0 rounded-sm px-0.5 text-[10px] leading-none text-destructive hover:bg-destructive/10"
							data-testid="file-browser-startup-recovery"
							disabled={recoveryRepairing}
							onClick={onReviewRecovery}
							title={recoveryTitle}
							variant="ghost"
						>
							{recoveryRepairing ? 'Reviewing…' : recoveryLabel}
						</Button>
					) : (
						<span
							aria-live="polite"
							className={cn(
								'mr-1 truncate',
								(startupRecoveryUnavailable || startupRecovery?.state === 'manual_review_required') &&
									'text-destructive',
								startupRecovery?.state === 'pending' && 'text-primary'
							)}
							aria-label={recoveryTitle}
							data-testid="file-browser-startup-recovery"
							title={recoveryTitle}
						>
							{recoveryLabel}
						</span>
					))}
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
							<span className="sr-only">Previous page</span>
						</Button>
						<Button
							className="h-3.5 w-3.5 rounded-sm p-0 hover:bg-accent/70"
							disabled={!canNext || isLoading}
							onClick={onNextPage}
							size="icon"
							variant="ghost"
						>
							<ChevronRight className="h-2.5 w-2.5" />
							<span className="sr-only">Next page</span>
						</Button>
					</>
				) : isLoading ? (
					<span className="truncate opacity-80">Loading…</span>
				) : (
					!recoveryLabel && <span className="truncate opacity-80">Ready</span>
				)}
			</div>
		</div>
	);
}
