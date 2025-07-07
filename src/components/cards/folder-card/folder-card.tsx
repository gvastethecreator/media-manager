import { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FolderWithStats } from '@/types/entities/folder';
import { FolderCardContent } from './folder-card-content';
import { FolderCardFooter } from './folder-card-footer';
import { FolderCardHeader } from './folder-card-header';
import { FolderCardImages } from './folder-card-images';

export interface FolderCardProps {
	folder: FolderWithStats;
	onClick?: () => void;
	href?: string;
	className?: string;
	interactive?: boolean;
	tcgMode?: boolean;
}

export const FolderCard = memo(function FolderCard({
	folder,
	onClick,
	href,
	className,
	interactive = true,
	tcgMode = false,
}: FolderCardProps) {
	

	const folderData = useMemo(() => {
		const imageCount = folder._count?.images ?? 0;
		const isWithStats = 'statistics' in folder;

		return {
			...folder,
			imageCount,
			_count: {
				...(folder._count || {}),
				images: imageCount,
			},
			totalFiles: folder.statistics?.totalFiles ?? 0,
			totalSize: folder.statistics?.totalSize ?? 0,
			recentImageUrls: folder.recentImages || [],
			childrenCount: folder.statistics?.folderCount ?? 0,
			lastIndexed: folder.lastIndexed ?? null,
		};
	}, [folder]);

	// Colores para personalización
	const primaryColor = useMemo(() => folderData.color || '#3b82f6', [folderData.color]);
	const secondaryColor = useMemo(() => (primaryColor === '#3b82f6' ? '#1d4ed8' : primaryColor), [primaryColor]);

	// Manejador de clicks para la tarjeta
	const handleCardClick = useCallback(() => {
		if (onClick && interactive) {
			onClick();
		}
	}, [onClick, interactive]);

	// Validar que el objeto folder exista
	if (!folder) {
		console.error('FolderCard recibió un objeto folder inválido');
		return null;
	}

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
						className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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

	// Renderizar con o sin enlace
	if (href && interactive) {
		return (
			<a href={href} className="block h-full" onClick={handleCardClick}>
				{cardContent}
			</a>
		);
	}

	// Renderizar con manejador de eventos
	if (interactive && onClick) {
		return (
			<button
				type="button"
				className="block h-full w-full text-left"
				onClick={handleCardClick}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						handleCardClick();
					}
				}}
			>
				{cardContent}
			</button>
		);
	}

	// Renderizar estático
	return cardContent;
});