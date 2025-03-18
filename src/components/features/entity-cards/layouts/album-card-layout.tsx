'use client';

import type { AlbumWithStats } from '@/app/actions/albums/album.actions';
import type { AlbumFormData } from '@/components/features/entity-cards/layouts/forms/entity-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Album as AlbumIcon, Calendar, Images, PencilIcon, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { VisualizationConfig } from '../config/visualization-config';
import { EntityCardLayerWrapper } from '../entity-card-layer-wrapper';
import type { BaseCardRarityConfig, BaseCardTextureConfig, CardOptions } from '../types';
import { generateRarityConfig } from '../utils/rarity-utils';

// Asegurar que ambos tipos tienen las propiedades necesarias
export type CardData =
	| (AlbumWithStats & {
			_count?: { images: number };
			totalSize?: number;
			coverImage?: string;
			recentImages?: string[];
			rating?: number; // Hacemos rating opcional
	  })
	| AlbumFormData;

export interface AlbumCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (id: string, e?: React.MouseEvent) => void;
	onDelete?: (id: string) => void;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
	showVisualizationConfig?: boolean;
	options?: Partial<CardOptions>;
	rarity?: BaseCardRarityConfig | null;
	texture?: BaseCardTextureConfig | null;
}

const DEFAULT_ALBUM_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño específico para álbumes
	designSystem: {
		preset: 'album',
		variant: 'default',
		aspectRatio: '3/4',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: '59, 130, 246', // Un tono azul
	secondaryColor: '96, 165, 250', // Un tono azul claro

	// Opciones de efectos
	holographicOptions: {
		patternType: 'linear',
		intensity: 0.5,
		animationSpeed: 1,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 15,
		blurAmount: 10,
		animationType: 'pulse',
		pulseSpeed: 1.5,
		visibleOnHover: true,
	},

	borderOptions: {
		width: 2,
		pattern: 'solid',
		animationType: 'pulse',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.6,
	},

	grainOptions: {
		intensity: 0.12,
		density: 0.5,
		contrast: 1.1,
		noise: 'light',
		animated: false,
		visibleOnHover: true,
	},
};

export function AlbumCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualizationConfig = false,
	options,
	rarity,
	texture,
}: AlbumCardProps) {
	// Verificar si data existe y tiene las propiedades necesarias
	if (!data) {
		console.warn('AlbumCard: Se recibió un objeto data indefinido');
		// Crear un data por defecto para evitar errores
		data = {
			id: 'placeholder',
			name: 'Álbum sin nombre',
			description: 'Sin descripción',
			createdAt: new Date(),
			updatedAt: new Date(),
			_count: { images: 0 },
		} as CardData;
	}

	const [configOpen, setConfigOpen] = React.useState(false);
	const [cardOptions, setCardOptions] = React.useState<Partial<CardOptions>>(
		options || {
			...DEFAULT_ALBUM_OPTIONS,
		}
	);

	// Para componente preview, detectar cambios y animar
	const prevDataRef = useRef<CardData | null>(null);

	// Calcular la configuración de rareza basada en los datos
	const rarityConfig = useMemo<BaseCardRarityConfig>(() => {
		// Si se proporciona una configuración de rareza, usarla
		if (rarity) {
			return rarity;
		}

		// Calcular rareza basada en el número de imágenes
		if ('_count' in data && data._count) {
			const imageCount = data._count.images || 0;

			// Determinar rareza según el número de imágenes
			if (imageCount > 100) {
				return generateRarityConfig('legendary', '#3b82f6');
			}
			if (imageCount > 50) {
				return generateRarityConfig('rare', '#3b82f6');
			}
			if (imageCount > 10) {
				return generateRarityConfig('uncommon', '#3b82f6');
			}
			return generateRarityConfig('common', '#3b82f6');
		}

		// Para formularios o datos sin estadísticas
		return generateRarityConfig('common', '#3b82f6');
	}, [data, rarity]);

	// Para modo preview, animar cambios
	useEffect(() => {
		if (!isPreview) {
			return;
		}

		if (!prevDataRef.current) {
			prevDataRef.current = { ...data };
			return;
		}

		const prevData = prevDataRef.current;
		const hasChanged =
			('name' in prevData && 'name' in data && prevData.name !== data.name) ||
			('emoji' in prevData && 'emoji' in data && prevData.emoji !== data.emoji) ||
			('color' in prevData && 'color' in data && prevData.color !== data.color);

		if (hasChanged) {
			prevDataRef.current = { ...data };
		}
	}, [data, isPreview]);

	// Obtener la fecha de creación (si existe)
	const createdAt = 'createdAt' in data && data.createdAt ? new Date(data.createdAt) : null;

	// Obtener la URL de la imagen de portada
	const coverImageUrl = 'coverImage' in data && data.coverImage ? data.coverImage : null;

	// Crear funciones de manejo de eventos fuera del JSX
	const handleEdit = onEdit
		? (e: React.MouseEvent<HTMLButtonElement>) => {
				e.stopPropagation();
				if (data.id) onEdit(data.id as string, e);
			}
		: undefined;

	const handleDelete = onDelete
		? (e: React.MouseEvent<HTMLButtonElement>) => {
				e.stopPropagation();
				if (data.id) onDelete(data.id as string);
			}
		: undefined;

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					isOpen={configOpen}
					onClose={() => setConfigOpen(false)}
					options={cardOptions}
					onOptionsChange={(newOptions: Partial<CardOptions>) => setCardOptions(newOptions)}
					entityId={data.id as string}
					entityType="album"
				/>
			)}

			<div className={cn('min-h-[250px] relative', className)}>
				<EntityCardLayerWrapper
					title={data.name || 'Álbum'}
					description={data.description || 'Descripción del álbum'}
					onClick={onClick}
					showVisualConfig={showVisualizationConfig}
					visualOptions={{
						...cardOptions,
						rarityConfig: rarityConfig,
						textureConfig: texture || undefined,
					}}
					entityType="album"
					entityId={data.id}
				/>
				<div className="p-4 flex flex-col h-full relative z-20 pointer-events-none">
					{coverImageUrl && (
						<div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
							<Image
								src={coverImageUrl}
								alt={data.name || 'Álbum'}
								fill
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								className="object-cover"
								priority={false}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
						</div>
					)}

					<div className="flex flex-col mt-auto">
						<div className="flex items-center gap-2 mb-2">
							<AlbumIcon className="w-4 h-4 text-muted-foreground" />
							<h3 className="text-lg font-semibold truncate">{data.name || 'Álbum'}</h3>
						</div>

						<div className={cn('text-sm text-muted-foreground')}>
							<div className="flex items-center gap-2 mb-1">
								<Calendar className="w-3.5 h-3.5" />
								{createdAt && <span>{createdAt.toLocaleDateString()}</span>}
							</div>

							<div className="flex items-center gap-2 mb-1">
								<Images className="w-3.5 h-3.5" />
								<span>{'_count' in data && data._count ? data._count.images : 0} imágenes</span>
							</div>

							<div className="flex items-center gap-2">
								<Star className="w-3.5 h-3.5" />
								<span>{data.rating || 0}/5</span>
							</div>
						</div>

						{!isPreview && (
							<div className="mt-3 flex gap-2 pointer-events-auto">
								{onEdit && (
									<Button size="sm" variant="outline" onClick={handleEdit}>
										<PencilIcon className="h-3.5 w-3.5 mr-1" /> Editar
									</Button>
								)}
								{onDelete && (
									<Button size="sm" variant="outline" onClick={handleDelete}>
										<Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
									</Button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
