'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Character } from '../layouts/forms/entity-types';
import { CharacterCard as CharacterCardLayout, type CharacterCardProps } from './character-card-layout';

// Interfaz para las propiedades del componente CharacterCard
export interface CharacterCardAdapterProps extends BaseCardAdapterProps {
	character: Character;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente CharacterCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const CharacterCard = createCustomCardAdapter<Character, CharacterCardProps, 'character'>(
	CharacterCardLayout,
	'character',
	(props: CharacterCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por CharacterCardLayout
		return {
			character: props.character,
			isPreview: false,
			onEdit: props.onEdit,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualConfig: props.showVisualConfig,
			options: props.options,
			enableExplode: props.enableExplode,
			isExploded: props.isExploded,
			activeLayer: props.activeLayer,
			onExplodedChange: props.onExplodedChange,
			onActiveLayerChange: props.onActiveLayerChange
		};
	}
);
