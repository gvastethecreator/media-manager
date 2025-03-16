'use client';

import { EntityCard } from '@/components/features/entity-cards/entity-card';
import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/types/base-card-types';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

// Datos de ejemplo para diferentes tipos de entidades
const SAMPLE_DATA = {
	'card-album': {
		title: 'Álbum de ejemplo',
		description: 'Este es un álbum de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=300&h=300&auto=format&fit=crop',
		images: [
			{ url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=300&h=300&auto=format&fit=crop' },
			{ url: 'https://images.unsplash.com/photo-1579762593175-20226054cad0?q=80&w=300&h=300&auto=format&fit=crop' },
			{ url: 'https://images.unsplash.com/photo-1579762593131-b8945254345c?q=80&w=300&h=300&auto=format&fit=crop' },
			{ url: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?q=80&w=300&h=300&auto=format&fit=crop' },
		],
	},
	'card-collection': {
		title: 'Colección de ejemplo',
		description: 'Esta es una colección de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1579762593131-b8945254345c?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-tag': {
		title: 'Etiqueta de ejemplo',
		description: 'Esta es una etiqueta de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-folder': {
		title: 'Carpeta de ejemplo',
		description: 'Esta es una carpeta de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-character': {
		title: 'Personaje de ejemplo',
		description: 'Este es un personaje de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-world-item': {
		title: 'Objeto de ejemplo',
		description: 'Este es un objeto de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-place': {
		title: 'Lugar de ejemplo',
		description: 'Este es un lugar de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-concept': {
		title: 'Concepto de ejemplo',
		description: 'Este es un concepto de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-prompt': {
		title: 'Prompt de ejemplo',
		description: 'Este es un prompt de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=300&h=300&auto=format&fit=crop',
	},
	'card-note': {
		title: 'Nota de ejemplo',
		description: 'Esta es una nota de demostración para la vista previa',
		image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=300&h=300&auto=format&fit=crop',
	},
};

// Interfaz para las props del componente
interface EntityCardPreviewProps {
	cardOptions: CardOptions;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	entityType?: string;
	className?: string;
}

/**
 * Componente para previsualizar una tarjeta de entidad con datos de ejemplo
 */
export function EntityCardPreview({
	cardOptions,
	rarity,
	texture,
	entityType = 'card-album',
	className,
}: EntityCardPreviewProps) {
	// Obtener datos de ejemplo según el tipo de entidad
	const sampleData = SAMPLE_DATA[entityType as keyof typeof SAMPLE_DATA] || SAMPLE_DATA['card-album'];

	// Combinar opciones con datos de ejemplo
	const combinedOptions: CardOptions = {
		...cardOptions,
		entityType,
		rarityConfig: rarity || undefined,
		textureConfig: texture || undefined,
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			className={cn('w-full max-w-[300px] aspect-[7/10]', className)}
		>
			<EntityCard
				id="preview-card"
				className="w-full h-full"
				options={combinedOptions}
				title={sampleData.title}
				description={sampleData.description}
				image={sampleData.images || sampleData.image}
				imageLayout={cardOptions.imageGridLayout || 'single'}
				imageStyle={cardOptions.imageGridStyle || 'standard'}
				enableLayers={true}
				enableDesign={true}
				enableAnimation={true}
				enableBackside={cardOptions.backside?.enabled || false}
			/>
		</motion.div>
	);
}
