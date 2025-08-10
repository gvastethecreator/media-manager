/**
 * @file Progress Operation Card Component
 * @module components/features/file-browser/progress/progress-operation-card
 * @description Componente para mostrar una tarjeta de operación de progreso individual.
 */

import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
	AlertCircle,
	Archive,
	CheckCircle,
	Clock,
	Copy,
	Download,
	FileText,
	Folder,
	Image,
	MoreHorizontal,
	Pause,
	Play,
	RefreshCw,
	Square,
	Trash2,
	Upload,
	X,
	XCircle,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { OperationType, ProgressOperation, ProgressStatus } from '@/types/file-browser/progress-tracking';

interface ProgressOperationCardProps {
	operation: ProgressOperation;
	onStart?: (id: string) => void;
	onPause?: (id: string) => void;
	onResume?: (id: string) => void;
	onCancel?: (id: string) => void;
	onRemove?: (id: string) => void;
	onViewDetails?: (id: string) => void;
	compact?: boolean;
	showActions?: boolean;
	className?: string;
}

// Mapeo de tipos de operación a iconos
const operationTypeIcons: Record<OperationType, React.ComponentType<any>> = {
	file_copy: Copy,
	file_move: Folder,
	file_delete: Trash2,
	file_upload: Upload,
	file_download: Download,
	file_compress: Archive,
	file_extract: Archive,
	image_resize: Image,
	image_convert: RefreshCw,
	video_convert: RefreshCw,
	audio_convert: RefreshCw,
	thumbnail_generate: Image,
	metadata_extract: FileText,
	search_index: RefreshCw,
	backup_create: Archive,
	backup_restore: RefreshCw,
	sync_files: RefreshCw,
	batch_operation: Folder,
	custom: MoreHorizontal,
};

// Mapeo de estados a colores y iconos
const statusConfig: Record<
	ProgressStatus,
	{
		color: string;
		bgColor: string;
		icon: React.ComponentType<any>;
		label: string;
	}
> = {
	pending: {
		color: 'text-yellow-600',
		bgColor: 'bg-yellow-100',
		icon: Clock,
		label: 'Pendiente',
	},
	running: {
		color: 'text-blue-600',
		bgColor: 'bg-blue-100',
		icon: Play,
		label: 'En progreso',
	},
	completed: {
		color: 'text-green-600',
		bgColor: 'bg-green-100',
		icon: CheckCircle,
		label: 'Completado',
	},
	failed: {
		color: 'text-red-600',
		bgColor: 'bg-red-100',
		icon: XCircle,
		label: 'Fallido',
	},
	cancelled: {
		color: 'text-gray-600',
		bgColor: 'bg-gray-100',
		icon: X,
		label: 'Cancelado',
	},
	paused: {
		color: 'text-yellow-600',
		bgColor: 'bg-yellow-100',
		icon: Pause,
		label: 'Pausado',
	},
};

// Mapeo de prioridades a colores
const priorityColors: Record<string, string> = {
	low: 'bg-gray-500',
	normal: 'bg-blue-500',
	high: 'bg-orange-500',
	urgent: 'bg-red-500',
};

function getStepStatusColor(status: string) {
	if (status === 'completed') {
		return 'bg-green-500';
	}
	if (status === 'running') {
		return 'bg-blue-500';
	}
	if (status === 'failed') {
		return 'bg-red-500';
	}
	return 'bg-gray-300';
}

function formatDuration(ms: number) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}
	return `${seconds}s`;
}

function calculateETA(operation: ProgressOperation) {
	if (operation.status !== 'running' || operation.progress.percentage === 0) {
		return null as Date | null;
	}
	if (operation.progress.eta) {
		return new Date(operation.progress.eta);
	}
	const elapsed = Date.now() - (operation.progress.startTime || operation.createdAt);
	const rate = operation.progress.percentage / elapsed;
	const remaining = (100 - operation.progress.percentage) / (rate || 1);
	return new Date(Date.now() + remaining);
}

function buildActions(
	operation: ProgressOperation,
	callbacks: {
		onStart?: (id: string) => void;
		onPause?: (id: string) => void;
		onResume?: (id: string) => void;
		onCancel?: (id: string) => void;
		onRemove?: (id: string) => void;
		onViewDetails?: (id: string) => void;
	},
	showActions: boolean
) {
	if (!showActions) {
		return null as React.ReactNode;
	}

	const pushAction = (key: string, onClick: () => void, icon: React.ReactNode, title: string) => (
		<TooltipProvider key={key}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button onClick={onClick} size="sm" variant="outline">
						{icon}
					</Button>
				</TooltipTrigger>
				<TooltipContent>{title}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);

	const isPending = operation.status === 'pending';
	const isRunning = operation.status === 'running';
	const isPaused = operation.status === 'paused';
	const canCancel = (isPending || isRunning) && Boolean(callbacks.onCancel);
	const canRemove =
		(operation.status === 'completed' || operation.status === 'failed' || operation.status === 'cancelled') &&
		Boolean(callbacks.onRemove);

	const candidates = [
		{
			show: isPending && Boolean(callbacks.onStart),
			key: 'start',
			onClick: () => callbacks.onStart?.(operation.id),
			icon: <Play className="h-4 w-4" />,
			title: 'Iniciar operación',
		},
		{
			show: isRunning && Boolean(callbacks.onPause),
			key: 'pause',
			onClick: () => callbacks.onPause?.(operation.id),
			icon: <Pause className="h-4 w-4" />,
			title: 'Pausar operación',
		},
		{
			show: isPaused && Boolean(callbacks.onResume),
			key: 'resume',
			onClick: () => callbacks.onResume?.(operation.id),
			icon: <Play className="h-4 w-4" />,
			title: 'Reanudar operación',
		},
		{
			show: canCancel,
			key: 'cancel',
			onClick: () => callbacks.onCancel?.(operation.id),
			icon: <Square className="h-4 w-4" />,
			title: 'Cancelar operación',
		},
		{
			show: canRemove,
			key: 'remove',
			onClick: () => callbacks.onRemove?.(operation.id),
			icon: <X className="h-4 w-4" />,
			title: 'Remover de la lista',
		},
		{
			show: Boolean(callbacks.onViewDetails),
			key: 'details',
			onClick: () => callbacks.onViewDetails?.(operation.id),
			icon: <MoreHorizontal className="h-4 w-4" />,
			title: 'Ver detalles',
		},
	].filter((c) => c.show);

	if (candidates.length === 0) {
		return null as React.ReactNode;
	}
	return (
		<div className="flex items-center gap-1">
			{candidates.map((c) => pushAction(c.key, c.onClick, c.icon, c.title))}
		</div>
	);
}

type OperationIconType = React.ComponentType<any>;

function ProgressOperationCardCompact({
	operation,
	OperationIcon,
	StatusIcon,
	actionsNode,
	className,
	etaTime,
}: {
	operation: ProgressOperation;
	OperationIcon: OperationIconType;
	StatusIcon: OperationIconType;
	actionsNode: React.ReactNode;
	className?: string;
	etaTime: Date | null;
}) {
	const statusInfo = statusConfig[operation.status];
	return (
		<div className={cn('flex items-center gap-3 rounded-lg border bg-white p-3', className)}>
			<div className="flex items-center gap-2">
				<div className={cn('rounded-full p-1.5', statusInfo.bgColor)}>
					<OperationIcon className={cn('h-4 w-4', statusInfo.color)} />
				</div>
				<StatusIcon className={cn('h-4 w-4', statusInfo.color)} />
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<p className="truncate font-medium text-sm">{operation.name}</p>
					<Badge className={cn('px-1.5 py-0.5 text-xs', statusInfo.color)} variant="secondary">
						{statusInfo.label}
					</Badge>
				</div>

				{operation.status === 'running' && (
					<div className="mt-1">
						<Progress className="h-1.5" value={operation.progress.percentage} />
						<p className="mt-0.5 text-muted-foreground text-xs">
							{operation.progress.percentage.toFixed(1)}%
							{etaTime && ` • ETA: ${format(etaTime, 'HH:mm', { locale: es })}`}
						</p>
					</div>
				)}
			</div>

			{actionsNode}
		</div>
	);
}

function ProgressOperationCardFull({
	operation,
	OperationIcon,
	StatusIcon,
	actionsNode,
	className,
	etaTime,
	duration,
}: {
	operation: ProgressOperation;
	OperationIcon: OperationIconType;
	StatusIcon: OperationIconType;
	actionsNode: React.ReactNode;
	className?: string;
	etaTime: Date | null;
	duration: number;
}) {
	const statusInfo = statusConfig[operation.status];
	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className={cn('rounded-lg p-2', statusInfo.bgColor)}>
							<OperationIcon className={cn('h-5 w-5', statusInfo.color)} />
						</div>

						<div className="flex-1">
							<div className="flex items-center gap-2">
								<CardTitle className="text-base">{operation.name}</CardTitle>
								<Badge className={cn('text-xs', statusInfo.color)} variant="secondary">
									{statusInfo.label}
								</Badge>

								<div
									className={cn('h-2 w-2 rounded-full', priorityColors[operation.priority])}
									title={`Prioridad: ${operation.priority}`}
								/>
							</div>

							{operation.description && <p className="mt-1 text-muted-foreground text-sm">{operation.description}</p>}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<StatusIcon className={cn('h-5 w-5', statusInfo.color)} />
						{actionsNode}
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-0">
				{['running', 'completed'].includes(operation.status) && (
					<div className="mb-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="font-medium text-sm">Progreso: {operation.progress.percentage.toFixed(1)}%</span>
							{etaTime && (
								<span className="text-muted-foreground text-sm">ETA: {format(etaTime, 'HH:mm', { locale: es })}</span>
							)}
						</div>
						<Progress className="h-2" value={operation.progress.percentage} />
					</div>
				)}

				{operation.steps.length > 0 && (
					<div className="mb-4">
						<h4 className="mb-2 font-medium text-sm">Pasos:</h4>
						<div className="space-y-2">
							{operation.steps.slice(-3).map((step) => (
								<div className="flex items-center gap-2 text-sm" key={step.id}>
									<div className={cn('h-2 w-2 rounded-full', getStepStatusColor(step.status))} />
									<span className="flex-1 truncate">{step.name}</span>
									{step.status === 'running' && (
										<span className="text-muted-foreground text-xs">{step.progress.toFixed(0)}%</span>
									)}
								</div>
							))}
							{operation.steps.length > 3 && (
								<p className="text-muted-foreground text-xs">... y {operation.steps.length - 3} pasos más</p>
							)}
						</div>
					</div>
				)}

				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Iniciado:</span>
						<p className="font-medium">
							{formatDistanceToNow(operation.progress.startTime || operation.createdAt, {
								addSuffix: true,
								locale: es,
							})}
						</p>
					</div>

					<div>
						<span className="text-muted-foreground">Duración:</span>
						<p className="font-medium">{formatDuration(duration)}</p>
					</div>

					{operation.metadata.totalItems && (
						<div>
							<span className="text-muted-foreground">Elementos:</span>
							<p className="font-medium">
								{operation.metadata.processedItems || 0} / {operation.metadata.totalItems}
							</p>
						</div>
					)}

					{operation.metadata.fileSize && (
						<div>
							<span className="text-muted-foreground">Tamaño:</span>
							<p className="font-medium">{(operation.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</p>
						</div>
					)}
				</div>

				{operation.error && (
					<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
						<div className="flex items-center gap-2 text-red-800">
							<AlertCircle className="h-4 w-4" />
							<span className="font-medium">Error:</span>
						</div>
						<p className="mt-1 text-red-700 text-sm">{operation.error}</p>
					</div>
				)}

				{operation.paused && (
					<div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
						<div className="flex items-center gap-2 text-yellow-800">
							<Pause className="h-4 w-4" />
							<span className="font-medium">Operación pausada</span>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function ProgressOperationCard({
	operation,
	onStart,
	onPause,
	onResume,
	onCancel,
	onRemove,
	onViewDetails,
	compact = false,
	showActions = true,
	className,
}: ProgressOperationCardProps) {
	const OperationIcon = operationTypeIcons[operation.type];
	const statusInfo = statusConfig[operation.status];
	const StatusIcon = statusInfo.icon;

	// Calcular duración
	const duration = operation.progress.endTime
		? operation.progress.endTime - (operation.progress.startTime || operation.createdAt)
		: Date.now() - (operation.progress.startTime || operation.createdAt);

	// Usar helpers de nivel superior

	const etaTime = calculateETA(operation);
	const actionsNode = buildActions(
		operation,
		{ onStart, onPause, onResume, onCancel, onRemove, onViewDetails },
		showActions
	);

	if (compact) {
		return (
			<ProgressOperationCardCompact
				actionsNode={actionsNode}
				className={className}
				etaTime={etaTime}
				OperationIcon={OperationIcon}
				operation={operation}
				StatusIcon={StatusIcon}
			/>
		);
	}

	return (
		<ProgressOperationCardFull
			actionsNode={actionsNode}
			className={className}
			duration={duration}
			etaTime={etaTime}
			OperationIcon={OperationIcon}
			operation={operation}
			StatusIcon={StatusIcon}
		/>
	);
}

export default ProgressOperationCard;
