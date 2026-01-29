/**
 * @file Modern Taxonomy Settings
 * @module components/settings/modern/taxonomy-settings-modern
 * @description Configuración de taxonomía: etiquetas y propiedades
 */

import { Tag, Hash, Edit2, Trash2, Grid3X3, List, Plus, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTags, useDeleteTag } from '@/lib/api/tags';
import { useProperties, useDeleteProperty } from '@/lib/api/properties';
import { toastService } from '@/lib/ui/toast';
import type { TagWithStats } from '@/types/entities/tag';
import type { PropertyWithStats } from '@/types/entities/property';
import { CreateTagForm } from '../tags/create-tag-form';
import { CreatePropertyForm } from '../properties/create-property-form';
import type { CardActions } from '../common/entity-settings-view';

// ============================================================================
// CONFIGURACIONES DE STATS
// ============================================================================

const TAG_STATS = [
	{
		key: 'total',
		label: 'Etiquetas',
		icon: <Tag className="h-5 w-5" />,
		color: 'var(--entity-tag)',
		getValue: (items: TagWithStats[]) => items.length,
		getSubtitle: (items: TagWithStats[]) => `${items.filter((i) => i.isFavorite).length} favoritas`,
	},
	{
		key: 'relations',
		label: 'Relaciones',
		icon: <Hash className="h-5 w-5" />,
		color: 'var(--primary)',
		getValue: (items: TagWithStats[]) => items.reduce((acc, item) => acc + (item._count?.images || 0), 0),
		getSubtitle: () => 'Total asignaciones',
	},
	{
		key: 'categories',
		label: 'Categorías',
		icon: <Grid3X3 className="h-5 w-5" />,
		color: 'var(--entity-collection)',
		getValue: (items: TagWithStats[]) => new Set(items.map((i) => i.category)).size,
		getSubtitle: () => 'Tipos diferentes',
	},
];

const PROPERTY_STATS = [
	{
		key: 'total',
		label: 'Propiedades',
		icon: <Hash className="h-5 w-5" />,
		color: 'var(--entity-property)',
		getValue: (items: PropertyWithStats[]) => items.length,
		getSubtitle: () => 'Metadatos extraídos',
	},
	{
		key: 'files',
		label: 'Archivos',
		icon: <List className="h-5 w-5" />,
		color: 'var(--entity-file)',
		getValue: (items: PropertyWithStats[]) =>
			items.reduce((acc, item) => acc + (item._count?.images || 0), 0),
		getSubtitle: () => 'Con propiedades',
	},
];

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function TagCard({
	tag,
	actions,
	isGrid,
}: {
	tag: TagWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const emoji = tag.emoji || '🏷️';

	if (isGrid) {
		return (
			<Card className="group relative overflow-hidden">
				<CardHeader className="p-4 pb-2">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							<span className="text-2xl">{emoji}</span>
							{tag.color && (
								<div
									className="h-6 w-6 rounded-full border"
									style={{ backgroundColor: tag.color }}
								/>
							)}
						</div>
						{tag.isFavorite && <span className="text-amber-400">★</span>}
					</div>
					<CardTitle className="text-base mt-2">{tag.name}</CardTitle>
					<Badge variant="secondary" className="mt-1 text-xs capitalize">
						{tag.category}
					</Badge>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">{tag._count?.images || 0} usos</span>
						<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={actions.onEdit}>
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={actions.onDelete}>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<span className="text-xl">{emoji}</span>
				{tag.color && (
					<div className="h-8 w-8 rounded-full border" style={{ backgroundColor: tag.color }} />
				)}
				<div>
					<p className="font-medium flex items-center gap-2">
						{tag.name}
						{tag.isFavorite && <span className="text-amber-400 text-sm">★</span>}
					</p>
					<p className="text-sm text-muted-foreground capitalize">{tag.category}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{tag._count?.images || 0} usos</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function PropertyCard({
	property,
	actions,
	isGrid,
}: {
	property: PropertyWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Hash className="h-5 w-5 text-primary" />
					</div>
					<Badge variant="outline">{property.type || property.category || 'text'}</Badge>
				</div>
				<CardTitle className="text-base mt-3">{property.name}</CardTitle>
				{property.description && (
					<CardDescription className="text-xs">{property.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">
						{property._count?.images || 0} archivos
					</span>
					<div className="flex gap-1">
						<Button variant="ghost" size="sm" onClick={actions.onEdit}>
							<Edit2 className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="sm" onClick={actions.onDelete}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) {
		return <Card>{content}</Card>;
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Hash className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium flex items-center gap-2">
						{property.name}
						<Badge variant="outline" className="text-xs">
							{property.type || property.category || 'text'}
						</Badge>
					</p>
					{property.description && (
						<p className="text-sm text-muted-foreground">{property.description}</p>
					)}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{property._count?.images || 0} archivos</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function TaxonomySettingsModern() {
	const [activeTab, setActiveTab] = useState<'tags' | 'properties'>('tags');
	const [showForm, setShowForm] = useState(false);
	const [editingItem, setEditingItem] = useState<TagWithStats | PropertyWithStats | null>(null);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [searchQuery, setSearchQuery] = useState('');

	// Hooks de datos
	const tagsQuery = useTags({ search: searchQuery, limit: 1000 });
	const propertiesQuery = useProperties({ search: searchQuery, limit: 1000 });

	const deleteTagMutation = useDeleteTag();
	const deletePropertyMutation = useDeleteProperty();

	// Stats
	const tagStats = useMemo(
		() =>
			TAG_STATS.map((stat) => ({
				...stat,
				value: stat.getValue(tagsQuery.data?.data || []),
				subtitle: stat.getSubtitle?.(tagsQuery.data?.data || []) || '',
			})),
		[tagsQuery.data]
	);

	const propertyStats = useMemo(
		() =>
			PROPERTY_STATS.map((stat) => ({
				...stat,
				value: stat.getValue(propertiesQuery.data?.data || []),
				subtitle: stat.getSubtitle?.() || '',
			})),
		[propertiesQuery.data]
	);

	// Handlers
	const handleCreate = useCallback(() => {
		setEditingItem(null);
		setShowForm(true);
	}, []);

	const handleEdit = useCallback((item: TagWithStats | PropertyWithStats) => {
		setEditingItem(item);
		setShowForm(true);
	}, []);

	const handleSuccess = useCallback(() => {
		setShowForm(false);
		setEditingItem(null);
		toastService.success(editingItem ? 'Actualizado correctamente' : 'Creado correctamente');
	}, [editingItem]);

	// Render del formulario
	const renderForm = () => {
		const onCancel = () => setShowForm(false);

		if (activeTab === 'tags') {
			return (
				<Dialog open={showForm} onOpenChange={setShowForm}>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>{editingItem ? 'Editar Etiqueta' : 'Crear Etiqueta'}</DialogTitle>
						</DialogHeader>
						<CreateTagForm
							tag={editingItem as TagWithStats}
							isEditing={!!editingItem}
							onCreated={handleSuccess}
							onUpdated={handleSuccess}
							onCancel={onCancel}
						/>
					</DialogContent>
				</Dialog>
			);
		}

		return (
			<Dialog open={showForm} onOpenChange={setShowForm}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>{editingItem ? 'Editar Propiedad' : 'Crear Propiedad'}</DialogTitle>
					</DialogHeader>
					<CreatePropertyForm
						property={editingItem as PropertyWithStats}
						isEditing={!!editingItem}
						onCreated={() => handleSuccess()}
							onUpdated={() => handleSuccess()}
						onCancel={onCancel}
					/>
				</DialogContent>
			</Dialog>
		);
	};

	const currentStats = activeTab === 'tags' ? tagStats : propertyStats;
	const currentItems = activeTab === 'tags' ? tagsQuery.data?.data || [] : propertiesQuery.data?.data || [];
	const isLoading = activeTab === 'tags' ? tagsQuery.isLoading : propertiesQuery.isLoading;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-semibold text-foreground">Taxonomía</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Gestiona etiquetas, categorías y propiedades de metadatos
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
				<TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
					<TabsTrigger value="tags" className="gap-2">
						<Tag className="h-4 w-4" />
						Etiquetas
						<Badge variant="secondary" className="ml-1 text-xs">
							{tagsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="properties" className="gap-2">
						<Hash className="h-4 w-4" />
						Propiedades
						<Badge variant="secondary" className="ml-1 text-xs">
							{propertiesQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<div className="mt-6 space-y-6">
					{/* Stats */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{currentStats.map((stat) => (
							<Card key={stat.key} className="border-l-4" style={{ borderLeftColor: stat.color }}>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
											<p className="text-2xl font-bold">{stat.value}</p>
											{stat.subtitle && (
												<p className="text-xs text-muted-foreground">{stat.subtitle}</p>
											)}
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
						<div className="relative max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								placeholder={`Buscar ${activeTab === 'tags' ? 'etiquetas' : 'propiedades'}...`}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full px-4 py-2 pl-10 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>
						<div className="flex items-center gap-2">
							<div className="flex items-center border rounded-lg p-0.5">
								<Button
									variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() => setViewMode('grid')}
								>
									<Grid3X3 className="h-4 w-4" />
								</Button>
								<Button
									variant={viewMode === 'list' ? 'secondary' : 'ghost'}
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() => setViewMode('list')}
								>
									<List className="h-4 w-4" />
								</Button>
							</div>
							<Button onClick={handleCreate} className="gap-2">
								<Plus className="h-4 w-4" />
								Crear {activeTab === 'tags' ? 'Etiqueta' : 'Propiedad'}
							</Button>
						</div>
					</div>

					{/* Content */}
					{isLoading ? (
						<div className="flex items-center justify-center p-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
						</div>
					) : currentItems.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
								<Tag className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-medium">
								No hay {activeTab === 'tags' ? 'etiquetas' : 'propiedades'}
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{searchQuery
									? 'No se encontraron resultados'
									: `Comienza creando tu primer ${activeTab === 'tags' ? 'etiqueta' : 'propiedad'}`}
							</p>
							<div className="mt-4">
								{searchQuery ? (
									<Button variant="outline" onClick={() => setSearchQuery('')}>
										Limpiar búsqueda
									</Button>
								) : (
									<Button onClick={handleCreate}>
										Crear {activeTab === 'tags' ? 'Etiqueta' : 'Propiedad'}
									</Button>
								)}
							</div>
						</div>
					) : (
						<div
							className={
								viewMode === 'grid'
									? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
									: 'flex flex-col gap-2'
							}
						>
							{activeTab === 'tags'
								? (currentItems as TagWithStats[]).map((item) => (
										<TagCard
											key={item.id}
											tag={item}
											actions={{
												onEdit: () => handleEdit(item),
												onDelete: () => deleteTagMutation.mutateAsync(item.id),
											}}
											isGrid={viewMode === 'grid'}
										/>
									))
								: (currentItems as PropertyWithStats[]).map((item) => (
										<PropertyCard
											key={item.id}
											property={item}
											actions={{
												onEdit: () => handleEdit(item),
												onDelete: () => deletePropertyMutation.mutateAsync(item.id),
											}}
											isGrid={viewMode === 'grid'}
										/>
									))}
						</div>
					)}
				</div>
			</Tabs>

			{showForm && renderForm()}
		</div>
	);
}
