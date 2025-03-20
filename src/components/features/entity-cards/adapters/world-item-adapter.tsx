'use client';

import type { WorldItem } from '@/types/entities/world-items';
import { usePreset } from '../hooks/use-preset';
import { WorldItemCard } from '../layouts/world-item-card-layout';
import type { CardOptions } from '../types/unified-card-types';

/**
 * Adaptador específico para transformar WorldItem a las props esperadas por WorldItemCard
 */

// Tipo para worldItem con presetId opcional
interface WorldItemWithPreset extends WorldItem {
	presetId?: string | null;
}

export interface WorldItemAdapterProps {
	worldItem: WorldItem;
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
	onEdit?: (item: WorldItem) => void;
	onDelete?: (id: string) => void;
}

export function WorldItemAdapter({
	worldItem,
	options = {},
	onClick,
	showVisualConfig = false,
	onVisualConfigClick,
	enableExplode = false,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
	className,
	onEdit,
	onDelete,
}: WorldItemAdapterProps) {
	// Usar el hook para obtener configuración de preset si existe
	const { cardOptions } = usePreset({
		entityType: 'worldItem',
		entityId: worldItem.id,
		presetId: 'presetId' in worldItem ? (worldItem as WorldItemWithPreset).presetId : null,
		baseOptions: options,
	});

	// Transformar props para WorldItemCard
	const adaptedWorldItem = {
		...worldItem,
		image: worldItem.featuredImage || worldItem.image,
		isArtifact: worldItem.rarity === 'artifact' || worldItem.type === 'artifact',
		isUnique: worldItem.isUnique || worldItem.rarity === 'legendary' || worldItem.unique === true,
		properties: Array.isArray(worldItem.properties) ? worldItem.properties :
			typeof worldItem.properties === 'string' ?
				(worldItem.properties ? JSON.parse(worldItem.properties) : []) :
				[]
	};

	// Pasamos las propiedades comunes y transformadas al componente
	return (
		<WorldItemCard
			item={adaptedWorldItem}
			options={cardOptions}
			onClick={onClick}
			showVisualConfig={showVisualConfig}
			onVisualConfigClick={onVisualConfigClick}
			enableExplode={enableExplode}
			isExploded={isExploded}
			activeLayer={activeLayer}
			onExplodedChange={onExplodedChange}
			onActiveLayerChange={onActiveLayerChange}
			className={className}
			onEdit={onEdit ? () => onEdit(worldItem) : undefined}
			onDelete={onDelete}
		/>
	);
}