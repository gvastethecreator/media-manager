/**
 * Batch Operations Panel Component
 *
 * Displays active and completed batch operations with progress indicators,
 * controls for managing operations, and detailed status information.
 */

import {
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Copy,
	Loader2,
	MoreHorizontal,
	Move,
	Pause,
	Play,
	Trash2,
	X,
	XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils/format';
import {
	type BatchOperation,
	type BatchOperationStatus,
	type BatchOperationType,
	batchFileOperationsService,
} from '@/services/file/batch-operations.service';

interface BatchOperationsPanelProps {
	className?: string;
	maxHeight?: string;
}

export function BatchOperationsPanel({ className, maxHeight = '400px' }: BatchOperationsPanelProps) {
	const [operations, setOperations] = useState<BatchOperation[]>([]);
	const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());

	useEffect(() => {
		// Load initial operations
		setOperations(batchFileOperationsService.getAllOperations());

		// Listen for operation updates
		const handleOperationUpdate = () => {
			setOperations(batchFileOperationsService.getAllOperations());
		};

		batchFileOperationsService.on('operationStarted', handleOperationUpdate);
		batchFileOperationsService.on('operationProgress', handleOperationUpdate);
		batchFileOperationsService.on('operationCompleted', handleOperationUpdate);
		batchFileOperationsService.on('operationFailed', handleOperationUpdate);
		batchFileOperationsService.on('operationCancelled', handleOperationUpdate);
		batchFileOperationsService.on('operationPaused', handleOperationUpdate);
		batchFileOperationsService.on('operationResumed', handleOperationUpdate);

		return () => {
			batchFileOperationsService.removeAllListeners();
		};
	}, []);

	const handlePauseResume = (operation: BatchOperation) => {
		if (operation.status === 'running') {
			batchFileOperationsService.pauseOperation(operation.id);
		} else if (operation.status === 'paused') {
			batchFileOperationsService.resumeOperation(operation.id);
		}
	};

	const handleCancel = (operation: BatchOperation) => {
		batchFileOperationsService.cancelOperation(operation.id);
	};

	const handleClearCompleted = () => {
		batchFileOperationsService.clearCompletedOperations();
	};

	const toggleExpanded = (operationId: string) => {
		const newExpanded = new Set(expandedOperations);
		if (newExpanded.has(operationId)) {
			newExpanded.delete(operationId);
		} else {
			newExpanded.add(operationId);
		}
		setExpandedOperations(newExpanded);
	};

	const getOperationIcon = (type: BatchOperationType) => {
		switch (type) {
			case 'copy':
				return <Copy className="h-4 w-4" />;
			case 'move':
				return <Move className="h-4 w-4" />;
			case 'delete':
				return <Trash2 className="h-4 w-4" />;
			default:
				return <MoreHorizontal className="h-4 w-4" />;
		}
	};

	const getStatusIcon = (status: BatchOperationStatus) => {
		switch (status) {
			case 'running':
				return <Loader2 className="h-4 w-4 animate-spin" />;
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'failed':
				return <XCircle className="h-4 w-4 text-red-500" />;
			case 'cancelled':
				return <XCircle className="h-4 w-4 text-gray-500" />;
			case 'paused':
				return <Pause className="h-4 w-4 text-yellow-500" />;
			case 'queued':
				return <Clock className="h-4 w-4 text-blue-500" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
	};

	const getStatusBadgeVariant = (status: BatchOperationStatus) => {
		switch (status) {
			case 'running':
				return 'primary';
			case 'completed':
				return 'secondary'; // Changed from 'success'
			case 'failed':
				return 'destructive';
			case 'cancelled':
				return 'secondary';
			case 'paused':
				return 'outline'; // Changed from 'warning'
			case 'queued':
				return 'outline';
			default:
				return 'outline';
		}
	};

	const formatOperationTitle = (operation: BatchOperation) => {
		const itemCount = operation.items.length;
		const itemText = itemCount === 1 ? 'elemento' : 'elementos';

		switch (operation.type) {
			case 'copy':
				return `Copiando ${itemCount} ${itemText}`;
			case 'move':
				return `Moviendo ${itemCount} ${itemText}`;
			case 'delete':
				return `Eliminando ${itemCount} ${itemText}`;
			default:
				return `Procesando ${itemCount} ${itemText}`;
		}
	};

	const getElapsedTime = (operation: BatchOperation) => {
		if (!operation.startedAt) {
			return null;
		}

		const endTime = operation.completedAt || Date.now();
		const elapsed = endTime - operation.startedAt;
		return formatDuration(elapsed);
	};

	const activeOperations = operations.filter(
		(op) => op.status === 'running' || op.status === 'queued' || op.status === 'paused'
	);

	const completedOperations = operations.filter(
		(op) => op.status === 'completed' || op.status === 'failed' || op.status === 'cancelled'
	);

	if (operations.length === 0) {
		return (
			<div className={cn('flex items-center justify-center p-8 text-muted-foreground', className)}>
				<div className="text-center">
					<MoreHorizontal className="mx-auto mb-2 h-8 w-8 opacity-50" />
					<p>No hay operaciones por lotes activas</p>
				</div>
			</div>
		);
	}

	return (
		<div className={cn('space-y-4', className)} style={{ maxHeight }}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-lg">Operaciones por Lotes</h3>
				{completedOperations.length > 0 && (
					<Button className="text-xs" onClick={handleClearCompleted} size="sm" variant="outline">
						<Trash2 className="mr-1 h-3 w-3" />
						Limpiar Completadas
					</Button>
				)}
			</div>

			<ScrollArea className="h-full">
				<div className="space-y-3">
					{/* Active Operations */}
					{activeOperations.map((operation) => (
						<div className="rounded-lg border bg-card p-4" key={operation.id}>
							<div className="mb-3 flex items-center justify-between">
								<div className="flex items-center space-x-3">
									{getOperationIcon(operation.type)}
									<div>
										<h4 className="font-medium text-sm">{formatOperationTitle(operation)}</h4>
										{operation.targetPath && (
											<p className="max-w-[200px] truncate text-muted-foreground text-xs">→ {operation.targetPath}</p>
										)}
									</div>
								</div>

								<div className="flex items-center space-x-2">
									<Badge variant={getStatusBadgeVariant(operation.status)}>
										{getStatusIcon(operation.status)}
										<span className="ml-1 capitalize">{operation.status}</span>
									</Badge>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button size="sm" variant="ghost">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{(operation.status === 'running' || operation.status === 'paused') && (
												<DropdownMenuItem onClick={() => handlePauseResume(operation)}>
													{operation.status === 'running' ? (
														<>
															<Pause className="mr-2 h-4 w-4" />
															Pausar
														</>
													) : (
														<>
															<Play className="mr-2 h-4 w-4" />
															Reanudar
														</>
													)}
												</DropdownMenuItem>
											)}
											<DropdownMenuItem className="text-red-600" onClick={() => handleCancel(operation)}>
												<X className="mr-2 h-4 w-4" />
												Cancelar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="space-y-2">
								<Progress className="h-2" value={operation.progress.percentage} />
								<div className="flex justify-between text-muted-foreground text-xs">
									<span>
										{operation.progress.processed + operation.progress.failed} / {operation.progress.total}
									</span>
									<span>{operation.progress.percentage}%</span>
								</div>
							</div>

							{/* Current Item */}
							{operation.progress.currentItem && operation.status === 'running' && (
								<div className="mt-2 truncate text-muted-foreground text-xs">
									Procesando: {operation.progress.currentItem}
								</div>
							)}

							{/* Timing Info */}
							{operation.startedAt && (
								<div className="mt-2 text-muted-foreground text-xs">
									Tiempo transcurrido: {getElapsedTime(operation)}
								</div>
							)}
						</div>
					))}

					{/* Completed Operations */}
					{completedOperations.map((operation) => (
						<Collapsible key={operation.id}>
							<div className="rounded-lg border bg-card">
								<CollapsibleTrigger
									className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
									onClick={() => toggleExpanded(operation.id)}
								>
									<div className="flex items-center space-x-3">
										{expandedOperations.has(operation.id) ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
										{getOperationIcon(operation.type)}
										<div className="text-left">
											<h4 className="font-medium text-sm">{formatOperationTitle(operation)}</h4>
											{operation.targetPath && (
												<p className="max-w-[200px] truncate text-muted-foreground text-xs">→ {operation.targetPath}</p>
											)}
										</div>
									</div>

									<div className="flex items-center space-x-2">
										<Badge variant={getStatusBadgeVariant(operation.status)}>
											{getStatusIcon(operation.status)}
											<span className="ml-1 capitalize">{operation.status}</span>
										</Badge>
									</div>
								</CollapsibleTrigger>

								<CollapsibleContent>
									<div className="border-t bg-muted/20 px-4 pb-4">
										<div className="mt-3 grid grid-cols-2 gap-4 text-xs">
											<div>
												<span className="font-medium">Procesados:</span>
												<span className="ml-1 text-green-600">{operation.progress.processed}</span>
											</div>
											<div>
												<span className="font-medium">Fallidos:</span>
												<span className="ml-1 text-red-600">{operation.progress.failed}</span>
											</div>
											<div>
												<span className="font-medium">Total:</span>
												<span className="ml-1">{operation.progress.total}</span>
											</div>
											<div>
												<span className="font-medium">Duración:</span>
												<span className="ml-1">{getElapsedTime(operation)}</span>
											</div>
										</div>

										{/* Error Summary */}
										{operation.errors.length > 0 && (
											<div className="mt-3">
												<h5 className="mb-2 font-medium text-red-600 text-xs">Errores ({operation.errors.length}):</h5>
												<div className="max-h-20 space-y-1 overflow-y-auto">
													{operation.errors.slice(0, 3).map((error) => {
														const stableKey = error.item?.id
															? `err-${error.item.id}`
															: `err-${error.item?.name ?? 'unknown'}-${error.message}`;
														return (
															<div className="text-muted-foreground text-xs" key={stableKey}>
																<span className="font-medium">{error.item.name}:</span>
																<span className="ml-1">{error.message}</span>
															</div>
														);
													})}
													{operation.errors.length > 3 && (
														<div className="text-muted-foreground text-xs">
															... y {operation.errors.length - 3} errores más
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}

export default BatchOperationsPanel;
