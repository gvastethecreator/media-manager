/**
 * @file Panel de detalles mejorado con sistema de registro de entidades
 * @module components/panels/details-panel/enhanced-details-panel
 */

import { ChevronDown, ChevronUp, Maximize2, Minimize2, MoreHorizontal, Pin, PinOff, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { AnyEntityWithStats, getEntityStatsType } from '@/types/migration';
import { entityDetailsRegistry } from './entity-details-registry';

// Fallback para cuando no hay configuración específica
const DefaultEntityDetails = memo<{ entity: AnyEntityWithStats; onAction?: (action: string, data?: any) => void }>(
	function DefaultEntityDetails({ entity, onAction }) {
		const entityType = getEntityStatsType(entity);
		if (entityType === null) {
			return (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Tipo de entidad no reconocido</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							No se pudo determinar el tipo de entidad para mostrar los detalles.
						</p>
					</CardContent>
				</Card>
			);
		}

		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Detalles de {entityType}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Nombre:</span>
							<span className="font-medium truncate max-w-[60%]">
								{('name' in entity ? entity.name : undefined) || 'Sin nombre'}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tipo:</span>
							<Badge variant="secondary" className="text-xs">
								{entityType.charAt(0).toUpperCase() + entityType.slice(1)}
							</Badge>
						</div>
						{'createdAt' in entity && entity.createdAt && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Creado:</span>
								<span className="font-medium text-xs">{new Date(entity.createdAt).toLocaleDateString()}</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	}
);

// Componente para mostrar múltiples elementos seleccionados
const MultipleSelectionDetails = memo<{
	entities: AnyEntityWithStats[];
	onAction?: (action: string, data?: any) => void;
}>(function MultipleSelectionDetails({ entities, onAction }) {
	const entityCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const entity of entities) {
			const type = getEntityStatsType(entity);
			if (type === null) continue;
			counts[type] = (counts[type] || 0) + 1;
		}
		return counts;
	}, [entities]);

	const totalSize = useMemo(() => {
		return entities.reduce((acc, entity) => {
			if ('size' in entity && typeof entity.size === 'number') {
				return acc + entity.size;
			}
			return acc;
		}, 0);
	}, [entities]);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Selección múltiple ({entities.length} elementos)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{/* Resumen por tipos */}
						<div className="space-y-2">
							<h4 className="text-xs font-medium text-muted-foreground">Por tipo:</h4>
							{Object.entries(entityCounts).map(([type, count]) => (
								<div key={type} className="flex justify-between text-sm">
									<span className="capitalize">{type}:</span>
									<Badge variant="outline" className="text-xs">
										{count}
									</Badge>
								</div>
							))}
						</div>

						{/* Tamaño total si aplica */}
						{totalSize > 0 && (
							<>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Tamaño total:</span>
									<span className="font-medium">{(totalSize / (1024 * 1024)).toFixed(1)} MB</span>
								</div>
							</>
						)}

						{/* Acciones en lote */}
						<Separator />
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onAction?.('bulk-tag', { entities })}
								className="text-xs"
							>
								Etiquetar todo
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onAction?.('bulk-move', { entities })}
								className="text-xs"
							>
								Mover todo
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onAction?.('bulk-favorite', { entities })}
								className="text-xs"
							>
								Favoritos
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onAction?.('bulk-delete', { entities })}
								className="text-xs text-destructive"
							>
								Eliminar
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});

// Componente principal del panel de detalles mejorado
export const EnhancedDetailsPanel = memo(function EnhancedDetailsPanel() {
	const { isVisible, isFixed, selectedItems, toggleVisibility, toggleFixed, setVisible } = useDetailsPanel();

	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	// Manejar acciones de entidades
	const handleEntityAction = useCallback((action: string, data?: any) => {
		console.log('Entity action:', action, data);

		// Aquí se implementaría la lógica de acciones
		switch (action) {
			case 'view':
				// Abrir vista completa
				break;
			case 'edit':
				// Abrir editor
				break;
			case 'favorite':
				// Toggle favorito
				break;
			case 'delete':
				// Confirmar y eliminar
				break;
			case 'fullscreen':
				// Abrir en pantalla completa
				setIsExpanded(true);
				break;
			default:
				console.log('Acción no implementada:', action);
		}
	}, []);

	// Renderizar contenido principal
	const renderContent = useCallback(() => {
		if (selectedItems.length === 0) {
			return (
				<div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
					Selecciona un elemento para ver sus detalles
				</div>
			);
		}

		if (selectedItems.length > 1) {
			return <MultipleSelectionDetails entities={selectedItems} onAction={handleEntityAction} />;
		}

		const entity = selectedItems[0];
		const entityType = getEntityStatsType(entity);
		const config = entityType ? entityDetailsRegistry.getConfig(entityType) : null;

		if (config) {
			const DetailsComponent = config.detailsComponent;
			return <DetailsComponent entity={entity} isSelected={true} onAction={handleEntityAction} />;
		}

		// Fallback para entidades sin configuración específica
		return <DefaultEntityDetails entity={entity} onAction={handleEntityAction} />;
	}, [selectedItems, handleEntityAction]);

	if (!isVisible) {
		return null;
	}

	return (
		<div
			className={cn(
				'bg-background border-l border-border transition-all duration-200',
				isExpanded ? 'fixed inset-0 z-50 bg-background' : 'w-80',
				isFixed ? 'relative' : 'absolute right-0 top-0 bottom-0'
			)}
		>
			{/* Header del panel */}
			<div className="flex items-center justify-between p-3 border-b border-border">
				<div className="flex items-center gap-2">
					<h2 className="font-semibold text-sm">Detalles</h2>
					{selectedItems.length > 0 && (
						<Badge variant="secondary" className="text-xs">
							{selectedItems.length}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-1">
					{/* Colapsar/expandir */}
					<Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
						{isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
					</Button>

					{/* Expandir/contraer */}
					<Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
						{isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
					</Button>

					{/* Fijar/desfijar */}
					<Button variant="ghost" size="sm" onClick={toggleFixed} className="h-8 w-8 p-0">
						{isFixed ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
					</Button>

					{/* Menú de opciones */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => setIsCollapsed(!isCollapsed)}>
								{isCollapsed ? 'Expandir' : 'Colapsar'}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={toggleFixed}>{isFixed ? 'Desfijar' : 'Fijar'}</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setVisible(false)}>Ocultar panel</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Cerrar */}
					<Button variant="ghost" size="sm" onClick={() => setVisible(false)} className="h-8 w-8 p-0">
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Contenido del panel */}
			{!isCollapsed && (
				<ScrollArea className={cn('flex-1', isExpanded ? 'h-[calc(100vh-4rem)]' : 'h-[calc(100vh-4rem)]')}>
					<div className="p-3">{renderContent()}</div>
				</ScrollArea>
			)}
		</div>
	);
});
