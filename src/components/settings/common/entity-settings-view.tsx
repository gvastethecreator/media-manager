/**
 * @file Entity Settings View - Componente base reutilizable para configuración de entidades
 * @module components/settings/common/entity-settings-view
 * @description Componente genérico que unifica la lógica común de todas las vistas de settings
 */

import { useGSAP } from '@gsap/react';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import gsap from 'gsap';
import type { LucideIcon } from 'lucide-react';
import { Grid3X3, List, Loader2, Plus, Search } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
	isFavorite?: boolean;
	name: string;
	stats?: {
		imageCount?: number;
		videoCount?: number;
		totalAssociations?: number;
		[count: string]: number | undefined;
	};
}

export interface ListFilters {
	limit?: number;
	search?: string;
	[offset: string]: unknown;
}

export interface PaginatedResponse<T> {
	data: T[];
	page: number;
	pageSize: number;
	total: number;
}

export interface StatConfig<T> {
	color: string;
	getSubtitle?: (items: T[]) => string;
	getValue: (items: T[]) => number | string;
	icon: React.ReactNode;
	key: string;
	label: string;
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
	onDelete: () => void;
	onEdit: () => void;
}

export interface FormProps<T> {
	entity?: T | null;
	isEditing: boolean;
	onCancel: () => void;
	onSuccess: (entity: T) => void;
}

export interface EntitySettingsViewProps<T extends EntityWithStats> {
	// Opciones adicionales
	className?: string;
	color: string;
	entityLabel: string;
	entityLabelPlural: string;
	// Configuración de identidad
	entityType: string;

	// Configuración
	filterConfig?: FilterConfig;
	gridCols?: {
		sm?: number;
		md?: number;
		lg?: number;
	};
	icon: React.ElementType;

	// Render personalizado
	renderCard: (entity: T, actions: CardActions, isGrid: boolean) => React.ReactNode;
	renderForm: (props: FormProps<T>) => React.ReactNode;
	statsConfig: StatConfig<T>[];
	useDeleteMutation: () => UseMutationResult<void, Error, string>;

	// Hooks de API
	useListQuery: (filters: ListFilters) => UseQueryResult<PaginatedResponse<T>, Error>;
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

	const containerRef = useRef<HTMLDivElement>(null);

	// GSAP Animations
	useGSAP(
		() => {
			if (!filteredEntities || filteredEntities.length === 0) return;

			gsap.fromTo(
				'.entity-card-anim',
				{ opacity: 0, y: 20, scale: 0.95 },
				{ opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.2)', clearProps: 'all' }
			);
		},
		{ scope: containerRef, dependencies: [viewMode, filteredEntities?.length, isLoading] }
	);

	// -------------------------------------------------------------------------
	// HANDLERS
	// -------------------------------------------------------------------------
	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await deleteMutation.mutateAsync(id);
				setSelectedEntity(null);
				setIsEditing(false);
				toastService.success(`${entityLabel} deleted successfully`);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error';
				toastService.error(`Could not delete ${entityLabel.toLowerCase()}`, {
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
				isEditing ? `${entityLabel} updated successfully` : `${entityLabel} created successfully`
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
				<CardContent className="p-4">
					<div className="flex items-center justify-center gap-3">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Loading {entityLabelPlural.toLowerCase()}...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<EmptyState
				description={error.message || `Could not load ${entityLabelPlural.toLowerCase()}`}
				icon={Icon as LucideIcon}
				title="Could not load data"
			/>
		);
	}

	// -------------------------------------------------------------------------
	// RENDER PRINCIPAL
	// -------------------------------------------------------------------------
	return (
		<div className={cn('space-y-6', className)} ref={containerRef}>
			{/* Header */}
			<div>
				<h2 className="font-semibold text-2xl text-foreground">{entityLabelPlural}</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Manage your {entityLabelPlural.toLowerCase()} and configure their options
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
								className="w-70 pl-9"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={`Search ${entityLabelPlural.toLowerCase()}...`}
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
						Create {entityLabel}
					</Button>
				</div>
			</div>

			{/* Content */}
			{filteredEntities.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-6 text-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						{React.createElement(Icon as React.ComponentType<{ className?: string }>, {
							className: 'h-6 w-6 text-muted-foreground',
						})}
					</div>
					<h3 className="font-medium text-lg">No {entityLabelPlural.toLowerCase()} yet</h3>
					<p className="mt-1 max-w-sm text-muted-foreground text-sm">
						{searchQuery || onlyFavorites
							? 'No results match the active filters'
							: `Create your first ${entityLabel.toLowerCase()} to get started`}
					</p>
					<div className="mt-4">
						{searchQuery || onlyFavorites ? (
							<Button onClick={clearFilters} variant="outline">
								Clear filters
							</Button>
						) : (
							<Button onClick={handleCreate}>Create {entityLabel}</Button>
						)}
					</div>
				</div>
			) : (
				<ScrollArea className="h-[calc(100vh-400px)]">
					<div
						className={cn(
							'gap-4',
							viewMode === 'grid'
								? (() => {
										// Hardcode grid classes so tailwind can extract them
										const totalCols = gridCols.lg || 3;
										if (totalCols >= 4)
											return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
										if (totalCols === 3)
											return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
										if (totalCols === 2) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
										return 'grid grid-cols-1 sm:grid-cols-2';
									})()
								: 'flex flex-col'
						)}
					>
						{filteredEntities.map((entity) => (
							<div className="entity-card-anim h-full w-full" key={entity.id}>
								{renderCard(entity, renderActions(entity), viewMode === 'grid')}
							</div>
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
