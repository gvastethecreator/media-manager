/**
 * @file Demostración de la integración completa del Details Panel
 * @module components/panels/details-panel/details-panel-showcase
 */

import { memo, useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';
import { EnhancedDetailsPanel } from './enhanced-details-panel';
import { useDetailsPanelComplete } from './integration-hook';

// Datos de ejemplo para la demostración
const mockEntities: AnyEntityWithStats[] = [
	{
		id: '1',
		name: 'imagen-ejemplo.jpg',
		entityType: 'image',
		description: 'Una imagen de ejemplo',
		path: '/images/ejemplo.jpg',
		hash: 'abc123def456',
		size: 2048576,
		width: 1920,
		height: 1080,
		metadata: null,
		thumbnail: null,
		thumbnailSize: null,
		thumbnailWidth: null,
		thumbnailHeight: null,
		thumbnailMimeType: null,
		thumbnailError: null,
		thumbnailErrorAt: null,
		thumbnailOptimizedAt: null,
		isFavorite: false,
		folderId: 'folder1',
		noteId: null,
		addedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		thumbnailUrl: '/images/ejemplo-thumb.jpg',
		fullUrl: '/images/ejemplo.jpg',
		stats: {
			viewCount: 10,
			downloadCount: 2,
			likeCount: 5,
			commentCount: 1,
			tagCount: 3,
			albumCount: 2,
			collectionCount: 1,
			characterCount: 0,
			placeCount: 1,
			worldItemCount: 0,
			conceptCount: 2,
			promptCount: 1,
			noteCount: 1,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			lastViewedAt: new Date(),
			lastDownloadedAt: new Date(),
			lastLikedAt: new Date(),
			lastCommentedAt: new Date(),
		},
	} as AnyEntityWithStats,
	{
		id: '2',
		name: 'video-demo.mp4',
		entityType: 'video',
		description: 'Un video de demostración',
		path: '/videos/demo.mp4',
		hash: 'def456ghi789',
		size: 15728640,
		width: 1920,
		height: 1080,
		duration: 120,
		format: 'mp4',
		metadata: null,
		thumbnail: null,
		thumbnailSize: null,
		thumbnailWidth: null,
		thumbnailHeight: null,
		thumbnailMimeType: null,
		thumbnailError: null,
		thumbnailErrorAt: null,
		thumbnailOptimizedAt: null,
		isFavorite: false,
		isPublic: true,
		isHidden: false,
		folderId: 'folder1',
		noteId: null,
		addedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		thumbnailUrl: '/videos/demo-thumb.jpg',
		frameRate: 30,
		videoCodec: 'h264',
		audioCodec: 'aac',
		bitrate: 5000,
		stats: {
			albumCount: 1,
			collectionCount: 1,
			tagCount: 2,
			characterCount: 1,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 1,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			totalRelations: 5,
			totalAssociations: 3,
			totalItems: 1,
			durationMinutes: 2,
			durationHours: 0.033,
			megabytes: 15,
			gigabytes: 0.015,
			aspectRatio: '16:9',
			resolution: '1920x1080',
			formattedSize: '15.0 MB',
			formattedDuration: '2:00',
			qualityLevel: 'high' as const,
			qualityScore: 85,
			technicalGrade: 'A' as const,
			hasAudio: true,
			hasSubtitles: false,
			bitrate: 5000,
			frameRate: 30,
			views: 8,
			likes: 3,
			downloads: 1,
			shares: 0,
			lastViewed: new Date(),
			duplicateStatus: 'unique' as const,
			thumbnailUrl: '/videos/demo-thumb.jpg',
		},
	} as AnyEntityWithStats,
	{
		id: '3',
		name: 'Documentos',
		entityType: 'folder',
		description: 'Carpeta de documentos',
		emoji: '📁',
		color: '#10B981',
		featuredImage: null,
		isFavorite: false,
		path: '/folders/documentos',
		totalFiles: 20,
		totalSize: 52428800,
		autoReindex: true,
		lastIndexed: new Date(),
		parentId: null,
		presetId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		stats: {
			hierarchyDepth: 1,
			totalDescendants: 2,
			directChildren: 2,
			contentDiversity: 0.7,
			organizationScore: 0.8,
			totalItems: 20,
			folderCount: 2,
			accessFrequency: 10,
			lastActivity: new Date(),
			imageCount: 15,
			videoCount: 3,
			noteCount: 0,
			documentCount: 2,
			totalAudio: 0,
			totalOthers: 0,
			formattedSize: '50 MB',
			totalSize: 52428800,
			averageFileSize: 2621440,
			largestFile: 10485760,
			hasConsistentNaming: true,
			hasDeepHierarchy: false,
			isWellOrganized: true,
			breadcrumbs: [{ id: '3', name: 'Documentos', path: '/folders/documentos' }],
			fullPath: '/folders/documentos',
			relativePath: 'documentos',
			autoTags: ['documents'],
			qualityGrade: 'B' as const,
			totalRelations: 0,
			lastScanned: new Date().toISOString(),
			recentImages: [],
		},
	} as AnyEntityWithStats,
	{
		id: '4',
		name: 'Mi Colección',
		entityType: 'collection',
		description: 'Una colección de ejemplo',
		emoji: '📸',
		color: '#3B82F6',
		featuredImage: null,
		isPublic: true,
		isFavorite: false,
		totalImages: 12,
		totalVideos: 3,
		totalSize: 25165824,
		lastImageAddedAt: new Date(),
		lastVideoAddedAt: new Date(),
		parentId: null,
		category: null,
		platform: null,
		price: null,
		network: null,
		tokenId: null,
		url: null,
		alternativeUrl: null,
		editions: null,
		sourceImage: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		stats: {
			imageCount: 12,
			videoCount: 3,
			albumCount: 2,
			tagCount: 8,
			characterCount: 4,
			placeCount: 2,
			worldItemCount: 1,
			conceptCount: 5,
			promptCount: 3,
			noteCount: 2,
			wildcardCount: 0,
			propertyCount: 1,
			groupCount: 0,
		},
	} as AnyEntityWithStats,
];

// Componente de card simple para la lista
const EntityCard = memo<{
	entity: AnyEntityWithStats;
	isSelected: boolean;
	onSelect: (entity: AnyEntityWithStats) => void;
	onToggle: (entity: AnyEntityWithStats) => void;
}>(function EntityCard({ entity, isSelected, onSelect, onToggle }) {
	const getTypeColor = (type: string) => {
		switch (type) {
			case 'image':
				return 'bg-blue-100 text-blue-800';
			case 'video':
				return 'bg-purple-100 text-purple-800';
			case 'folder':
				return 'bg-yellow-100 text-yellow-800';
			case 'collection':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const formatSize = (size?: number) => {
		if (!size) return 'N/A';
		const mb = size / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	return (
		<Card
			className={cn(
				'cursor-pointer transition-all duration-200 hover:shadow-md',
				isSelected && 'ring-2 ring-primary ring-offset-2'
			)}
			onClick={() => onSelect(entity)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm truncate">{'name' in entity ? entity.name : entity.id}</CardTitle>
					<Badge className={cn('text-xs', getTypeColor('entityType' in entity ? entity.entityType : 'unknown'))}>{'entityType' in entity ? entity.entityType : 'unknown'}</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-2 text-xs text-muted-foreground">
					{'size' in entity && entity.size && (
					<div className="flex justify-between">
						<span>Tamaño:</span>
						<span>{formatSize(entity.size)}</span>
					</div>
				)}
					{'stats' in entity && entity.stats && typeof entity.stats === 'object' && 'totalItems' in entity.stats && typeof entity.stats.totalItems === 'number' && (
				<div className="flex justify-between">
					<span>Elementos:</span>
					<span>{entity.stats.totalItems}</span>
				</div>
			)}
					<div className="flex justify-between">
						<span>Creado:</span>
						<span>{'createdAt' in entity ? new Date(entity.createdAt).toLocaleDateString() : 'N/A'}</span>
					</div>
				</div>
				<Separator className="my-2" />
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={(e) => {
							e.stopPropagation();
							onToggle(entity);
						}}
						className="text-xs flex-1"
					>
						{isSelected ? 'Deseleccionar' : 'Seleccionar'}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
});

// Componente principal de demostración
export const DetailsPanelShowcase = memo(function DetailsPanelShowcase() {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const { selectSingle, toggleSelection, clearSelection, updateSelection, handleAction } = useDetailsPanelComplete();

	const handleSelectEntity = useCallback(
		(entity: AnyEntityWithStats) => {
			selectSingle(entity);
			setSelectedIds(new Set([entity.id]));
		},
		[selectSingle]
	);

	const handleToggleEntity = useCallback(
		(entity: AnyEntityWithStats) => {
			toggleSelection(entity);
			setSelectedIds((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(entity.id)) {
					newSet.delete(entity.id);
				} else {
					newSet.add(entity.id);
				}
				return newSet;
			});
		},
		[toggleSelection]
	);

	const handleClearAll = useCallback(() => {
		clearSelection();
		setSelectedIds(new Set());
	}, [clearSelection]);

	const handleSelectAll = useCallback(() => {
		updateSelection(mockEntities);
		setSelectedIds(new Set(mockEntities.map((e) => e.id)));
	}, [updateSelection]);

	return (
		<div className="flex h-screen bg-background">
			{/* Panel izquierdo - Lista de entidades */}
			<div className="flex-1 p-4 overflow-auto">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">Demostración Details Panel</h1>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={handleSelectAll}>
								Seleccionar todo
							</Button>
							<Button variant="outline" size="sm" onClick={handleClearAll}>
								Limpiar selección
							</Button>
						</div>
					</div>

					<div className="text-sm text-muted-foreground">
						<p>Haz clic en cualquier elemento para ver sus detalles en el panel derecho.</p>
						<p>Usa "Seleccionar" para añadir elementos a la selección múltiple.</p>
					</div>

					{selectedIds.size > 0 && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Selección actual</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									{selectedIds.size} elemento{selectedIds.size !== 1 ? 's' : ''} seleccionado
									{selectedIds.size !== 1 ? 's' : ''}
								</p>
							</CardContent>
						</Card>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{mockEntities.map((entity) => (
							<EntityCard
								key={entity.id}
								entity={entity}
								isSelected={selectedIds.has(entity.id)}
								onSelect={handleSelectEntity}
								onToggle={handleToggleEntity}
							/>
						))}
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Funcionalidades implementadas</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div>
									<h4 className="font-medium mb-2">Details Panel:</h4>
									<ul className="space-y-1 text-muted-foreground">
										<li>• Componentes específicos por tipo de entidad</li>
										<li>• Preview interactivo con zoom y controles</li>
										<li>• Toolbar con acciones específicas</li>
										<li>• Metadatos organizados por categorías</li>
										<li>• Selección múltiple con acciones en lote</li>
										<li>• Panel colapsible, expandible y fijable</li>
									</ul>
								</div>
								<div>
									<h4 className="font-medium mb-2">Integración:</h4>
									<ul className="space-y-1 text-muted-foreground">
										<li>• Sincronización automática con selecciones</li>
										<li>• Sistema de acciones extensible</li>
										<li>• Registro de componentes por tipo</li>
										<li>• Hooks de integración reutilizables</li>
										<li>• Compatibilidad con EntityCard</li>
										<li>• Estado persistente del panel</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Panel derecho - Details Panel */}
			<div className="relative">
				<EnhancedDetailsPanel />
			</div>
		</div>
	);
});
