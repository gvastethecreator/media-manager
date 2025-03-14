'use client';

import { cn } from '@/lib/utils';
import { SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { EntityTypeIcon } from './entity-type-icon';
import type { CardOptions } from './types/shared-card-types';
import { Card3D } from './ui/card-3d';

export interface EntityCardWrapperProps {
	title?: string;
	description?: string;
	entityType: string;
	entityId?: string;
	visualOptions?: Partial<CardOptions>;
	options?: any; // Cambiado a any para evitar problemas de compatibilidad entre sistemas de tipos
	children: ReactNode;
	onConfigClick?: () => void;
	onClick?: () => void;
	className?: string;
	// Propiedades para visualización de configuración
	showVisualizationConfig?: boolean;
	onVisualizationConfigClick?: () => void;
	// Propiedades para vista explode
	enableExplode?: boolean;
	explodeLayers?: Array<{
		id: string;
		label: string;
		icon: React.ReactNode;
	}>;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
}

export function EntityCardWrapper({
	title,
	description,
	entityType,
	entityId = 'default',
	visualOptions,
	options,
	children,
	onConfigClick,
	onClick,
	className,
	showVisualizationConfig,
	onVisualizationConfigClick,
	enableExplode,
	explodeLayers,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
}: EntityCardWrapperProps) {
	const titleId = `card-title-${entityId}`;
	const descriptionId = `card-description-${entityId}`;

	// Usar options o visualOptions (para compatibilidad)
	const cardOptions = options || visualOptions;

	return (
		<Card3D
			options={cardOptions}
			className={cn('h-full w-full overflow-hidden', className)}
			aria-labelledby={title ? titleId : undefined}
			aria-describedby={description ? descriptionId : undefined}
			onClick={onClick}
		>
			{children}

			{/* Botón de Configuración */}
			{(onConfigClick || onVisualizationConfigClick) && (
				<motion.button
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					onClick={(e) => {
						e.stopPropagation();
						if (onConfigClick) onConfigClick();
						if (onVisualizationConfigClick) onVisualizationConfigClick();
					}}
					className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-[--black]/30 text-[--white] transition-colors hover:bg-[--primary]"
					aria-label="Configurar visualización"
				>
					<SettingsIcon className="h-3.5 w-3.5" />
				</motion.button>
			)}

			{/* Indicador de tipo de entidad */}
			<div className="absolute left-2 top-2 z-50">
				<EntityTypeIcon type={entityType} size="sm" />
			</div>
		</Card3D>
	);
}
