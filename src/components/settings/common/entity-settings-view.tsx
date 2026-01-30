/**
 * @file Entity Settings View - Componente base reutilizable para configuración de entidades
 * @module components/settings/common/entity-settings-view
 * @description Componente genérico que unifica la lógica común de todas las vistas de settings
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Grid3X3, List, Loader2, Plus, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS GENERICOS
// ============================================================================

export interface EntityWithStats {
	id: string;
	name: string;
	isFavorite?: boolean;
	stats?: {
		imageCount?: number;
		videoCount?: number;
		totalAssociations?: number;
		[count: string]: number | undefined;
	};
}

export interface ListFilters {
	search?: string;
	limit?: number;
	[offset: string]: unknown;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface StatConfig<T> {
	key: string;
	label: string;
	icon: React.ReactNode;
	color: string;
	getValue: (items: T[]) => number | string;
	getSubtitle?: (items: T[]) => string;
}

export interface FilterConfig {
	categories?: {
		id: string;
		label: string;
		color?: string;
	}[];
	enableFavorites?: boolean;
	enableSearch?: boolean;
}

export interface CardActions {
	onEdit: () => void;
	onDelete: () => void;
}

export interface FormProps<T> {
	entity?: T | null;
	isEditing: boolean;
	onSuccess: (entity: T) => void;
	onCancel: () => void;
}

export interface EntitySettingsViewProps<T extends EntityWithStats> {
	// Configuración de identidad
	entityType: string;
	entityLabel: string;
	entityLabelPlural: string;
	icon: React.ElementType;
	color: string;

	// Hooks de API
	useListQuery: (filters: ListFilters) => UseQueryResult<PaginatedResponse<T>, Error>;
	useDeleteMutation: () => UseMutationResult<void, Error, string>;

	// Configuración
	filterConfig?: FilterConfig;
	statsConfig: StatConfig<T>[];

	// Render personalizado
	renderCard: (entity: T, actions: CardActions, isGrid: boolean) => React.ReactNode;
	renderForm: (props: FormProps<T>) => React.ReactNode;

	// Opciones adicionales
	className?: string;
	gridCols?: {
		sm?: number;
		md?: number;
		lg?: number;
	};
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EntitySettingsView<T extends EntityWithStats>({
	entityType,
	entityLabel,
	entityLabelPlural,
	icon: Icon,
	color,
	useListQuery,
	useDeleteMutation,
	filterConfig = { enableSearch: true, enableFavorites: false },
	statsConfig,
	renderCard,
	renderForm,
	className,
	gridCols = { sm: 1, md: 2, lg: 3 },
}: EntitySettingsViewProps<T>) {
	// -------------------------------------------------------------------------
	// ESTADO LOCAL
	// -------------------------------------------------------------------------
	const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// -------------------------------------------------------------------------
	// HOOKS DE DATOS
	// -------------------------------------------------------------------------
	const {
		data: response,
		isLoading,
		error,
	} = useListQuery({
		search: searchQuery,
		limit: 1000,
	});
	const deleteMutation = useDeleteMutation();

	const entities = response?.data || [];

	// -------------------------------------------------------------------------
	// MEMOIZED VALUES
	// -------------------------------------------------------------------------
	const stats = useMemo(() => {
		return statsConfig.map((config) => ({
			...config,
			value: config.getValue(entities),
			subtitle: config.getSubtitle?.(entities) || '',
		}));
	}, [entities, statsConfig]);

	const filteredEntities = useMemo(() => {
		return entities.filter((entity) => {
			let matches = true;

			// Filtrar por búsqueda
			if (filterConfig.enableSearch && searchQuery.trim() !== '') {
				const normalizedQuery = searchQuery.toLowerCase();
				matches = matches && entity.name.toLowerCase().includes(normalizedQuery);
			}

			// Filtrar por favoritos
			if (filterConfig.enableFavorites && onlyFavorites) {
				matches = matches && !!entity.isFavorite;
			}

			return matches;
		});
	}, [entities, searchQuery, onlyFavorites, filterConfig]);

	// -------------------------------------------------------------------------
	// HANDLERS
	// -------------------------------------------------------------------------
	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await deleteMutation.mutateAsync(id);
				setSelectedEntity(null);
				setIsEditing(false);
				toastService.success(`${entityLabel} eliminado correctamente`);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error(`Error al eliminar ${entityLabel.toLowerCase()}`, {
					description: errorMessage,
				});
			}
		},
		[deleteMutation, entityLabel]
	);

	const handleEdit = useCallback((entity: T) => {
		setSelectedEntity(entity);
		setIsEditing(true);
		setShowForm(true);
	}, []);

	const handleCreate = useCallback(() => {
		setSelectedEntity(null);
		setIsEditing(false);
		setShowForm(true);
	}, []);

	const handleSuccess = useCallback(
		(entity: T) => {
			setShowForm(false);
			setSelectedEntity(null);
			setIsEditing(false);
			toastService.success(
				isEditing ? `${entityLabel} actualizado correctamente` : `${entityLabel} creado correctamente`
			);
		},
		[isEditing, entityLabel]
	);

	const handleCancel = useCallback(() => {
		setShowForm(false);
		setSelectedEntity(null);
		setIsEditing(false);
	}, []);

	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategories([]);
		setOnlyFavorites(false);
	}, []);

	// -------------------------------------------------------------------------
	// RENDER HELPERS
	// -------------------------------------------------------------------------
	const renderActions = (entity: T): CardActions => ({
		onEdit: () => handleEdit(entity),
		onDelete: () => handleDelete(entity.id),
	});

	// -------------------------------------------------------------------------
	// RENDER STATES
	// -------------------------------------------------------------------------
	if (isLoading) {
		return (
			<Card className="rounded-xl border-none bg-muted/30 shadow-sm">
				<CardContent className="p-8">
					<div className="flex items-center justify-center gap-3">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Cargando {entityLabelPlural.toLowerCase()}...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<EmptyState
				description={error.message || `No se pudieron cargar los ${entityLabelPlural.toLowerCase()}`}
				icon={Icon}
				title="Error al cargar"
			/>
		);
	}

	// -------------------------------------------------------------------------
	// RENDER PRINCIPAL
	// -------------------------------------------------------------------------
	return (
		<div className={cn('space-y-6', className)}>
			{/* Header */}
			<div>
				<h2 className="font-semibold text-2xl text-foreground">{entityLabelPlural}</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Gestiona tus {entityLabelPlural.toLowerCase()} y configura sus opciones
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Card className="border-l-4" key={stat.key} style={{ borderLeftColor: stat.color }}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-muted-foreground text-sm">{stat.label}</p>
									<p className="font-bold text-2xl">{stat.value}</p>
									{stat.subtitle && <p className="text-muted-foreground text-sm">{stat.subtitle}</p>}
								</div>
								<div
									className="flex h-10 w-10 items-center justify-center rounded-lg"
									style={{ backgroundColor: `${stat.color}20` }}
								>
									<div style={{ color: stat.color }}>{stat.icon}</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Toolbar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					{filterConfig.enableSearch && (
						<div className="relative">
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								className="w-[280px] pl-9"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={`Buscar ${entityLabelPlural.toLowerCase()}...`}
								value={searchQuery}
							/>
						</div>
					)}

					{filterConfig.enableFavorites && (
						<Button
							onClick={() => setOnlyFavorites(!onlyFavorites)}
							size="sm"
							variant={onlyFavorites ? 'secondary' : 'outline'}
						>
							⭐ Favoritos
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* View Mode Toggle */}
					<div className="flex items-center rounded-lg border p-0.5">
						<Button
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('grid')}
							size="sm"
							variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('list')}
							size="sm"
							variant={viewMode === 'list' ? 'secondary' : 'ghost'}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>

					<Button className="gap-2" onClick={handleCreate}>
						<Plus className="h-4 w-4" />
						Crear {entityLabel}
					</Button>
				</div>
			</div>

			{/* Content */}
			{filteredEntities.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<Icon className="h-6 w-6 text-muted-foreground" />
					</div>
					<h3 className="font-medium text-lg">No hay {entityLabelPlural.toLowerCase()}</h3>
					<p className="mt-1 max-w-sm text-muted-foreground text-sm">
						{searchQuery || onlyFavorites
							? 'No se encontraron resultados con los filtros aplicados'
							: `Comienza creando tu primer ${entityLabel.toLowerCase()}`}
					</p>
					<div className="mt-4">
						{searchQuery || onlyFavorites ? (
							<Button onClick={clearFilters} variant="outline">
								Limpiar filtros
							</Button>
						) : (
							<Button onClick={handleCreate}>Crear {entityLabel}</Button>
						)}
					</div>
				</div>
			) : (
				<ScrollArea className="h-[calc(100vh-400px)]">
					<div
						className={cn(
							'gap-4',
							viewMode === 'grid'
								? `grid grid-cols-1 sm:grid-cols-${gridCols.sm || 1} md:grid-cols-${gridCols.md || 2} lg:grid-cols-${gridCols.lg || 3}`
								: 'flex flex-col'
						)}
					>
						{filteredEntities.map((entity) => (
							<div key={entity.id}>{renderCard(entity, renderActions(entity), viewMode === 'grid')}</div>
						))}
					</div>
				</ScrollArea>
			)}

			{/* Form Dialog */}
			{showForm &&
				renderForm({
					entity: selectedEntity,
					isEditing,
					onSuccess: handleSuccess,
					onCancel: handleCancel,
				})}
		</div>
	);
}

export default EntitySettingsView;
