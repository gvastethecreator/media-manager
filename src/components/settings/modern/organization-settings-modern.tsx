/**
 * @file Modern Organization Settings
 * @module components/settings/modern/organization-settings-modern
 * @description Configuración de organización: albums, colecciones y grupos
 */

import { Album, LayoutGrid, Users, Edit2, Trash2, Image, Star, Clock, Folder } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useAlbums, useDeleteAlbum } from '@/lib/api/albums';
import { useCollections, useDeleteCollection } from '@/lib/api/collections';
import { useGroups, useDeleteGroup } from '@/lib/api/groups';
import { toastService } from '@/lib/ui/toast';
import type { AlbumWithStats } from '@/types/entities/album';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { GroupWithStats } from '@/types/entities/group';
import { CreateAlbumForm } from '../albums/create-album-form';
import { CreateCollectionForm } from '../collections/create-collection-form';
import { CreateGroupForm } from '../groups/create-group-form';
import type { CardActions, EntityWithStats, StatConfig } from '../common/entity-settings-view';

// ============================================================================
// CONFIGURACIONES DE STATS
// ============================================================================

const ALBUM_STATS = [
	{
		key: 'total',
		label: 'Albums',
		icon: <Album className="h-5 w-5" />,
		color: 'var(--entity-album)',
		getValue: (items: AlbumWithStats[]) => items.length,
		getSubtitle: (items: AlbumWithStats[]) => `${items.filter((i) => i.isFavorite).length} favoritos`,
	},
	{
		key: 'images',
		label: 'Imágenes',
		icon: <Image className="h-5 w-5" />,
		color: 'var(--entity-image)',
		getValue: (items: AlbumWithStats[]) =>
			items.reduce((acc, item) => acc + (item.stats?.imageCount || 0), 0),
		getSubtitle: () => 'Total en albums',
	},
	{
		key: 'empty',
		label: 'Vacíos',
		icon: <Folder className="h-5 w-5" />,
		color: 'var(--muted-foreground)',
		getValue: (items: AlbumWithStats[]) => items.filter((i) => (i.stats?.imageCount || 0) === 0).length,
		getSubtitle: () => 'Sin contenido',
	},
];

const COLLECTION_STATS = [
	{
		key: 'total',
		label: 'Colecciones',
		icon: <LayoutGrid className="h-5 w-5" />,
		color: 'var(--entity-collection)',
		getValue: (items: CollectionWithStats[]) => items.length,
		getSubtitle: (items: CollectionWithStats[]) =>
			`${items.filter((i) => i.category === 'smart').length} inteligentes`,
	},
	{
		key: 'images',
		label: 'Imágenes',
		icon: <Image className="h-5 w-5" />,
		color: 'var(--entity-image)',
		getValue: (items: CollectionWithStats[]) =>
			items.reduce((acc, item) => acc + (item.stats?.imageCount || 0), 0),
		getSubtitle: () => 'Total indexadas',
	},
];

const GROUP_STATS = [
	{
		key: 'total',
		label: 'Grupos',
		icon: <Users className="h-5 w-5" />,
		color: 'var(--entity-group)',
		getValue: (items: GroupWithStats[]) => items.length,
		getSubtitle: () => 'Organizaciones',
	},
	{
		key: 'files',
		label: 'Archivos',
		icon: <Folder className="h-5 w-5" />,
		color: 'var(--entity-file)',
		getValue: (items: GroupWithStats[]) =>
			items.reduce((acc, item) => acc + (item.stats?.totalAssociations || 0), 0),
		getSubtitle: () => 'Asignados a grupos',
	},
];

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function AlbumCard({
	album,
	actions,
	isGrid,
}: {
	album: AlbumWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	if (isGrid) {
		return (
			<Card className="group overflow-hidden">
				<div className="aspect-video bg-muted relative">
					<div className="absolute inset-0 flex items-center justify-center">
						<Album className="h-12 w-12 text-muted-foreground/30" />
					</div>
					{album.isFavorite && (
						<div className="absolute top-2 right-2">
							<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
						</div>
					)}
					<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
						<Button size="sm" variant="secondary" onClick={actions.onEdit}>
							<Edit2 className="h-4 w-4" />
						</Button>
						<Button size="sm" variant="destructive" onClick={actions.onDelete}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<CardHeader className="p-4">
					<CardTitle className="text-base">{album.name}</CardTitle>
					{album.description && (
						<CardDescription className="text-xs mt-1">{album.description}</CardDescription>
					)}
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Image className="h-3 w-3" />
							{album.stats?.imageCount || 0} items
						</span>
						<span className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							{album.updatedAt ? new Date(album.updatedAt).toLocaleDateString() : 'Nunca'}
						</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Album className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium flex items-center gap-2">
						{album.name}
						{album.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
					</p>
					{album.description && (
						<p className="text-sm text-muted-foreground">{album.description}</p>
					)}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{album.stats?.imageCount || 0} items</span>
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

function CollectionCard({
	collection,
	actions,
	isGrid,
}: {
	collection: CollectionWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<LayoutGrid className="h-5 w-5 text-primary" />
					</div>
					<Badge variant={collection.category === 'smart' ? 'default' : 'secondary'}>
						{collection.category === 'smart' ? 'Inteligente' : 'Manual'}
					</Badge>
				</div>
				<CardTitle className="text-base mt-3">{collection.name}</CardTitle>
				{collection.description && (
					<CardDescription className="text-xs">{collection.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">
						{collection.stats?.imageCount || 0} items
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
					<LayoutGrid className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium flex items-center gap-2">
						{collection.name}
						<Badge variant={collection.category === 'smart' ? 'default' : 'secondary'} className="text-xs">
							{collection.category === 'smart' ? 'Inteligente' : 'Manual'}
						</Badge>
					</p>
					{collection.description && (
						<p className="text-sm text-muted-foreground">{collection.description}</p>
					)}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{collection.stats?.imageCount || 0} items</span>
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

function GroupCard({
	group,
	actions,
	isGrid,
}: {
	group: GroupWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Users className="h-5 w-5 text-primary" />
					</div>
					<div>
						<CardTitle className="text-base">{group.name}</CardTitle>
						{group.description && (
							<CardDescription className="text-xs">{group.description}</CardDescription>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">
						{group.stats?.totalAssociations || 0} archivos
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
					<Users className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium">{group.name}</p>
					{group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">
					{group.stats?.totalAssociations || 0} archivos
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
		</div>
	);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function OrganizationSettingsModern() {
	const [activeTab, setActiveTab] = useState<'albums' | 'collections' | 'groups'>('albums');
	const [showForm, setShowForm] = useState(false);
	const [editingItem, setEditingItem] = useState<AlbumWithStats | CollectionWithStats | GroupWithStats | null>(null);

	// Hooks de datos
	const albumsQuery = useAlbums({});
	const collectionsQuery = useCollections({});
	const groupsQuery = useGroups({});

	const deleteAlbumMutation = useDeleteAlbum();
	const deleteCollectionMutation = useDeleteCollection();
	const deleteGroupMutation = useDeleteGroup();

	// Handlers comunes
	const handleCreate = useCallback(() => {
		setEditingItem(null);
		setShowForm(true);
	}, []);

	const handleEdit = useCallback((item: AlbumWithStats | CollectionWithStats | GroupWithStats) => {
		setEditingItem(item);
		setShowForm(true);
	}, []);

	const handleCreated = useCallback(() => {
		setShowForm(false);
		setEditingItem(null);
		toastService.success('Creado correctamente');
	}, []);

	const handleUpdated = useCallback(() => {
		setShowForm(false);
		setEditingItem(null);
		toastService.success('Actualizado correctamente');
	}, []);

	// Render del formulario según el tab activo
	const renderForm = () => {
		const onCancel = () => setShowForm(false);

		switch (activeTab) {
			case 'albums':
				return (
					<Dialog open={showForm} onOpenChange={setShowForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Album' : 'Crear Album'}</DialogTitle>
							</DialogHeader>
							<CreateAlbumForm
								album={editingItem as AlbumWithStats}
								isEditing={!!editingItem}
								onCreated={handleCreated}
								onUpdated={handleUpdated}
								onCancel={onCancel}
							/>
						</DialogContent>
					</Dialog>
				);
			case 'collections':
				return (
					<Dialog open={showForm} onOpenChange={setShowForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Colección' : 'Crear Colección'}</DialogTitle>
							</DialogHeader>
							<CreateCollectionForm
								collection={editingItem as CollectionWithStats}
								isEditing={!!editingItem}
								onCreated={handleCreated}
								onUpdated={handleUpdated}
								onCancel={onCancel}
							/>
						</DialogContent>
					</Dialog>
				);
			case 'groups':
				return (
					<Dialog open={showForm} onOpenChange={setShowForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Grupo' : 'Crear Grupo'}</DialogTitle>
							</DialogHeader>
							<CreateGroupForm
								group={editingItem as GroupWithStats}
								isEditing={!!editingItem}
								onSubmit={async () => {
									if (editingItem) {
										handleUpdated();
									} else {
										handleCreated();
									}
								}}
								onCancel={onCancel}
							/>
						</DialogContent>
					</Dialog>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-semibold text-foreground">Organización</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Gestiona albums, colecciones inteligentes y grupos de organización
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
				<TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
					<TabsTrigger value="albums" className="gap-2">
						<Album className="h-4 w-4" />
						Albums
						<Badge variant="secondary" className="ml-1 text-xs">
							{albumsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="collections" className="gap-2">
						<LayoutGrid className="h-4 w-4" />
						Colecciones
						<Badge variant="secondary" className="ml-1 text-xs">
							{collectionsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="groups" className="gap-2">
						<Users className="h-4 w-4" />
						Grupos
						<Badge variant="secondary" className="ml-1 text-xs">
							{groupsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="albums" className="m-0">
						<EntityList
							items={albumsQuery.data?.data || []}
							isLoading={albumsQuery.isLoading}
							stats={ALBUM_STATS}
							onCreate={handleCreate}
							onEdit={handleEdit}
							onDelete={(id: string) => deleteAlbumMutation.mutateAsync(id)}
							renderCard={(item: any, actions: CardActions, isGrid: boolean) => (
								<AlbumCard album={item} actions={actions} isGrid={isGrid} />
							)}
							entityLabel="album"
							entityLabelPlural="albums"
						/>
					</TabsContent>

					<TabsContent value="collections" className="m-0">
						<EntityList
							items={collectionsQuery.data?.data || []}
							isLoading={collectionsQuery.isLoading}
							stats={COLLECTION_STATS}
							onCreate={handleCreate}
							onEdit={handleEdit}
							onDelete={(id: string) => deleteCollectionMutation.mutateAsync(id)}
							renderCard={(item: any, actions: CardActions, isGrid: boolean) => (
								<CollectionCard collection={item} actions={actions} isGrid={isGrid} />
							)}
							entityLabel="colección"
							entityLabelPlural="colecciones"
						/>
					</TabsContent>

					<TabsContent value="groups" className="m-0">
						<EntityList
							items={groupsQuery.data?.data || []}
							isLoading={groupsQuery.isLoading}
							stats={GROUP_STATS}
							onCreate={handleCreate}
							onEdit={handleEdit}
							onDelete={(id: string) => deleteGroupMutation.mutateAsync(id)}
							renderCard={(item: any, actions: CardActions, isGrid: boolean) => (
								<GroupCard group={item} actions={actions} isGrid={isGrid} />
							)}
							entityLabel="grupo"
							entityLabelPlural="grupos"
						/>
					</TabsContent>
				</div>
			</Tabs>

			{showForm && renderForm()}
		</div>
	);
}

// ============================================================================
// COMPONENTE AUXILIAR PARA LISTAS
// ============================================================================

interface EntityListProps {
	items: any[];
	isLoading: boolean;
	stats: any[];
	onCreate: () => void;
	onEdit: (item: any) => void;
	onDelete: (id: string) => Promise<void>;
	renderCard: (item: any, actions: CardActions, isGrid: boolean) => React.ReactNode;
	entityLabel: string;
	entityLabelPlural: string;
}

function EntityList({
	items,
	isLoading,
	stats,
	onCreate,
	onEdit,
	onDelete,
	renderCard,
	entityLabel,
	entityLabelPlural,
}: EntityListProps) {
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [searchQuery, setSearchQuery] = useState('');

	const filteredItems = items.filter((item: any) =>
		item.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const statsData = stats.map((stat: any) => ({
		...stat,
		value: stat.getValue(items),
		subtitle: stat.getSubtitle?.(items) || '',
	}));

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{statsData.map((stat: any) => (
					<Card key={stat.key} className="border-l-4" style={{ borderLeftColor: stat.color }}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
									<p className="text-2xl font-bold">{stat.value}</p>
									{stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
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
					<input
						type="text"
						placeholder={`Buscar ${entityLabelPlural}...`}
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
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === 'list' ? 'secondary' : 'ghost'}
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('list')}
						>
							<Users className="h-4 w-4" />
						</Button>
					</div>
					<Button onClick={onCreate} className="gap-2">
						<Album className="h-4 w-4" />
						Crear {entityLabel}
					</Button>
				</div>
			</div>

			{/* Content */}
			{filteredItems.length === 0 ? (
				<EmptyState
					title={`No hay ${entityLabelPlural}`}
					description={
						searchQuery
							? 'No se encontraron resultados'
							: `Comienza creando tu primer ${entityLabel}`
					}
					action={<Button onClick={onCreate}>Crear {entityLabel}</Button>}
				/>
			) : (
				<div
					className={
						viewMode === 'grid'
							? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
							: 'flex flex-col gap-2'
					}
				>
					{filteredItems.map((item) =>
						renderCard(
							item,
							{
								onEdit: () => onEdit(item),
								onDelete: () => onDelete(item.id),
							},
							viewMode === 'grid'
							)
						)
					}
				</div>
			)}
		</div>
	);
}

// Import para EmptyState
import { EmptyState as EmptyStateComponent } from '@/components/ui/empty-state';

function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
				<Album className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-medium">{title}</h3>
			<p className="text-sm text-muted-foreground mt-1">{description}</p>
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
