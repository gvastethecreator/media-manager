/**
 * Batch Operations Indicator Component
 *
 * A compact indicator that shows when batch operations are running,
 * with a quick overview and access to the full operations panel.
 */

import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Clock, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { cn } from '@/lib/utils';
import { BatchOperationsPanel } from './BatchOperationsPanel';

interface BatchOperationsIndicatorProps {
	className?: string;
	/** Show detailed progress in the indicator */
	showProgress?: boolean;
	/** Position of the popover */
	popoverSide?: 'top' | 'bottom' | 'left' | 'right';
	/** Auto-hide when no operations */
	autoHide?: boolean;
}

export function BatchOperationsIndicator({
	className,
	showProgress = true,
	popoverSide = 'top',
	autoHide = true,
}: BatchOperationsIndicatorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { summary, activeOperations, isProcessing, cancelOperation } = useBatchOperations({
		refreshInterval: 500, // More frequent updates for indicator
	});

	// Auto-hide when no operations
	if (autoHide && summary.total === 0) {
		return null;
	}

	// Calculate overall progress for active operations
	const overallProgress =
		activeOperations.length > 0
			? activeOperations.reduce((acc, op) => acc + op.progress.percentage, 0) / activeOperations.length
			: 0;

	// Get the most relevant status
	const getIndicatorStatus = () => {
		if (summary.running > 0) return 'running';
		if (summary.failed > 0) return 'failed';
		if (summary.paused > 0) return 'paused';
		if (summary.queued > 0) return 'queued';
		if (summary.completed > 0) return 'completed';
		return 'idle';
	};

	const status = getIndicatorStatus();

	const getStatusIcon = () => {
		switch (status) {
			case 'running':
				return <Loader2 className="h-3 w-3 animate-spin" />;
			case 'completed':
				return <CheckCircle className="h-3 w-3 text-green-500" />;
			case 'failed':
				return <AlertCircle className="h-3 w-3 text-red-500" />;
			case 'paused':
				return <Clock className="h-3 w-3 text-yellow-500" />;
			case 'queued':
				return <Clock className="h-3 w-3 text-blue-500" />;
			default:
				return <CheckCircle className="h-3 w-3 text-gray-400" />;
		}
	};

	const getStatusColor = () => {
		switch (status) {
			case 'running':
				return 'bg-blue-500';
			case 'completed':
				return 'bg-green-500';
			case 'failed':
				return 'bg-red-500';
			case 'paused':
				return 'bg-yellow-500';
			case 'queued':
				return 'bg-blue-400';
			default:
				return 'bg-gray-400';
		}
	};

	const getStatusText = () => {
		if (summary.running > 0) {
			return `${summary.running} ejecutándose`;
		}
		if (summary.queued > 0) {
			return `${summary.queued} en cola`;
		}
		if (summary.paused > 0) {
			return `${summary.paused} pausadas`;
		}
		if (summary.failed > 0) {
			return `${summary.failed} fallidas`;
		}
		if (summary.completed > 0) {
			return `${summary.completed} completadas`;
		}
		return 'Sin operaciones';
	};

	// Quick cancel for running operations
	const handleQuickCancel = (e: React.MouseEvent) => {
		e.stopPropagation();
		const runningOp = activeOperations.find((op) => op.status === 'running');
		if (runningOp) {
			cancelOperation(runningOp.id);
		}
	};

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<Button
					className={cn(
						'h-8 gap-2 px-2 font-medium text-xs transition-all duration-200',
						isProcessing && 'animate-pulse',
						className
					)}
					size="sm"
					variant="ghost"
				>
					{/* Status indicator dot */}
					<div className={cn('h-2 w-2 rounded-full transition-colors', getStatusColor())} />

					{/* Status icon */}
					{getStatusIcon()}

					{/* Status text */}
					<span className="hidden sm:inline">{getStatusText()}</span>

					{/* Mobile: just show count */}
					<span className="sm:hidden">{summary.total}</span>

					{/* Progress indicator */}
					{showProgress && isProcessing && (
						<div className="h-1 w-8 overflow-hidden rounded-full bg-muted">
							<div className="h-full bg-primary transition-all duration-300" style={{ width: `${overallProgress}%` }} />
						</div>
					)}

					{/* Expand/collapse icon */}
					{isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}

					{/* Quick cancel button for running operations */}
					{summary.running > 0 && (
						<Button
							className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
							onClick={handleQuickCancel}
							size="sm"
							title="Cancelar operación activa"
							variant="ghost"
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-96 p-0" side={popoverSide} sideOffset={8}>
				<div className="p-4">
					<BatchOperationsPanel maxHeight="300px" />
				</div>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Compact version for status bars
 */
export function BatchOperationsStatusIndicator({ className }: { className?: string }) {
	const { summary, isProcessing } = useBatchOperations({
		refreshInterval: 1000,
	});

	if (summary.total === 0) {
		return null;
	}

	return (
		<div className={cn('flex items-center gap-1 text-muted-foreground text-xs', className)}>
			{isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}

			<span>
				{summary.running > 0 && `${summary.running} activas`}
				{summary.queued > 0 && summary.running === 0 && `${summary.queued} en cola`}
				{summary.total > 0 && summary.running === 0 && summary.queued === 0 && `${summary.completed} completadas`}
			</span>

			{summary.failed > 0 && (
				<Badge className="h-4 px-1 text-xs" variant="destructive">
					{summary.failed}
				</Badge>
			)}
		</div>
	);
}

export default BatchOperationsIndicator;
