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
import type { EntityWithStats } from '@/types/migration';
import { EnhancedDetailsPanel } from './enhanced-details-panel';
import { useDetailsPanelComplete } from './integration-hook';

// Datos de ejemplo para la demostración
const mockEntities: EntityWithStats[] = [
	{
		id: '1',
		name: 'imagen-ejemplo.jpg',
		entityType: 'image',
		description: 'Una imagen de ejemplo',
		type: 'image',
		createdAt: new Date(),
		updatedAt: new Date(),
		size: 2048576,
		width: 1920,
		height: 1080,
		path: '/images/ejemplo.jpg',
		thumbnailUrl: '/images/ejemplo-thumb.jpg',
		statistics: {
			totalAssociations: 5,
			totalItems: 1,
			aspectRatio: 1.78,
			quality: 'high',
		},
	} as EntityWithStats,
	{
		id: '2',
		name: 'video-demo.mp4',
		entityType: 'video',
		description: 'Un video de demostración',
		type: 'video',
		createdAt: new Date(),
		updatedAt: new Date(),
		size: 15728640,
		width: 1920,
		height: 1080,
		path: '/videos/demo.mp4',
		thumbnailUrl: '/videos/demo-thumb.jpg',
		duration: 120,
		statistics: {
			totalAssociations: 3,
			totalItems: 1,
		},
	} as EntityWithStats,
	{
		id: '3',
		name: 'Documentos',
		entityType: 'folder',
		description: 'Carpeta de documentos',
		type: 'folder',
		createdAt: new Date(),
		updatedAt: new Date(),
		path: '/folders/documentos',
		statistics: {
			totalAssociations: 0,
			totalItems: 25,
		},
	} as EntityWithStats,
	{
		id: '4',
		name: 'Mi Colección',
		entityType: 'collection',
		type: 'collection',
		createdAt: new Date(),
		updatedAt: new Date(),
		description: 'Una colección de ejemplo',
		statistics: {
			totalAssociations: 12,
			totalItems: 8,
		},
	} as EntityWithStats,
];

// Componente de card simple para la lista
const EntityCard = memo<{
	entity: EntityWithStats;
	isSelected: boolean;
	onSelect: (entity: EntityWithStats) => void;
	onToggle: (entity: EntityWithStats) => void;
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
					<CardTitle className="text-sm truncate">{entity.name}</CardTitle>
					<Badge className={cn('text-xs', getTypeColor(entity.type))}>{entity.type}</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-2 text-xs text-muted-foreground">
					{entity.size && (
						<div className="flex justify-between">
							<span>Tamaño:</span>
							<span>{formatSize(entity.size)}</span>
						</div>
					)}
					{entity.statistics?.totalItems !== undefined && (
						<div className="flex justify-between">
							<span>Elementos:</span>
							<span>{entity.statistics.totalItems}</span>
						</div>
					)}
					<div className="flex justify-between">
						<span>Creado:</span>
						<span>{new Date(entity.createdAt).toLocaleDateString()}</span>
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
		(entity: EntityWithStats) => {
			selectSingle(entity);
			setSelectedIds(new Set([entity.id]));
		},
		[selectSingle]
	);

	const handleToggleEntity = useCallback(
		(entity: EntityWithStats) => {
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
