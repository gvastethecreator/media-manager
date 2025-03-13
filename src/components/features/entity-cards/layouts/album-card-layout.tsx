'use client';

import type { AlbumWithStats } from '@/app/actions/albums/album.actions';
import { generateRarityConfig } from '@/components/features/entity-cards/base/card-adapter';
import { EntityCardWrapper } from '@/components/features/entity-cards/base/entity-card-wrapper';
import type { AlbumFormData } from '@/components/features/entity-cards/forms/entity-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { formatBytes, formatDate } from '@/lib/utils/utils';
import { Album as AlbumIcon, Camera, Clock, Image as ImageIcon, PencilIcon, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useMemo, useRef } from 'react';

// Asegurar que ambos tipos tienen las propiedades necesarias
type CardData = AlbumWithStats | AlbumFormData;

interface AlbumCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (album: AlbumWithStats) => void;
	onDelete?: (id: string) => void;
	className?: string;
	showVisualizationConfig?: boolean;
	onClick?: () => void;
	enableExplode?: boolean;
}

// Funciones de ayuda seguras para trabajar con los tipos

// Verificar si una clave existe en un objeto
function hasProperty<T, K extends string>(obj: T, key: K): obj is T & Record<K, unknown> {
	return obj !== null && typeof obj === 'object' && key in obj;
}

// Obtener una propiedad como string con valor por defecto
function getStringProp(obj: CardData, key: string, defaultValue = ''): string {
	if (hasProperty(obj, key) && typeof obj[key] === 'string') {
		return obj[key] as string;
	}
	return defaultValue;
}

// Verificar si es un AlbumWithStats
function isAlbumWithStats(data: CardData): data is AlbumWithStats {
	return hasProperty(data, '_count') && typeof data._count === 'object';
}

function getRandomGradient() {
	const gradients = [
		'from-violet-500/20 to-fuchsia-500/20',
		'from-cyan-500/20 to-blue-500/20',
		'from-pink-500/20 to-rose-500/20',
		'from-amber-500/20 to-orange-500/20',
		'from-lime-500/20 to-emerald-500/20',
		'from-teal-500/20 to-cyan-500/20',
		'from-indigo-500/20 to-purple-500/20',
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

export function AlbumCard({
	data,
	isPreview = false,
	onEdit,
	className,
	showVisualizationConfig = false,
	onClick,
	enableExplode = false,
}: AlbumCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const gradient = getRandomGradient();

	// Para componente preview, detectar cambios y animar
	const prevDataRef = useRef<CardData | null>(null);

	// Calcular rareza basada en los datos del álbum
	const rarityConfig = useMemo(() => {
		// Si es un álbum con estadísticas, basamos la rareza en la cantidad de imágenes
		if (isAlbumWithStats(data) && data._count) {
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
	}, [data]);

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
			(hasProperty(prevData, 'name') && hasProperty(data, 'name') && prevData.name !== data.name) ||
			(hasProperty(prevData, 'emoji') && hasProperty(data, 'emoji') && prevData.emoji !== data.emoji) ||
			(hasProperty(prevData, 'color') && hasProperty(data, 'color') && prevData.color !== data.color);

		if (hasChanged) {
			prevDataRef.current = { ...data };
		}
	}, [data, isPreview]);

	// Manejar el movimiento del mouse para efectos místicos
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<motion.div
				className={cn(
					'group relative flex h-48 flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-primary',
					isHovered && 'shadow-lg',
					className
				)}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				onMouseMove={handleMouseMove}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* Gradiente de fondo */}
				<div
					className={cn(
						'absolute inset-0 z-0 bg-gradient-to-br opacity-50 transition-opacity duration-300',
						gradient,
						isHovered && 'opacity-80'
					)}
					style={{
						backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
					}}
				/>

				{/* Contenido */}
				<div className="z-10 flex flex-1 flex-col">
					<div className="flex items-center space-x-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
							<Camera className="h-4 w-4 text-blue-500" />
						</div>
						<h3 className="text-xl font-semibold line-clamp-1">{getStringProp(data, 'name', 'Sin nombre')}</h3>
					</div>

					{/* Detalles */}
					<div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center space-x-2">
							<span className="inline-flex items-center rounded-full border px-2 py-0.5">
								{getStringProp(data, 'emoji', '📷')}
							</span>
						</div>
						<div className="flex items-center space-x-2">
							<span className="flex items-center">0 imágenes</span>
						</div>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<EntityCardWrapper
			className={cn('w-full aspect-[2.5/3.5]', className)}
			entityType="album"
			rarity={rarityConfig}
			options={{
				enable3DEffect: true,
				enableGlowEffect: true,
				enableBorderEffect: true,
				enableGrainEffect: false,
				designSystem: {
					preset: 'album',
					aspectRatio: '2.5/3.5',
					cornerRadius: 12,
				},
				primaryColor: '59, 130, 246', // blue-500
			}}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			showVisualizationConfig={showVisualizationConfig}
			onClick={onClick}
			enableExplode={enableExplode}
		>
			<div className="relative h-full p-4 flex flex-col z-10" onMouseMove={handleMouseMove}>
				{/* Encabezado */}
				<div className="flex items-center gap-3 mb-4">
					<div
						className={cn(
							'h-12 w-12 rounded-full flex items-center justify-center',
							'bg-blue-500/20',
							'group-hover:bg-blue-500/30 transition-colors duration-300'
						)}
					>
						<AlbumIcon className="h-6 w-6 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-lg leading-tight truncate">{getStringProp(data, 'name', 'Sin nombre')}</h3>
					</div>

					{/* Información del álbum */}
					<div className="flex flex-col gap-2 mt-auto">
						<div
							className="rounded-lg p-3 bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300"
							style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
						>
							{isAlbumWithStats(data) && data._count ? (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<ImageIcon className="h-4 w-4 text-blue-500/80" />
										<span className="text-sm">{data._count.images || 0} imágenes</span>
									</div>
									{hasProperty(data, 'totalSize') && data.totalSize && (
										<span className="text-xs text-muted-foreground">{formatBytes(data.totalSize)}</span>
									)}
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<AlbumIcon className="h-4 w-4 text-blue-500/80" />
										<span className="text-sm">Álbum</span>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Acciones */}
				<motion.div
					className="absolute top-2 right-2 flex gap-1"
					initial={{ opacity: 0 }}
					animate={{ opacity: isHovered ? 1 : 0 }}
				>
					{onEdit && isAlbumWithStats(data) && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs"
							onClick={() => {
								onEdit(data);
							}}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
				</motion.div>
			</div>
		</EntityCardWrapper>
	);
}
