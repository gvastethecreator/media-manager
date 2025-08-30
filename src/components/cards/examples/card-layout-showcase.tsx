/**
 * @file Showcase de layouts de cards
 * @module	{
		id: 'folder-1',
		name: 'Documentos/Trabajo',
		entityType: 'folder',
		createdAt: new Date(),
		updatedAt: new Date(),
		path: '/home/user/documents/trabajo',
		type: 'folder',
		stats: {
			folderCount: 5,
			totalSize: 1024000,
			totalItems: 75
		},rds/examples/card-layout-showcase
 * @description Demuestra los diferentes layouts y variantes disponibles para las cards
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { EntityCard } from '../entity-card';
import type { CardLayout, CardSize, CardVariant } from '../types/card-layout.types';
import { LAYOUT_PRESETS } from '../types/card-layout.types';

// Mock data para demostración
const mockEntities: AnyEntityWithStats[] = [
	{
		id: '1',
		name: 'Paisaje montañoso',
		entityType: 'image',
		description: 'Una imagen de paisaje montañoso',
		createdAt: new Date(),
		updatedAt: new Date(),
		path: '/uploads/landscape.jpg',
		hash: 'abc123def456',
		size: 1_024_000,
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
		thumbnailUrl: '/uploads/landscape-thumb.jpg',
		fullUrl: '/uploads/landscape.jpg',
		stats: {
			// Conteos de relaciones base
			imageCount: 0,
			videoCount: 0,
			albumCount: 2,
			collectionCount: 1,
			tagCount: 3,
			characterCount: 0,
			placeCount: 1,
			worldItemCount: 0,
			conceptCount: 2,
			promptCount: 1,
			noteCount: 1,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			// Métricas globales
			totalItems: 1,
			totalAssociations: 10,
			// Timestamps
			lastUpdated: new Date(),
			// Métricas de uso
			viewCount: 10,
			downloadCount: 2,
			likeCount: 5,
			commentCount: 1,
			// Propiedades del sistema de archivos
			size: 1_024_000,
			mtime: new Date(),
			birthtime: new Date(),
			type: 'image',
			// Propiedades específicas de imagen
			aspectRatio: 1920 / 1080,
			lastViewedAt: new Date(),
			lastDownloadedAt: new Date(),
			lastLikedAt: new Date(),
			lastCommentedAt: new Date(),
		},
	} as AnyEntityWithStats,
	{
		id: '2',
		name: 'Mi colección favorita',
		entityType: 'collection',
		description: 'Una colección de mis imágenes favoritas',
		emoji: '📸',
		color: '#3b82f6',
		featuredImage: null,

		isFavorite: false,
		parentId: null,
		category: 'personal',
		platform: 'local',
		price: null,
		network: null,
		tokenId: null,
		url: null,
		alternativeUrl: null,
		editions: null,
		sourceImage: null,
		totalImages: 18,
		totalVideos: 2,
		totalSize: 15_728_640,
		lastImageAddedAt: new Date(),
		lastVideoAddedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		stats: {
			// Conteos de relaciones base
			imageCount: 18,
			videoCount: 2,
			albumCount: 2,
			collectionCount: 0,
			tagCount: 5,
			characterCount: 3,
			placeCount: 2,
			worldItemCount: 1,
			conceptCount: 4,
			promptCount: 2,
			noteCount: 1,
			wildcardCount: 0,
			propertyCount: 1,
			groupCount: 0,
			// Métricas globales
			totalItems: 20,
			totalAssociations: 33,
			// Timestamps
			lastUpdated: new Date(),
			// Propiedades del sistema de archivos
			size: 15_728_640,
			mtime: new Date(),
			birthtime: new Date(),
			type: 'collection',
		},
	} as AnyEntityWithStats,
	{
		id: '3',
		name: 'Documentos/Trabajo',
		entityType: 'folder',
		description: 'Carpeta de documentos de trabajo',
		emoji: '📁',
		color: '#10B981',
		featuredImage: null,
		isFavorite: false,
		path: '/home/user/documents/trabajo',
		totalFiles: 78,
		totalSize: 52_428_800,
		autoReindex: true,
		lastIndexed: new Date(),
		parentId: null,
		presetId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		stats: {
			// Conteos de relaciones base
			imageCount: 75,
			videoCount: 3,
			albumCount: 0,
			collectionCount: 0,
			tagCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			// Métricas globales
			totalItems: 78,
			totalAssociations: 78,
			// Timestamps
			lastUpdated: new Date(),
			// Propiedades del sistema de archivos
			size: 52_428_800,
			mtime: new Date(),
			birthtime: new Date(),
			type: 'folder',
			// Propiedades específicas de carpeta
			hierarchyDepth: 2,
			totalDescendants: 5,
			directChildren: 2,
			contentDiversity: 0.8,
			organizationScore: 0.9,
			folderCount: 2,
			totalFolders: 2,
			totalImages: 75,
			totalVideos: 3,
			totalDocuments: 0,
			totalFiles: 78,
			accessFrequency: 15,
			lastActivity: new Date(),
			documentCount: 0,
			totalAudio: 0,
			totalOthers: 0,
			formattedSize: '50 MB',
			totalSize: 52_428_800,
			averageFileSize: 672_164,
			largestFile: 5_242_880,
			hasConsistentNaming: true,
			hasDeepHierarchy: false,
			isWellOrganized: true,
			breadcrumbs: [{ id: '3', name: 'Documentos/Trabajo', path: '/home/user/documents/trabajo' }],
			fullPath: '/home/user/documents/trabajo',
			relativePath: 'documents/trabajo',
			autoTags: ['work', 'documents'],
			qualityGrade: 'A' as const,
			totalRelations: 0,
			lastScanned: new Date().toISOString(),
			recentImages: [],
		},
	} as AnyEntityWithStats,
];

const layouts: CardLayout[] = ['minimal', 'compact', 'complete', 'horizontal', 'vertical', 'list', 'grid', 'masonry'];
const variants: CardVariant[] = ['default', 'minimal', 'elevated', 'outlined', 'tcg', 'polaroid', 'glass'];
const sizes: CardSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'auto'];

interface CardLayoutShowcaseProps {
	className?: string;
}

export function CardLayoutShowcase({ className }: CardLayoutShowcaseProps) {
	const [selectedLayout, setSelectedLayout] = useState<CardLayout>('complete');
	const [selectedVariant, setSelectedVariant] = useState<CardVariant>('default');
	const [selectedSize, setSelectedSize] = useState<CardSize>('md');
	const [selectedPreset, setSelectedPreset] = useState<string>('');

	return (
		<div className={cn('space-y-8 p-6', className)}>
			<div className="space-y-4">
				<h2 className="font-bold text-2xl">Sistema de Layouts para Cards</h2>
				<p className="text-muted-foreground">
					Explora los diferentes layouts, variantes y tamaños disponibles para las cards.
				</p>
			</div>

			{/* Controles */}
			<div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-4">
				{/* Layout */}
				<div className="space-y-2">
					<label className="font-medium text-sm" htmlFor="layout-select">
						Layout
					</label>
					<select
						className="w-full rounded border p-2"
						id="layout-select"
						onChange={(e) => setSelectedLayout(e.target.value as CardLayout)}
						value={selectedLayout}
					>
						{layouts.map((layout) => (
							<option key={layout} value={layout}>
								{layout}
							</option>
						))}
					</select>
				</div>

				{/* Variante */}
				<div className="space-y-2">
					<label className="font-medium text-sm" htmlFor="variant-select">
						Variante
					</label>
					<select
						className="w-full rounded border p-2"
						id="variant-select"
						onChange={(e) => setSelectedVariant(e.target.value as CardVariant)}
						value={selectedVariant}
					>
						{variants.map((variant) => (
							<option key={variant} value={variant}>
								{variant}
							</option>
						))}
					</select>
				</div>

				{/* Tamaño */}
				<div className="space-y-2">
					<label className="font-medium text-sm" htmlFor="size-select">
						Tamaño
					</label>
					<select
						className="w-full rounded border p-2"
						id="size-select"
						onChange={(e) => setSelectedSize(e.target.value as CardSize)}
						value={selectedSize}
					>
						{sizes.map((size) => (
							<option key={size} value={size}>
								{size}
							</option>
						))}
					</select>
				</div>

				{/* Preset */}
				<div className="space-y-2">
					<label className="font-medium text-sm" htmlFor="preset-select">
						Preset
					</label>
					<select
						className="w-full rounded border p-2"
						id="preset-select"
						onChange={(e) => setSelectedPreset(e.target.value)}
						value={selectedPreset}
					>
						<option value="">Sin preset</option>
						{Object.keys(LAYOUT_PRESETS).map((preset) => (
							<option key={preset} value={preset}>
								{preset}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Vista previa de configuración actual */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Vista Previa - Configuración Actual</h3>
				<div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
					{mockEntities.map((entity) => (
						<EntityCard
							entity={entity}
							key={entity.id}
							layout={selectedLayout}
							onClick={() => console.log('Clicked:', entity.name || entity.id)}
							onDoubleClick={() => console.log('Double clicked:', entity.name || entity.id)}
							preset={selectedPreset || undefined}
							size={selectedSize}
							variant={selectedVariant}
						/>
					))}
				</div>
			</div>

			{/* Presets predefinidos */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Presets Predefinidos</h3>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{Object.entries(LAYOUT_PRESETS).map(([presetName, config]) => (
						<div className="space-y-3" key={presetName}>
							<div className="flex items-center justify-between">
								<h4 className="font-medium">{presetName}</h4>
								<button
									className="rounded bg-primary px-2 py-1 text-primary-foreground text-xs"
									onClick={() => {
										setSelectedLayout(config.layout);
										setSelectedVariant(config.variant);
										setSelectedSize(config.size);
										setSelectedPreset(presetName);
									}}
									type="button"
								>
									Aplicar
								</button>
							</div>
							<div className="space-y-1 text-muted-foreground text-xs">
								<div>Layout: {config.layout}</div>
								<div>Variante: {config.variant}</div>
								<div>Tamaño: {config.size}</div>
								<div>Densidad: {config.density}</div>
							</div>
							<div className="grid grid-cols-3 gap-2">
								{mockEntities.map((entity) => (
									<EntityCard
										className="origin-top-left scale-75"
										entity={entity}
										key={`${presetName}-${entity.id}`}
										preset={presetName}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Comparación de layouts */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Comparación de Layouts</h3>
				<div className="space-y-6">
					{layouts.map((layout) => (
						<div className="space-y-2" key={layout}>
							<h4 className="font-medium capitalize">{layout}</h4>
							<div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
								{mockEntities.map((entity) => (
									<EntityCard
										entity={entity}
										key={`${layout}-${entity.id}`}
										layout={layout}
										size="md"
										variant="default"
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Comparación de variantes */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Comparación de Variantes</h3>
				<div className="space-y-6">
					{variants.map((variant) => (
						<div className="space-y-2" key={variant}>
							<h4 className="font-medium capitalize">{variant}</h4>
							<div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
								{mockEntities.map((entity) => (
									<EntityCard
										entity={entity}
										key={`${variant}-${entity.id}`}
										layout="complete"
										size="md"
										variant={variant}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Casos de uso recomendados */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Casos de Uso Recomendados</h3>
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2 rounded-lg border p-4">
							<h4 className="font-medium">File Browser - Vista Grid</h4>
							<p className="text-muted-foreground text-sm">
								Layout vertical con información esencial para navegación rápida
							</p>
							<div className="grid grid-cols-3 gap-2">
								{mockEntities.map((entity) => (
									<EntityCard entity={entity} key={`grid-${entity.id}`} preset="file-browser-grid" />
								))}
							</div>
						</div>

						<div className="space-y-2 rounded-lg border p-4">
							<h4 className="font-medium">File Browser - Vista Lista</h4>
							<p className="text-muted-foreground text-sm">Layout horizontal compacto para listas de archivos</p>
							<div className="space-y-2">
								{mockEntities.map((entity) => (
									<EntityCard entity={entity} key={`list-${entity.id}`} preset="file-browser-list" />
								))}
							</div>
						</div>

						<div className="space-y-2 rounded-lg border p-4">
							<h4 className="font-medium">Dashboard</h4>
							<p className="text-muted-foreground text-sm">Layout completo con toda la información disponible</p>
							<div className="grid grid-cols-2 gap-2">
								{mockEntities.slice(0, 2).map((entity) => (
									<EntityCard entity={entity} key={`dashboard-${entity.id}`} preset="dashboard" />
								))}
							</div>
						</div>

						<div className="space-y-2 rounded-lg border p-4">
							<h4 className="font-medium">TCG Mode</h4>
							<p className="text-muted-foreground text-sm">Estilo Trading Card Game para una experiencia inmersiva</p>
							<div className="grid grid-cols-2 gap-2">
								{mockEntities.slice(0, 2).map((entity) => (
									<EntityCard entity={entity} key={`tcg-${entity.id}`} preset="tcg-mode" />
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
