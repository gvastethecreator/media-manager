/**
 * @file Progress Panel Component
 * @module components/features/file-browser/progress/progress-panel
 * @description Panel principal para mostrar y gestionar todas las operaciones de progreso.
 */

import {
	AlertCircle,
	BarChart3,
	Bell,
	CheckCircle,
	Clock,
	Eye,
	Pause,
	Play,
	RefreshCw,
	Search,
	SortAsc,
	SortDesc,
	X,
	XCircle,
} from 'lucide-react';
// React and third-party imports
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProgressTracking } from '@/hooks/use-progress-tracking';
import { operationTypeOptions } from '@/lib/operation-type-options';
// Application imports
import { cn } from '@/lib/utils';
import type {
	OperationType,
	ProgressFilter,
	ProgressOperation,
	ProgressSortOptions,
	ProgressStatus,
} from '@/types/file-browser/progress-tracking';
import type { ProgressInfo } from '@/types/progress-tracking/progress-info';
import { mapServiceToUIOperationType } from '@/types/progress-tracking/type-mapping';

// Local imports
import { ProgressOperationCard } from './progress-operation-card';
import type { OperationStatistics } from './types';

// Simular el hook useProgressNotifications
const useProgressNotifications = () => {
	return {
		notifications: [],
		unreadCount: 0,
		markAsRead: (id: string) => {},
		removeNotification: (id: string) => {},
		clearAll: () => {},
	};
};

interface ProgressPanelProps {
	className?: string;
	compact?: boolean;
	showStatistics?: boolean;
	showNotifications?: boolean;
	maxHeight?: string;
}

const statusOptions: { value: ProgressStatus; label: string; icon: React.ComponentType<any> }[] = [
	{ value: 'pending', label: 'Pendiente', icon: Clock },
	{ value: 'running', label: 'En progreso', icon: Play },
	{ value: 'paused', label: 'Pausado', icon: Pause },
	{ value: 'completed', label: 'Completado', icon: CheckCircle },
	{ value: 'failed', label: 'Fallido', icon: XCircle },
	{ value: 'cancelled', label: 'Cancelado', icon: X },
];

const sortOptions: { value: ProgressSortOptions['field']; label: string }[] = [
	{ value: 'createdAt', label: 'Fecha de inicio' },
	{ value: 'name', label: 'Nombre' },
	{ value: 'progress', label: 'Progreso' },
	{ value: 'type', label: 'Tipo' },
];

export function ProgressPanel({
	className,
	compact = false,
	showStatistics = true,
	showNotifications = true,
	maxHeight = '600px',
}: ProgressPanelProps) {
	const {
		operations,
		hasActiveOperations,
		startOperation,
		updateProgress,
		completeOperation,
		failOperation,
		cancelOperation,
		getOperation,
		clearCompleted,
	} = useProgressTracking({
		trackAll: true,
	});

	const { notifications, unreadCount, markAsRead, removeNotification, clearAll } = useProgressNotifications();

	interface Notification {
		id: string;
		title: string;
		message: string;
		read: boolean;
	}

	// Estado local para filtros y ordenamiento
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState<ProgressStatus[]>([]);
	const [typeFilter, setTypeFilter] = useState<OperationType[]>([]);
	const [sortBy, setSortBy] = useState<ProgressSortOptions['field']>('createdAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [showCompleted, setShowCompleted] = useState(true);
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
	const [statistics, setStatistics] = useState<OperationStatistics>({
		totalOperations: 0,
		activeOperations: 0,
		completedOperations: 0,
		failedOperations: 0,
		successRate: 0,
	});

	// Obtener descripción de operación
	const getOperationDescription = (
		type: import('@/types/progress-tracking/progress-info').OperationType,
		totalItems: number
	): string => {
		const itemText = totalItems === 1 ? 'elemento' : 'elementos';
		switch (type) {
			case 'copy':
				return `Copiando ${totalItems} ${itemText}`;
			case 'move':
				return `Moviendo ${totalItems} ${itemText}`;
			case 'delete':
				return `Eliminando ${totalItems} ${itemText}`;
			case 'download':
				return `Descargando ${totalItems} ${itemText}`;
			case 'upload':
				return `Subiendo ${totalItems} ${itemText}`;
			case 'compress':
				return `Comprimiendo ${totalItems} ${itemText}`;
			case 'extract':
				return `Extrayendo ${totalItems} ${itemText}`;
			default:
				return `Procesando ${totalItems} ${itemText}`;
		}
	};

	// Convertir ProgressInfo a ProgressOperation
	const mapProgressInfoToOperation = (info: ProgressInfo): ProgressOperation => ({
		id: info.operationId,
		type: mapServiceToUIOperationType(info.type),
		name: getOperationDescription(info.type, info.totalItems),
		description: info.currentItem || '',
		status: info.status,
		progress: {
			current: info.processedItems,
			total: info.totalItems,
			percentage: info.progress,
			speed: info.throughput || 0,
			eta: info.estimatedTimeRemaining || null,
			startTime: info.startTime,
			endTime: null,
			duration: Date.now() - info.startTime,
		},
		items: {
			processed: info.processedItems,
			total: info.totalItems,
			failed: 0,
			skipped: 0,
			remaining: info.totalItems - info.processedItems,
		},
		size: {
			processed: 0,
			total: 0,
			remaining: 0,
		},
		steps: [],
		currentStep: null,
		priority: 0,
		metadata: {},
		error: info.error || null,
		retryCount: 0,
		createdAt: info.startTime,
		updatedAt: Date.now(),
		startTime: info.startTime,
		callbacks: undefined,
		cancellable: true,
		pausable: true,
		paused: info.status === 'paused',
	});

	// Filtrar y ordenar operaciones
	const filteredOperations = useMemo(() => {
		const filter: ProgressFilter = {
			searchText: searchText || undefined,
			statuses: statusFilter.length > 0 ? statusFilter : undefined,
			operationType: typeFilter.length > 0 ? typeFilter[0] : undefined,
		};

		// Las operaciones ya son de tipo ProgressOperation
		let filtered = [...operations];

		// Aplicar filtros
		if (filter.searchText) {
			const searchLower = filter.searchText.toLowerCase();
			filtered = filtered.filter((op) => {
				const name = op.name.toLowerCase();
				const desc = op.description?.toLowerCase() || '';
				return name.includes(searchLower) || desc.includes(searchLower);
			});
		}

		if (filter.statuses?.length) {
			filtered = filtered.filter((op) => filter.statuses!.includes(op.status));
		}

		if (filter.operationType) {
			filtered = filtered.filter((op) => op.type === filter.operationType);
		}

		// Filtrar completadas si está deshabilitado
		if (!showCompleted) {
			filtered = filtered.filter((op) => op.status !== 'completed');
		}

		// Ordenar
		filtered.sort((a, b) => {
			let aValue: any, bValue: any;

			switch (sortBy) {
				case 'createdAt':
					aValue = a.createdAt;
					bValue = b.createdAt;
					break;
				case 'name':
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case 'progress':
					aValue = a.progress.percentage;
					bValue = b.progress.percentage;
					break;
				case 'type':
					aValue = a.type.toLowerCase();
					bValue = b.type.toLowerCase();
					break;
			}

			if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		// Actualizar estadísticas
		const stats = {
			totalOperations: filtered.length,
			activeOperations: filtered.filter((op) => op.status === 'running').length,
			completedOperations: filtered.filter((op) => op.status === 'completed').length,
			failedOperations: filtered.filter((op) => op.status === 'failed').length,
			successRate: 0,
		};

		if (stats.completedOperations > 0) {
			stats.successRate = (stats.completedOperations / (stats.completedOperations + stats.failedOperations)) * 100;
		}

		setStatistics(stats);

		return filtered;
	}, [operations, searchText, statusFilter, typeFilter, sortBy, sortOrder, showCompleted]);

	// Agrupar operaciones por estado
	const operationsByStatus = useMemo(() => {
		const groups: Record<ProgressStatus, ProgressOperation[]> = {
			pending: [],
			running: [],
			paused: [],
			completed: [],
			failed: [],
			cancelled: [],
		};

		filteredOperations.forEach((op) => {
			groups[op.status].push(op);
		});

		return groups;
	}, [filteredOperations]);

	// Manejar acciones de operaciones
	const handleOperationAction = (action: string, operationId: string) => {
		const operation = getOperation(operationId);
		if (!operation) return;

		switch (action) {
			case 'start':
				startOperation(operation.type, {
					cancellable: true,
					description: `Iniciando operación ${operation.type}`,
				});
				break;
			case 'pause': {
				// Para pausar creamos un ProgressInfo con los datos actuales
				const pauseProgressInfo: import('@/types/file-browser/progress-tracking').ProgressInfo = {
					current: operation.progress.current,
					total: operation.progress.total,
					percentage: operation.progress.percentage,
					speed: operation.progress.speed,
					eta: operation.progress.eta,
					startTime: operation.progress.startTime,
					endTime: operation.progress.endTime,
					duration: operation.progress.duration,
				};
				updateProgress(operationId, pauseProgressInfo);
				break;
			}
			case 'resume': {
				// Para reanudar creamos un ProgressInfo con los datos actuales
				const resumeProgressInfo: import('@/types/file-browser/progress-tracking').ProgressInfo = {
					current: operation.progress.current,
					total: operation.progress.total,
					percentage: operation.progress.percentage,
					speed: operation.progress.speed,
					eta: operation.progress.eta,
					startTime: operation.progress.startTime,
					endTime: operation.progress.endTime,
					duration: operation.progress.duration,
				};
				updateProgress(operationId, resumeProgressInfo);
				break;
			}
			case 'cancel':
				cancelOperation(operationId);
				break;
			case 'remove':
				clearCompleted();
				break;
			case 'details':
				setSelectedOperation(operationId);
				break;
		}
	};

	// Renderizar estadísticas
	const renderStatistics = () => {
		if (!showStatistics) return null;

		return (
			<Card className="mb-4">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						<BarChart3 className="h-4 w-4" />
						Estadísticas
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
						<div className="text-center">
							<p className="font-bold text-2xl text-blue-600">{statistics.totalOperations}</p>
							<p className="text-muted-foreground text-xs">Total</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-orange-600">{statistics.activeOperations}</p>
							<p className="text-muted-foreground text-xs">En progreso</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-green-600">{statistics.completedOperations}</p>
							<p className="text-muted-foreground text-xs">Completadas</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-red-600">{statistics.failedOperations}</p>
							<p className="text-muted-foreground text-xs">Fallidas</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-purple-600">{statistics.successRate.toFixed(1)}%</p>
							<p className="text-muted-foreground text-xs">Éxito</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	// Renderizar notificaciones
	const renderNotifications = () => {
		if (!showNotifications || notifications.length === 0) return null;

		return (
			<Card className="mb-4">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-sm">
							<Bell className="h-4 w-4" />
							Notificaciones
							{unreadCount > 0 && (
								<Badge className="text-xs" variant="destructive">
									{unreadCount}
								</Badge>
							)}
						</CardTitle>
						<Button onClick={clearAll} size="sm" variant="ghost">
							Limpiar todo
						</Button>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<ScrollArea className="h-32">
						<div className="space-y-2">
							{notifications.slice(0, 5).map((notification: Notification) => (
								<div
									className={cn(
										'flex items-start gap-2 rounded-lg border p-2',
										notification.read ? 'bg-gray-50' : 'border-blue-200 bg-blue-50'
									)}
									key={notification.id}
								>
									<div className="min-w-0 flex-1">
										<p className="font-medium text-sm">{notification.title}</p>
										<p className="text-muted-foreground text-xs">{notification.message}</p>
									</div>
									<div className="flex items-center gap-1">
										{!notification.read && (
											<Button onClick={() => markAsRead(notification.id)} size="sm" variant="ghost">
												<Eye className="h-3 w-3" />
											</Button>
										)}
										<Button onClick={() => removeNotification(notification.id)} size="sm" variant="ghost">
											<X className="h-3 w-3" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		);
	};

	// Renderizar controles
	const renderControls = () => {
		return (
			<Card className="mb-4">
				<CardContent className="p-4">
					<div className="space-y-4">
						{/* Búsqueda */}
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								className="pl-10"
								onChange={(e) => setSearchText(e.target.value)}
								placeholder="Buscar operaciones..."
								value={searchText}
							/>
						</div>

						{/* Filtros */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div>
								<Label className="text-xs">Estado</Label>
								<Select
									onValueChange={(value) => setStatusFilter(value ? (value.split(',') as ProgressStatus[]) : [])}
									value={statusFilter.join(',')}
								>
									<SelectTrigger>
										<SelectValue placeholder="Todos los estados" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">Todos los estados</SelectItem>
										{statusOptions.map((option) => {
											const Icon = option.icon;
											return (
												<SelectItem key={option.value} value={option.value}>
													<div className="flex items-center gap-2">
														<Icon className="h-4 w-4" />
														{option.label}
													</div>
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="text-xs">Tipo</Label>
								<Select
									onValueChange={(value) => setTypeFilter(value ? (value.split(',') as OperationType[]) : [])}
									value={typeFilter.join(',')}
								>
									<SelectTrigger>
										<SelectValue placeholder="Todos los tipos" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">Todos los tipos</SelectItem>
										{operationTypeOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="text-xs">Ordenar por</Label>
								<div className="flex gap-2">
									<Select
										onValueChange={(value) => setSortBy(value as 'createdAt' | 'name' | 'progress' | 'type')}
										value={sortBy}
									>
										<SelectTrigger className="flex-1">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{sortOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
										size="sm"
										variant="outline"
									>
										{sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
									</Button>
								</div>
							</div>
						</div>

						{/* Opciones */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="flex items-center space-x-2">
									<Switch checked={showCompleted} id="show-completed" onCheckedChange={setShowCompleted} />
									<Label className="text-sm" htmlFor="show-completed">
										Mostrar completadas
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Switch checked={autoRefresh} id="auto-refresh" onCheckedChange={setAutoRefresh} />
									<Label className="text-sm" htmlFor="auto-refresh">
										Auto-actualizar
									</Label>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button
									onClick={() => {
										setSearchText('');
										setStatusFilter([]);
										setTypeFilter([]);
										setSortBy('createdAt');
										setSortOrder('desc');
									}}
									size="sm"
									variant="outline"
								>
									<RefreshCw className="h-4 w-4" />
									Limpiar filtros
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className={cn('space-y-4', className)} style={{ maxHeight }}>
			{renderStatistics()}
			{renderNotifications()}
			{renderControls()}

			{/* Lista de operaciones */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Operaciones ({filteredOperations.length})</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					{filteredOperations.length === 0 ? (
						<div className="py-8 text-center">
							<AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<p className="text-muted-foreground">No hay operaciones que coincidan con los filtros</p>
						</div>
					) : (
						<Tabs className="w-full" defaultValue="all">
							<TabsList className="grid w-full grid-cols-6">
								<TabsTrigger value="all">Todas ({filteredOperations.length})</TabsTrigger>
								<TabsTrigger value="running">En progreso ({operationsByStatus.running.length})</TabsTrigger>
								<TabsTrigger value="pending">Pendientes ({operationsByStatus.pending.length})</TabsTrigger>
								<TabsTrigger value="completed">Completadas ({operationsByStatus.completed.length})</TabsTrigger>
								<TabsTrigger value="failed">Fallidas ({operationsByStatus.failed.length})</TabsTrigger>
								<TabsTrigger value="cancelled">Canceladas ({operationsByStatus.cancelled.length})</TabsTrigger>
							</TabsList>

							<TabsContent className="mt-4" value="all">
								<ScrollArea className="h-96">
									<div className="space-y-3">
										{filteredOperations.map((operation) => (
											<ProgressOperationCard
												compact={compact}
												key={operation.id}
												onCancel={(id) => handleOperationAction('cancel', id)}
												onPause={(id) => handleOperationAction('pause', id)}
												onRemove={(id) => handleOperationAction('remove', id)}
												onResume={(id) => handleOperationAction('resume', id)}
												onStart={(id) => handleOperationAction('start', id)}
												onViewDetails={(id) => handleOperationAction('details', id)}
												operation={operation}
											/>
										))}
									</div>
								</ScrollArea>
							</TabsContent>

							{statusOptions.map((status) => (
								<TabsContent className="mt-4" key={status.value} value={status.value}>
									<ScrollArea className="h-96">
										<div className="space-y-3">
											{operationsByStatus[status.value].map((operation) => (
												<ProgressOperationCard
													compact={compact}
													key={operation.id}
													onCancel={(id) => handleOperationAction('cancel', id)}
													onPause={(id) => handleOperationAction('pause', id)}
													onRemove={(id) => handleOperationAction('remove', id)}
													onResume={(id) => handleOperationAction('resume', id)}
													onStart={(id) => handleOperationAction('start', id)}
													onViewDetails={(id) => handleOperationAction('details', id)}
													operation={operation}
												/>
											))}
										</div>
									</ScrollArea>
								</TabsContent>
							))}
						</Tabs>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default ProgressPanel;
