'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CardContent } from '../card-content';
import type { LayerComponentProps } from '../layer-plugin-system';

/**
 * Props para el componente ContentLayerComponent
 */
export interface ContentLayerConfig {
	enabled: boolean;
	layerIndex: number;
	padding: number;
	layout: 'standard' | 'grid' | 'masonry' | 'carousel';
	spacing: number;
	alignment: 'left' | 'center' | 'right';
}

/**
 * Componente para la capa de contenido
 * Muestra el contenido principal de la entidad con diferentes layouts y estilos
 */
export function ContentLayerComponent({
	entity,
	config,
	cardOptions,
	children,
}: LayerComponentProps<ContentLayerConfig>) {
	if (!config.enabled) {
		return null;
	}

	// Función para obtener las clases de layout
	const getLayoutClasses = () => {
		switch (config.layout) {
			case 'grid':
				return 'grid grid-cols-2 gap-4';
			case 'masonry':
				return 'columns-2 gap-4';
			case 'carousel':
				return 'flex overflow-x-auto gap-4';
			default:
				return 'flex flex-col';
		}
	};

	// Función para obtener las clases de alineación
	const getAlignmentClasses = () => {
		switch (config.alignment) {
			case 'left':
				return 'items-start text-left';
			case 'right':
				return 'items-end text-right';
			default:
				return 'items-center text-center';
		}
	};

	return (
		<motion.div
			className={cn(
				'card-content relative',
				getLayoutClasses(),
				getAlignmentClasses(),
				`p-${config.padding / 4}`, // Convertimos el padding a clases de Tailwind
				`space-y-${config.spacing / 4}`, // Convertimos el spacing a clases de Tailwind
			)}
			style={{
				zIndex: config.layerIndex,
			}}
		>
			{/* Si hay hijos, renderizarlos directamente */}
			{children || (
				<CardContent options={cardOptions} className="w-full">
					{/* Contenido predeterminado */}
					<div className="card-title font-medium mb-2">{entity?.title || 'Sin título'}</div>
					<div className="card-description text-sm text-muted-foreground">
						{entity?.description || 'Sin descripción'}
					</div>
				</CardContent>
			)}
		</motion.div>
	);
}