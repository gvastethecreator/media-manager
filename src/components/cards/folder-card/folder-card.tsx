'use client';

import { cn } from '@/lib/utils';
import type { Folder } from '@/types/entities/folder';
import { memo, useCallback, useMemo } from 'react';
import { FolderCardContent } from './folder-card-content';
import { FolderCardFooter } from './folder-card-footer';
import { FolderCardHeader } from './folder-card-header';
import { FolderCardImages } from './folder-card-images';

// Tipo extendido para asegurar que tenemos los datos necesarios
// Podrías necesitar ajustar este tipo basado en lo que realmente usa FolderCard y sus hijos
type FolderCardData = Folder & {
	imageCount?: number; // O _count?.images
	// recentImageUrls?: string[]; // ❌ Eliminado temporalmente para optimización
	featuredImage?: string | null;
	totalFiles?: number;
	totalSize?: number;
	lastIndexed?: Date | null;
	autoReindex?: boolean;
	childrenCount?: number;
	isFavorite?: boolean;
};

interface FolderCardProps {
	folder: Folder | FolderCardData;
	onClick?: () => void;
	href?: string;
	className?: string;
	compact?: boolean;
	interactive?: boolean;
	tcgMode?: boolean;
}

/**
 * Componente para mostrar una carpeta en formato de tarjeta
 */
export const FolderCard = memo(function FolderCard({
	folder,
	onClick,
	href,
	className,
	compact = false,
	interactive = true,
	tcgMode = false,
}: FolderCardProps) {
	// Validar que el objeto folder exista
	if (!folder) {
		console.error('FolderCard recibió un objeto folder inválido');
		return null;
	}

	// 🖼️ Estado para thumbnails dinámicos - ❌ ELIMINADO TEMPORALMENTE
	// const [recentImages, setRecentImages] = useState<string[]>([]);

	// 🔄 Cargar imágenes al montar - ❌ ELIMINADO TEMPORALMENTE
	// useEffect(() => {
	// 	async function loadImages() {
	// 		try {
	// 			const fetchedImages = await getRecentFolderImages(folder.id, 4);
	// 			const imageUrls = fetchedImages.map((img) => img.thumbnailUrl).filter(Boolean);
	// 			setRecentImages(imageUrls);
	// 		} catch (error) {
	// 			console.error('Error loading folder images:', error);
	// 			setRecentImages([]);
	// 		}
	// 	}
	// 	loadImages();
	// }, [folder.id]);

	// Preparar datos con fallbacks
	const folderData = useMemo(() => {
		// Extraer conteos de _count si existen
		const imageCount = folder._count?.images ?? folder.imageCount ?? 0;

		return {
			...folder,
			// Asegurar que tenemos conteo de imágenes en ambos formatos posibles
			imageCount,
			_count: {
				...(folder._count || {}),
				images: imageCount,
			},
			// Asegurar valores por defecto para otros campos
			totalFiles: folder.totalFiles ?? imageCount ?? 0,
			totalSize: folder.totalSize ?? 0,
			// recentImageUrls: recentImages, // 🖼️ Usar imágenes cargadas dinámicamente - ❌ ELIMINADO TEMPORALMENTE
			recentImageUrls: [], // Asignar un array vacío temporalmente
			childrenCount: 0,
			lastIndexed: folder.lastIndexed || null,
		};
	}, [folder]); // 🔄 Removido recentImages de dependencias

	// Colores para personalización
	const primaryColor = useMemo(() => folderData.color || '#3b82f6', [folderData.color]);
	const secondaryColor = useMemo(() => (primaryColor === '#3b82f6' ? '#1d4ed8' : primaryColor), [primaryColor]);

	// Manejador de clicks para la tarjeta
	const handleCardClick = useCallback(() => {
		if (onClick && interactive) {
			onClick();
		}
	}, [onClick, interactive]);

	// Establecer la URL base del enlace
	const baseHref = href || `/dashboard/folders/${folderData.id}`;

	// Componente de la carta
	const cardContent = (
		<div
			className={cn(
				'group flex flex-col relative h-full overflow-hidden rounded-md transition-all duration-300',
				tcgMode ? 'bg-gradient-to-b from-gray-900 to-black shadow-lg border border-white/10' : 'bg-card shadow',
				interactive && 'hover:shadow-md cursor-pointer',
				className
			)}
			style={
				tcgMode
					? {
							boxShadow: `0 10px 15px -3px ${primaryColor}20, 0 4px 6px -4px ${primaryColor}30`,
						}
					: {}
			}
		>
			{/* Borde brillante para TCG mode */}
			{tcgMode && (
				<div
					className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
					style={{
						boxShadow: `inset 0 0 0 1px ${primaryColor}50, 0 0 15px ${primaryColor}30`,
						zIndex: 20,
					}}
				/>
			)}

			{/* Header de la carpeta */}
			<FolderCardHeader
				name={folderData.name}
				emoji={folderData.emoji || undefined}
				isFavorite={folderData.isFavorite}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
			/>

			{/* Sección de imágenes */}
			<FolderCardImages
				featuredImage={folderData.featuredImage}
				recentImages={folderData.recentImageUrls || []}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
			/>

			{/* Contenido y estadísticas */}
			<FolderCardContent
				description={folderData.description}
				totalFiles={folderData.totalFiles}
				totalSize={folderData.totalSize}
				lastIndexed={folderData.lastIndexed}
				autoReindex={folderData.autoReindex}
				childrenCount={folderData.childrenCount || 0}
				primaryColor={primaryColor}
				featuredImage={folderData.featuredImage}
				tcgMode={tcgMode}
			/>

			{/* Footer con información adicional */}
			<FolderCardFooter
				folder={{
					id: folderData.id,
					name: folderData.name,
					color: primaryColor,
				}}
				tcgMode={tcgMode}
			>
				{tcgMode && (
					<div className="flex items-center">
						<span className="text-xs text-white/60">
							{folderData.updatedAt ? new Date(folderData.updatedAt).toLocaleDateString() : ''}
						</span>
					</div>
				)}
			</FolderCardFooter>

			{/* Efectos visuales para TCG mode */}
			{tcgMode && (
				<>
					{/* Textura de fondo sutil */}
					<div
						className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
						style={{
							background: `radial-gradient(circle at 50% 50%, ${primaryColor}10 0%, transparent 70%)`,
							zIndex: 1,
						}}
					/>

					{/* Esquinas decorativas TCG */}
					<div
						className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-br-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-bl-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-tr-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-tl-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
				</>
			)}
		</div>
	);
	// Si es interactivo, envolver en un elemento clickeable que llame a onClick
	if (interactive) {
		// Usar un div o button si Link no es apropiado o si href no se usa para la interacción principal
		// Si se usa Link, el onClick debería estar en el Link o en el div interno si Link solo navega.
		// Aquí asumimos que onClick es la interacción principal.
		const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault(); // Prevenir scroll en espacio
				if (onClick) {
					// ✅ Verificar que onClick existe
					onClick();
				}
			}
		};

		return (
			<button
				type="button"
				onClick={handleCardClick}
				onKeyDown={handleKeyDown}
				className="block h-full w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-left p-0 border-none bg-transparent appearance-none"
			>
				{cardContent}
			</button>
		);
		// Alternativa si se necesita navegación Y un onClick diferente:
		// return (
		//   <Link href={baseHref} className="block h-full" onClick={(e) => { /* ¿Prevenir default si onClick debe manejarlo? */ onClick(); }}>
		//     {cardContent}
		//   </Link>
		// );
	}

	// Si no es interactivo, devolver solo el contenido
	return cardContent;
});

// Exportar componente memorizado para mejor rendimiento
export const MemoizedFolderCard = memo(FolderCard, (prevProps, nextProps) => {
	// Comparar las props relevantes, especialmente el objeto folder
	return (
		prevProps.folder.id === nextProps.folder.id &&
		prevProps.folder.name === nextProps.folder.name &&
		prevProps.folder.emoji === nextProps.folder.emoji &&
		prevProps.folder.updatedAt === nextProps.folder.updatedAt && // Comparar fechas/timestamps si es posible
		prevProps.folder.imageCount === nextProps.folder.imageCount &&
		prevProps.folder.isFavorite === nextProps.folder.isFavorite &&
		prevProps.className === nextProps.className &&
		prevProps.tcgMode === nextProps.tcgMode
	);
});
