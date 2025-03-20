'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CardMetadata } from '../card-metadata';
import type { LayerComponentProps } from '../layer-plugin-system';

/**
 * Props para el componente MetadataLayerComponent
 */
export interface MetadataLayerConfig {
	enabled: boolean;
	layerIndex: number;
	showRarity: boolean;
	showType: boolean;
	showLevel: boolean;
	showClass: boolean;
	showAlignment: boolean;
	showRace: boolean;
	showCustomFields: boolean;
	fontSize: 'xs' | 'sm' | 'base' | 'lg';
	position: 'top' | 'bottom' | 'left' | 'right';
	layout: 'grid' | 'list' | 'inline';
	opacity: number;
}

/**
 * Componente para la capa de metadatos
 * Muestra metadatos relevantes de la entidad con diferentes layouts y estilos
 */
export function MetadataLayerComponent({
	entity,
	config,
	cardOptions,
}: LayerComponentProps<MetadataLayerConfig>) {
	if (!config.enabled) {
		return null;
	}

	// Filtrar los metadatos según la configuración
	const filterMetadata = () => {
		const metadata: Record<string, string | number | undefined> = {};

		if (entity) {
			if (config.showRarity && entity.rarity) metadata.rarity = entity.rarity;
			if (config.showType && entity.type) metadata.type = entity.type;
			if (config.showLevel && entity.level) metadata.level = entity.level;
			if (config.showClass && entity.class) metadata.class = entity.class;
			if (config.showAlignment && entity.alignment) metadata.alignment = entity.alignment;
			if (config.showRace && entity.race) metadata.race = entity.race;

			// Añadir campos personalizados si están habilitados
			if (config.showCustomFields && entity.metadata) {
				for (const [key, value] of Object.entries(entity.metadata)) {
					if (!['rarity', 'type', 'level', 'class', 'alignment', 'race'].includes(key)) {
						metadata[key] = value;
					}
				}
			}
		}

		return metadata;
	};

	// Determinar las clases según la posición
	const getPositionClasses = () => {
		switch (config.position) {
			case 'top': return 'top-0 left-0 right-0';
			case 'bottom': return 'bottom-0 left-0 right-0';
			case 'left': return 'left-0 top-0 bottom-0';
			case 'right': return 'right-0 top-0 bottom-0';
			default: return 'bottom-0 left-0 right-0';
		}
	};

	// Determinar las clases según el layout
	const getLayoutClasses = () => {
		switch (config.layout) {
			case 'grid': return 'grid grid-cols-2 gap-2';
			case 'list': return 'flex flex-col space-y-1';
			case 'inline': return 'flex flex-wrap gap-2';
			default: return 'grid grid-cols-2 gap-2';
		}
	};

	return (
		<motion.div
			className={cn(
				'card-metadata absolute',
				getPositionClasses(),
				'bg-black/50 backdrop-blur-sm p-2',
				config.position === 'left' || config.position === 'right' ? 'w-1/4' : 'w-full',
			)}
			style={{
				zIndex: config.layerIndex,
				opacity: config.opacity / 100,
			}}
			initial={{ opacity: 0 }}
			animate={{ opacity: config.opacity / 100 }}
			transition={{ duration: 0.3 }}
		>
			<div className={cn(
				getLayoutClasses(),
				`text-${config.fontSize}`,
				'text-white'
			)}>
				<CardMetadata
					options={cardOptions}
					metadata={filterMetadata()}
					className={cn(
						'w-full'
					)}
				/>
			</div>
		</motion.div>
	);
}