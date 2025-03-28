'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { FolderCardContent } from './folder-card-content';
import { FolderCardFooter } from './folder-card-footer';
import { FolderCardHeader } from './folder-card-header';
import { FolderCardImages } from './folder-card-images';

// Importar tipos de Prisma desde types/entities
import type { Folder } from '@/types/entities/folders';

export interface FolderCardProps {
	folder: Folder & {
		_count?: {
			images: number;
		};
		imageCount?: number;
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * FolderCard - Componente de tarjeta para carpetas inspirado en el diseño de cartas Magic
 *
 * Este componente muestra información detallada de una carpeta en un formato
 * inspirado en cartas Magic, con múltiples secciones que muestran datos
 * y miniaturas de las imágenes contenidas.
 */
export function FolderCard({ folder, onClick, className, style }: FolderCardProps) {
	// Calcular valores derivados
	const imagesCount = folder._count?.images || folder.imageCount || 0;

	// Calcular color primario y secundario
	const primaryColor = useMemo(() => folder.color || '#3b82f6', [folder.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!folder.color) return '#1e40af';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(folder.color.slice(1, 3), 16);
			const g = Number.parseInt(folder.color.slice(3, 5), 16);
			const b = Number.parseInt(folder.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#1e40af';
		}
	}, [folder.color]);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick]
	);

	// Definir estilos de la tarjeta
	const cardStyle = useMemo(
		() => ({
			// Borde basado en el color primario
			borderColor: primaryColor,
			// Fondo con gradiente sutil basado en el color primario
			background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
			...style,
		}),
		[primaryColor, style]
	);

	// Render del componente
	return (
		<motion.div
			className={cn(
				// Base
				'relative bg-card',
				'w-[300px] h-[420px] rounded-[4.75%] overflow-hidden',
				'border-2 shadow-md',
				// Interacción
				'transition-all duration-300 ease-out',
				'hover:shadow-lg hover:scale-[1.02]',
				'active:scale-[0.98]',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			whileHover={{ y: -5 }}
			whileTap={{ scale: 0.98 }}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			aria-label={`Carpeta: ${folder.name}`}
			data-folder-id={folder.id}
			style={cardStyle}
		>
			{/* Resplandor de borde en hover */}
			<div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
				<div
					className="absolute inset-0 rounded-[4.75%] blur-sm -z-10"
					style={{ boxShadow: `0 0 15px 2px ${primaryColor}` }}
				/>
			</div>

			{/* Contenido estructurado de la tarjeta */}
			<div className="flex flex-col h-full">
				{/* Encabezado de la tarjeta */}
				<FolderCardHeader
					name={folder.name}
					emoji={folder.emoji}
					color={primaryColor}
				/>

				{/* Sección de imágenes */}
				<FolderCardImages
					folderId={folder.id}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>

				{/* Contenido principal */}
				<FolderCardContent
					description={folder.description}
					totalFiles={folder.totalFiles}
					totalSize={folder.totalSize}
					lastIndexed={folder.lastIndexed}
					primaryColor={primaryColor}
				/>

				{/* Pie de la tarjeta */}
				<FolderCardFooter
					createdAt={folder.createdAt}
					updatedAt={folder.updatedAt}
					imagesCount={imagesCount}
					isFavorite={folder.isFavorite}
					path={folder.path}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>
			</div>
		</motion.div>
	);
}