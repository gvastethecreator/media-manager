/**
 * @file Modern Organization Settings
 * @module components/settings/modern/organization-settings-modern
 * @description Configuración de organización: albums, colecciones y grupos
 */

import { Album, Clock, Edit2, Folder, Image, LayoutGrid, Star, Trash2, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAlbums, useDeleteAlbum } from '@/lib/api/albums';
import { useCollections, useDeleteCollection } from '@/lib/api/collections';
import { useDeleteGroup, useGroups } from '@/lib/api/groups';
import { toastService } from '@/lib/ui/toast';
import type { AlbumWithStats } from '@/types/entities/album';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { GroupWithStats } from '@/types/entities/group';
import type { CardActions } from '../common/entity-settings-view';
import { CreateAlbumForm } from '../forms/create-album-form';
import { CreateCollectionForm } from '../forms/create-collection-form';
import { CreateGroupForm } from '../forms/create-group-form';

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
		getValue: (items: AlbumWithStats[]) => items.reduce((acc, item) => acc + (item.stats?.imageCount || 0), 0),
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
		getSubtitle: (items: CollectionWithStats[]) => `${items.filter((i) => i.category === 'smart').length} inteligentes`,
	},
	{
		key: 'images',
		label: 'Imágenes',
		icon: <Image className="h-5 w-5" />,
		color: 'var(--entity-image)',
		getValue: (items: CollectionWithStats[]) => items.reduce((acc, item) => acc + (item.stats?.imageCount || 0), 0),
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
		getValue: (items: GroupWithStats[]) => items.reduce((acc, item) => acc + (item.stats?.totalAssociations || 0), 0),
		getSubtitle: () => 'Asignados a grupos',
	},
];

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function AlbumCard({ album, actions, isGrid }: { album: AlbumWithStats; actions: CardActions; isGrid: boolean }) {
	if (isGrid) {
		return (
			<Card className="group overflow-hidden">
				<div className="relative aspect-video bg-muted">
					<div className="absolute inset-0 flex items-center justify-center">
						<Album className="h-12 w-12 text-muted-foreground/30" />
					</div>
					{album.isFavorite && (
						<div className="absolute top-2 right-2">
							<Star className="h-4 w-4" style={{ fill: 'var(--entity-favorite)', color: 'var(--entity-favorite)' }} />
						</div>
					)}
					<div
						className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
						style={{ backgroundColor: 'color-mix(in oklch, var(--background) 50%, transparent)' }}
					>
						<Button onClick={actions.onEdit} size="sm" variant="secondary">
							<Edit2 className="h-4 w-4" />
						</Button>
						<Button onClick={actions.onDelete} size="sm" variant="destructive">
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<CardHeader className="p-4">
					<CardTitle className="text-base">{album.name}</CardTitle>
					{album.description && <CardDescription className="mt-1 text-sm">{album.description}</CardDescription>}
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex items-center justify-between text-muted-foreground text-sm">
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
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Album className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="flex items-center gap-2 font-medium">
						{album.name}
						{album.isFavorite && (
							<Star className="h-3 w-3" style={{ fill: 'var(--entity-favorite)', color: 'var(--entity-favorite)' }} />
						)}
					</p>
					{album.description && <p className="text-muted-foreground text-sm">{album.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{album.stats?.imageCount || 0} items</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
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
				<CardTitle className="mt-3 text-base">{collection.name}</CardTitle>
				{collection.description && <CardDescription className="text-sm">{collection.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-sm">{collection.stats?.imageCount || 0} items</span>
					<div className="flex gap-1">
						<Button onClick={actions.onEdit} size="sm" variant="ghost">
							<Edit2 className="h-4 w-4" />
						</Button>
						<Button onClick={actions.onDelete} size="sm" variant="ghost">
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
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<LayoutGrid className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="flex items-center gap-2 font-medium">
						{collection.name}
						<Badge className="text-sm" variant={collection.category === 'smart' ? 'default' : 'secondary'}>
							{collection.category === 'smart' ? 'Inteligente' : 'Manual'}
						</Badge>
					</p>
					{collection.description && <p className="text-muted-foreground text-sm">{collection.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{collection.stats?.imageCount || 0} items</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function GroupCard({ group, actions, isGrid }: { group: GroupWithStats; actions: CardActions; isGrid: boolean }) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Users className="h-5 w-5 text-primary" />
					</div>
					<div>
						<CardTitle className="text-base">{group.name}</CardTitle>
						{group.description && <CardDescription className="text-sm">{group.description}</CardDescription>}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-sm">{group.stats?.totalAssociations || 0} archivos</span>
					<div className="flex gap-1">
						<Button onClick={actions.onEdit} size="sm" variant="ghost">
							<Edit2 className="h-4 w-4" />
						</Button>
						<Button onClick={actions.onDelete} size="sm" variant="ghost">
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
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Users className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium">{group.name}</p>
					{group.description && <p className="text-muted-foreground text-sm">{group.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{group.stats?.totalAssociations || 0} archivos</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
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
					<Dialog onOpenChange={setShowForm} open={showForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Album' : 'Crear Album'}</DialogTitle>
							</DialogHeader>
							<CreateAlbumForm
								album={editingItem as AlbumWithStats}
								isEditing={!!editingItem}
								onCancel={onCancel}
								onCreated={handleCreated}
								onUpdated={handleUpdated}
							/>
						</DialogContent>
					</Dialog>
				);
			case 'collections':
				return (
					<Dialog onOpenChange={setShowForm} open={showForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Colección' : 'Crear Colección'}</DialogTitle>
							</DialogHeader>
							<CreateCollectionForm
								collection={editingItem as CollectionWithStats}
								isEditing={!!editingItem}
								onCancel={onCancel}
								onCreated={handleCreated}
								onUpdated={handleUpdated}
							/>
						</DialogContent>
					</Dialog>
				);
			case 'groups':
				return (
					<Dialog onOpenChange={setShowForm} open={showForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Grupo' : 'Crear Grupo'}</DialogTitle>
							</DialogHeader>
							<CreateGroupForm
								group={editingItem as GroupWithStats}
								isEditing={!!editingItem}
								onCancel={onCancel}
								onSubmit={async () => {
									if (editingItem) {
										handleUpdated();
									} else {
										handleCreated();
									}
								}}
							/>
						</DialogContent>
					</Dialog>
				);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-semibold text-2xl text-foreground">Organización</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Gestiona albums, colecciones inteligentes y grupos de organización
				</p>
			</div>

			<Tabs onValueChange={(v) => setActiveTab(v as typeof activeTab)} value={activeTab}>
				<TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
					<TabsTrigger className="gap-2" value="albums">
						<Album className="h-4 w-4" />
						Albums
						<Badge className="ml-1 text-sm" variant="secondary">
							{albumsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="collections">
						<LayoutGrid className="h-4 w-4" />
						Colecciones
						<Badge className="ml-1 text-sm" variant="secondary">
							{collectionsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="groups">
						<Users className="h-4 w-4" />
						Grupos
						<Badge className="ml-1 text-sm" variant="secondary">
							{groupsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent className="m-0" value="albums">
						<EntityList
							entityLabel="album"
							entityLabelPlural="albums"
							isLoading={albumsQuery.isLoading}
							items={albumsQuery.data?.data || []}
							onCreate={handleCreate}
							onDelete={(id: string) => deleteAlbumMutation.mutateAsync(id)}
							onEdit={handleEdit}
							renderCard={(item: any, actions: CardActions, isGrid: boolean) => (
								<AlbumCard actions={actions} album={item} isGrid={isGrid} />
							)}
							stats={ALBUM_STATS}
						/>
					</TabsContent>

					<TabsContent className="m-0" value="collections">
						<EntityList
							entityLabel="colección"
							entityLabelPlural="colecciones"
							isLoading={collectionsQuery.isLoading}
							items={collectionsQuery.data?.data || []}
							onCreate={handleCreate}
							onDelete={(id: string) => deleteCollectionMutation.mutateAsync(id)}
							onEdit={handleEdit}
							renderCard={(item: any, actions: CardActions, isGrid: boolean) => (
								<CollectionCard actions={actions} collection={item} isGrid={isGrid} />
							)}
							stats={COLLECTION_STATS}
						/>
					</TabsContent>

					<TabsContent className="m-0" value="groups">
						<EntityList
							entityLabel="grupo"
							entityLabelPlural="grupos"
							isLoading={groupsQuery.isLoading}
							items={groupsQuery.data?.data || []}
							onCreate={handleCreate}
							onDelete={(id: string) => deleteGroupMutation.mutateAsync(id)}
							onEdit={handleEdit}
							renderCard={(item: any, actions: CardActions, isGrid: boolean) => (
								<GroupCard actions={actions} group={item} isGrid={isGrid} />
							)}
							stats={GROUP_STATS}
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
	entityLabel: string;
	entityLabelPlural: string;
	isLoading: boolean;
	items: any[];
	onCreate: () => void;
	onDelete: (id: string) => Promise<void>;
	onEdit: (item: any) => void;
	renderCard: (item: any, actions: CardActions, isGrid: boolean) => React.ReactNode;
	stats: any[];
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

	const filteredItems = items.filter((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

	const statsData = stats.map((stat: any) => ({
		...stat,
		value: stat.getValue(items),
		subtitle: stat.getSubtitle?.(items) || '',
	}));

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-6">
				<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{statsData.map((stat: any) => (
					<Card
						className="border-l-4"
						key={stat.key}
						style={{ borderLeftColor: `color-mix(in oklch, ${stat.color} 60%, transparent)` }}
					>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-muted-foreground text-sm">{stat.label}</p>
									<p className="font-bold text-2xl">{stat.value}</p>
									{stat.subtitle && <p className="text-muted-foreground text-sm">{stat.subtitle}</p>}
								</div>
								<div
									className="flex h-10 w-10 items-center justify-center rounded-lg"
									style={{ backgroundColor: `color-mix(in oklch, ${stat.color} 12%, transparent)` }}
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
						className="w-full rounded-lg border bg-background px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={`Buscar ${entityLabelPlural}...`}
						type="text"
						value={searchQuery}
					/>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-lg border p-0.5">
						<Button
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('grid')}
							size="sm"
							variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('list')}
							size="sm"
							variant={viewMode === 'list' ? 'secondary' : 'ghost'}
						>
							<Users className="h-4 w-4" />
						</Button>
					</div>
					<Button className="gap-2" onClick={onCreate}>
						<Album className="h-4 w-4" />
						Crear {entityLabel}
					</Button>
				</div>
			</div>

			{/* Content */}
			{filteredItems.length === 0 ? (
				<EmptyState
					action={<Button onClick={onCreate}>Crear {entityLabel}</Button>}
					description={searchQuery ? 'No se encontraron resultados' : `Comienza creando tu primer ${entityLabel}`}
					title={`No hay ${entityLabelPlural}`}
				/>
			) : (
				<div
					className={
						viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'
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
					)}
				</div>
			)}
		</div>
	);
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
	return (
		<div className="flex flex-col items-center justify-center py-6 text-center">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<Album className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="font-medium text-lg">{title}</h3>
			<p className="mt-1 text-muted-foreground text-sm">{description}</p>
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
