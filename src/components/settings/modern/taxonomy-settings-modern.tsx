/**
 * @file Modern Taxonomy Settings
 * @module components/settings/modern/taxonomy-settings-modern
 * @description Configuración de taxonomía: etiquetas y propiedades
 */

import { Edit2, Grid3X3, Hash, List, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeleteProperty, useProperties } from '@/lib/api/properties';
import { useDeleteTag, useTags } from '@/lib/api/tags';
import { toastService } from '@/lib/ui/toast';
import type { PropertyWithStats } from '@/types/entities/property';
import type { TagWithStats } from '@/types/entities/tag';
import type { CardActions } from '../common/entity-settings-view';
import { CreatePropertyForm } from '../forms/create-property-form';
import { CreateTagForm } from '../forms/create-tag-form';
import { SettingsPageHeader, SettingsStatsGrid } from './settings-card';

// ============================================================================
// CONFIGURACIONES DE STATS
// ============================================================================

const TAG_STATS = [
	{
		key: 'total',
		label: 'Tags',
		icon: <Tag className="h-5 w-5" />,
		color: 'var(--entity-tag)',
		getValue: (items: TagWithStats[]) => items.length,
		getSubtitle: (items: TagWithStats[]) => `${items.filter((i) => i.isFavorite).length} favorites`,
	},
	{
		key: 'relations',
		label: 'Relationships',
		icon: <Hash className="h-5 w-5" />,
		color: 'var(--primary)',
		getValue: (items: TagWithStats[]) => items.reduce((acc, item) => acc + (item._count?.images || 0), 0),
		getSubtitle: () => 'Total assignments',
	},
	{
		key: 'categories',
		label: 'Categories',
		icon: <Grid3X3 className="h-5 w-5" />,
		color: 'var(--entity-collection)',
		getValue: (items: TagWithStats[]) => new Set(items.map((i) => i.category)).size,
		getSubtitle: () => 'Distinct types',
	},
];

const PROPERTY_STATS = [
	{
		key: 'total',
		label: 'Properties',
		icon: <Hash className="h-5 w-5" />,
		color: 'var(--entity-property)',
		getValue: (items: PropertyWithStats[]) => items.length,
		getSubtitle: () => 'Extracted metadata',
	},
	{
		key: 'files',
		label: 'Files',
		icon: <List className="h-5 w-5" />,
		color: 'var(--entity-file)',
		getValue: (items: PropertyWithStats[]) => items.reduce((acc, item) => acc + (item._count?.images || 0), 0),
		getSubtitle: () => 'With properties',
	},
];

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function TagCard({ tag, actions, isGrid }: { tag: TagWithStats; actions: CardActions; isGrid: boolean }) {
	const emoji = tag.emoji || '🏷️';

	if (isGrid) {
		return (
			<Card className="group relative overflow-hidden">
				<CardHeader className="p-4 pb-2">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							<span className="text-2xl">{emoji}</span>
							{tag.color && <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: tag.color }} />}
						</div>
						{tag.isFavorite && <span style={{ color: 'var(--entity-favorite)' }}>★</span>}
					</div>
					<CardTitle className="mt-2 text-base">{tag.name}</CardTitle>
					<Badge className="mt-1 text-sm capitalize" variant="secondary">
						{tag.category}
					</Badge>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-sm">{tag._count?.images || 0} uses</span>
						<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<Button className="h-8 w-8 p-0" onClick={actions.onEdit} size="sm" variant="ghost">
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button className="h-8 w-8 p-0" onClick={actions.onDelete} size="sm" variant="ghost">
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<span className="text-xl">{emoji}</span>
				{tag.color && <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: tag.color }} />}
				<div>
					<p className="flex items-center gap-2 font-medium">
						{tag.name}
						{tag.isFavorite && (
							<span className="text-sm" style={{ color: 'var(--entity-favorite)' }}>
								★
							</span>
						)}
					</p>
					<p className="text-muted-foreground text-sm capitalize">{tag.category}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{tag._count?.images || 0} uses</span>
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
				<CardTitle className="mt-3 text-base">{property.name}</CardTitle>
				{property.description && <CardDescription className="text-sm">{property.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-sm">{property._count?.images || 0} files</span>
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
					<Hash className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="flex items-center gap-2 font-medium">
						{property.name}
						<Badge className="text-sm" variant="outline">
							{property.type || property.category || 'text'}
						</Badge>
					</p>
					{property.description && <p className="text-muted-foreground text-sm">{property.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{property._count?.images || 0} files</span>
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
		toastService.success(editingItem ? 'Updated successfully' : 'Created successfully');
	}, [editingItem]);

	// Render del formulario
	const renderForm = () => {
		const onCancel = () => setShowForm(false);

		if (activeTab === 'tags') {
			return (
				<Dialog onOpenChange={setShowForm} open={showForm}>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>{editingItem ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
						</DialogHeader>
						<CreateTagForm
							isEditing={!!editingItem}
							onCancel={onCancel}
							onCreated={handleSuccess}
							onUpdated={handleSuccess}
							tag={editingItem as TagWithStats}
						/>
					</DialogContent>
				</Dialog>
			);
		}

		return (
			<Dialog onOpenChange={setShowForm} open={showForm}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>{editingItem ? 'Edit Property' : 'Create Property'}</DialogTitle>
					</DialogHeader>
					<CreatePropertyForm
						isEditing={!!editingItem}
						onCancel={onCancel}
						onCreated={() => handleSuccess()}
						onUpdated={() => handleSuccess()}
						property={editingItem as PropertyWithStats}
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
			<SettingsPageHeader description="Manage tags, categories, and metadata properties" title="Taxonomy" />

			<Tabs onValueChange={(v) => setActiveTab(v as typeof activeTab)} value={activeTab}>
				<TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
					<TabsTrigger className="gap-2" value="tags">
						<Tag className="h-4 w-4" />
						Tags
						<Badge className="ml-1 text-sm" variant="secondary">
							{tagsQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="properties">
						<Hash className="h-4 w-4" />
						Properties
						<Badge className="ml-1 text-sm" variant="secondary">
							{propertiesQuery.data?.data?.length || 0}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<div className="mt-6 space-y-6">
					{/* Stats */}
					<SettingsStatsGrid className="2xl:grid-cols-3">
						{currentStats.map((stat) => (
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
					</SettingsStatsGrid>

					{/* Toolbar */}
					<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
						<div className="relative w-full max-w-xl xl:max-w-sm">
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								className="w-full rounded-lg border bg-background px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={`Search ${activeTab === 'tags' ? 'tags' : 'properties'}...`}
								type="text"
								value={searchQuery}
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2 xl:justify-end">
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
								Create {activeTab === 'tags' ? 'Tag' : 'Property'}
							</Button>
						</div>
					</div>

					{/* Content */}
					{isLoading ? (
						<div className="flex items-center justify-center p-6">
							<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
						</div>
					) : currentItems.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-6 text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
								<Tag className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="font-medium text-lg">No {activeTab === 'tags' ? 'tags' : 'properties'} yet</h3>
							<p className="mt-1 text-muted-foreground text-sm">
								{searchQuery
									? 'No results found'
									: `Create your first ${activeTab === 'tags' ? 'tag' : 'property'} to get started`}
							</p>
							<div className="mt-4">
								{searchQuery ? (
									<Button onClick={() => setSearchQuery('')} variant="outline">
										Clear search
									</Button>
								) : (
									<Button onClick={handleCreate}>Create {activeTab === 'tags' ? 'Tag' : 'Property'}</Button>
								)}
							</div>
						</div>
					) : (
						<div
							className={
								viewMode === 'grid'
									? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
									: 'flex flex-col gap-2'
							}
						>
							{activeTab === 'tags'
								? (currentItems as TagWithStats[]).map((item) => (
										<TagCard
											actions={{
												onEdit: () => handleEdit(item),
												onDelete: () => deleteTagMutation.mutateAsync(item.id),
											}}
											isGrid={viewMode === 'grid'}
											key={item.id}
											tag={item}
										/>
									))
								: (currentItems as PropertyWithStats[]).map((item) => (
										<PropertyCard
											actions={{
												onEdit: () => handleEdit(item),
												onDelete: () => deletePropertyMutation.mutateAsync(item.id),
											}}
											isGrid={viewMode === 'grid'}
											key={item.id}
											property={item}
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
