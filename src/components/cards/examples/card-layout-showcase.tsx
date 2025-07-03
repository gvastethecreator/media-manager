/**
 * @file Showcase de layouts de cards
 * @module components/cards/examples/card-layout-showcase
 * @description Demuestra los diferentes layouts y variantes disponibles para las cards
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { EntityCard } from '../entity-card';
import type { CardLayout, CardVariant, CardSize } from '../types/card-layout.types';
import { LAYOUT_PRESETS } from '../types/card-layout.types';
import type { EntityWithStats } from '@/types/migration';

// Mock data para demostración
const mockEntities: EntityWithStats[] = [
	{
		id: '1',
		name: 'Paisaje montañoso',
		entityType: 'image',
		createdAt: new Date(),
		updatedAt: new Date(),
		path: '/uploads/landscape.jpg',
		thumbnailUrl: '/uploads/landscape-thumb.jpg',
		metadata: { format: 'JPG', width: 1920, height: 1080 },
		_count: { tags: 3, albums: 2, collections: 1 },
		tags: [{ id: '1', name: 'naturaleza', color: '#22c55e' }],
	},
	{
		id: '2',
		name: 'Mi colección favorita',
		entityType: 'collection',
		createdAt: new Date(),
		updatedAt: new Date(),
		description: 'Una colección de mis imágenes favoritas',
		_count: { images: 15, videos: 3 },
		color: '#3b82f6',
	},
	{
		id: '3',
		name: 'Documentos/Trabajo',
		entityType: 'folder',
		createdAt: new Date(),
		updatedAt: new Date(),
		path: '/home/user/documents/trabajo',
		_count: { images: 25, files: 50 },
		statistics: { folderCount: 5, totalSize: 1024000 },
	},
] as EntityWithStats[];

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
				<h2 className="text-2xl font-bold">Sistema de Layouts para Cards</h2>
				<p className="text-muted-foreground">
					Explora los diferentes layouts, variantes y tamaños disponibles para las cards.
				</p>
			</div>

			{/* Controles */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
				{/* Layout */}
				<div className="space-y-2">
					<label htmlFor="layout-select" className="text-sm font-medium">Layout</label>
					<select
						id="layout-select"
						value={selectedLayout}
						onChange={(e) => setSelectedLayout(e.target.value as CardLayout)}
						className="w-full p-2 border rounded"
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
					<label htmlFor="variant-select" className="text-sm font-medium">Variante</label>
					<select
						id="variant-select"
						value={selectedVariant}
						onChange={(e) => setSelectedVariant(e.target.value as CardVariant)}
						className="w-full p-2 border rounded"
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
					<label htmlFor="size-select" className="text-sm font-medium">Tamaño</label>
					<select
						id="size-select"
						value={selectedSize}
						onChange={(e) => setSelectedSize(e.target.value as CardSize)}
						className="w-full p-2 border rounded"
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
					<label htmlFor="preset-select" className="text-sm font-medium">Preset</label>
					<select
						id="preset-select"
						value={selectedPreset}
						onChange={(e) => setSelectedPreset(e.target.value)}
						className="w-full p-2 border rounded"
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
				<h3 className="text-lg font-semibold">Vista Previa - Configuración Actual</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
					{mockEntities.map((entity) => (
						<EntityCard
							key={entity.id}
							entity={entity}
							layout={selectedLayout}
							variant={selectedVariant}
							size={selectedSize}
							preset={selectedPreset || undefined}
							onClick={() => console.log('Clicked:', entity.name)}
							onDoubleClick={() => console.log('Double clicked:', entity.name)}
						/>
					))}
				</div>
			</div>

			{/* Presets predefinidos */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Presets Predefinidos</h3>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{Object.entries(LAYOUT_PRESETS).map(([presetName, config]) => (
						<div key={presetName} className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="font-medium">{presetName}</h4>
															<button
								type="button"
								onClick={() => {
									setSelectedLayout(config.layout);
									setSelectedVariant(config.variant);
									setSelectedSize(config.size);
									setSelectedPreset(presetName);
								}}
								className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
							>
									Aplicar
								</button>
							</div>
							<div className="text-xs text-muted-foreground space-y-1">
								<div>Layout: {config.layout}</div>
								<div>Variante: {config.variant}</div>
								<div>Tamaño: {config.size}</div>
								<div>Densidad: {config.density}</div>
							</div>
							<div className="grid grid-cols-3 gap-2">
								{mockEntities.map((entity) => (
									<EntityCard
										key={`${presetName}-${entity.id}`}
										entity={entity}
										preset={presetName}
										className="scale-75 origin-top-left"
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Comparación de layouts */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Comparación de Layouts</h3>
				<div className="space-y-6">
					{layouts.map((layout) => (
						<div key={layout} className="space-y-2">
							<h4 className="font-medium capitalize">{layout}</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
								{mockEntities.map((entity) => (
									<EntityCard
										key={`${layout}-${entity.id}`}
										entity={entity}
										layout={layout}
										variant="default"
										size="md"
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Comparación de variantes */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Comparación de Variantes</h3>
				<div className="space-y-6">
					{variants.map((variant) => (
						<div key={variant} className="space-y-2">
							<h4 className="font-medium capitalize">{variant}</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
								{mockEntities.map((entity) => (
									<EntityCard
										key={`${variant}-${entity.id}`}
										entity={entity}
										layout="complete"
										variant={variant}
										size="md"
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Casos de uso recomendados */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Casos de Uso Recomendados</h3>
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-4 border rounded-lg space-y-2">
							<h4 className="font-medium">File Browser - Vista Grid</h4>
							<p className="text-sm text-muted-foreground">
								Layout vertical con información esencial para navegación rápida
							</p>
							<div className="grid grid-cols-3 gap-2">
								{mockEntities.map((entity) => (
									<EntityCard
										key={`grid-${entity.id}`}
										entity={entity}
										preset="file-browser-grid"
									/>
								))}
							</div>
						</div>

						<div className="p-4 border rounded-lg space-y-2">
							<h4 className="font-medium">File Browser - Vista Lista</h4>
							<p className="text-sm text-muted-foreground">
								Layout horizontal compacto para listas de archivos
							</p>
							<div className="space-y-2">
								{mockEntities.map((entity) => (
									<EntityCard
										key={`list-${entity.id}`}
										entity={entity}
										preset="file-browser-list"
									/>
								))}
							</div>
						</div>

						<div className="p-4 border rounded-lg space-y-2">
							<h4 className="font-medium">Dashboard</h4>
							<p className="text-sm text-muted-foreground">
								Layout completo con toda la información disponible
							</p>
							<div className="grid grid-cols-2 gap-2">
								{mockEntities.slice(0, 2).map((entity) => (
									<EntityCard
										key={`dashboard-${entity.id}`}
										entity={entity}
										preset="dashboard"
									/>
								))}
							</div>
						</div>

						<div className="p-4 border rounded-lg space-y-2">
							<h4 className="font-medium">TCG Mode</h4>
							<p className="text-sm text-muted-foreground">
								Estilo Trading Card Game para una experiencia inmersiva
							</p>
							<div className="grid grid-cols-2 gap-2">
								{mockEntities.slice(0, 2).map((entity) => (
									<EntityCard
										key={`tcg-${entity.id}`}
										entity={entity}
										preset="tcg-mode"
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}