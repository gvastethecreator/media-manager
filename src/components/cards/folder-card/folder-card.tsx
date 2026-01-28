import { memo, useCallback, useMemo } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import type { FolderWithStats } from '@/types/entities/folder';
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

export const FolderCard = memo(
	function FolderCard({ folder, onClick, href, className, interactive = true, tcgMode = false }: FolderCardProps) {
		const folderData = useMemo(() => {
			const imageCount = folder._count?.images ?? 0;
			const isWithStats = 'stats' in folder;

			// Debug deshabilitado para limpiar consola
			// clientLogger.debug('🔍 FolderCard Debug:', {
			//   folderName: folder.name,
			//   totalFiles: folder.totalFiles,
			//   totalSize: folder.totalSize,
			//   statsExists: !!folder.stats,
			//   statsItems: folder.stats?.totalItems,
			//   statsSize: folder.stats?.totalSize,
			// });

			return {
				...folder,
				imageCount,
				_count: {
					...(folder._count || {}),
					images: imageCount,
				},
				totalFiles: folder.stats?.totalItems ?? folder.totalFiles ?? 0,
				totalSize: folder.stats?.totalSize ?? folder.totalSize ?? 0,
				// Normalizamos thumbnails: aceptar `thumbnailUrl` (que puede venir con base64 crudo)
				// o `thumbnail` y convertir a data URL si es necesario
				recentImageUrls: (folder.recentImages || [])
					.map((img: any) => {
						const raw: unknown = img?.thumbnailUrl ?? img?.thumbnail ?? null;
						if (typeof raw !== 'string' || raw.length === 0) return null;
						const trimmed = raw.trim();
						// Si ya es data URL, devolver tal cual
						if (trimmed.startsWith('data:')) return trimmed;
						// Si parece una URL/route (http(s), blob:, file:, /), dejarla como está
						if (/^(https?:|blob:|file:|\/)/i.test(trimmed)) return trimmed;
						// Caso contrario, asumimos base64 crudo (posible con saltos de línea) → data URL webp
						const base64 = trimmed.replace(/\s+/g, '');
						return `data:image/webp;base64,${base64}`;
					})
					.filter(Boolean) as string[],
				childrenCount: folder.stats?.folderCount ?? 0,
				lastIndexed: folder.lastIndexed ?? null,
			};
		}, [folder]);

		// Colores para personalización
		const primaryColor = useMemo(() => folderData.color || 'var(--entity-folder)', [folderData.color]);
		const secondaryColor = useMemo(
			() => (primaryColor === 'var(--entity-folder)' ? 'var(--dt-primary-600)' : primaryColor),
			[primaryColor]
		);

		// Manejador de clicks para la tarjeta
		const handleCardClick = useCallback(() => {
			if (onClick && interactive) {
				onClick();
			}
		}, [onClick, interactive]);

		// Validar que el objeto folder exista
		if (!folder) {
			clientLogger.error('FolderCard recibió un objeto folder inválido');
			return null;
		}

		// Componente de la carta
		const cardContent = (
			<div
				className={cn(
					'group relative flex h-full flex-col overflow-hidden rounded-md transition-all duration-300',
					tcgMode ? 'border border-border/40 bg-gradient-to-b from-gray-900 to-black shadow-lg' : 'bg-card shadow',
					interactive && 'cursor-pointer hover:shadow-md',
					className
				)}
				style={
					tcgMode
						? {
							boxShadow: `0 10px 15px -3px color-mix(in oklab, ${primaryColor}, transparent 80%), 0 4px 6px -4px color-mix(in oklab, ${primaryColor}, transparent 70%)`,
						}
						: {}
				}
			>
				{/* Borde brillante para TCG mode */}
				{tcgMode && (
					<div
						className="pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						style={{
							boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${primaryColor}, transparent 50%), 0 0 15px color-mix(in oklab, ${primaryColor}, transparent 70%)`,
							zIndex: 20,
						}}
					/>
				)}
				{/* Header de la carpeta */}
				<FolderCardHeader
					emoji={folderData.emoji || undefined}
					isFavorite={folderData.isFavorite}
					name={folderData.name}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
					tcgMode={tcgMode}
				/>
				{/* Sección de imágenes */}
				<FolderCardImages
					featuredImage={folderData.featuredImage}
					primaryColor={primaryColor}
					recentImages={folderData.recentImageUrls}
					secondaryColor={secondaryColor}
					tcgMode={tcgMode}
					totalFiles={folder.stats?.totalItems || folder.totalFiles || 0}
					totalSize={folder.stats?.totalSize || folder.totalSize || 0}
				/>{' '}
				{/* Contenido y estadísticas */}
				<FolderCardContent
					childrenCount={folderData.childrenCount || 0}
					description={folderData.description}
					featuredImage={folderData.featuredImage}
					lastIndexed={folderData.lastIndexed}
					primaryColor={primaryColor}
					tcgMode={tcgMode}
					totalFiles={folder.stats?.totalItems || folder.totalFiles || 0}
					totalSize={folder.stats?.totalSize || folder.totalSize || 0}
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
							<span className="text-white/60 text-xs">
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
							className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
							style={{
								background: `radial-gradient(circle at 50% 50%, color-mix(in oklab, ${primaryColor}, transparent 90%) 0%, transparent 70%)`,
								zIndex: 1,
							}}
						/>

						{/* Esquinas decorativas TCG */}
						<div
							className="pointer-events-none absolute top-0 left-0 h-6 w-6 rounded-br-sm border-t-2 border-l-2 opacity-60"
							style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 20%)` }}
						/>
						<div
							className="pointer-events-none absolute top-0 right-0 h-6 w-6 rounded-bl-sm border-t-2 border-r-2 opacity-60"
							style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 20%)` }}
						/>
						<div
							className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 rounded-tr-sm border-b-2 border-l-2 opacity-60"
							style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 20%)` }}
						/>
						<div
							className="pointer-events-none absolute right-0 bottom-0 h-6 w-6 rounded-tl-sm border-r-2 border-b-2 opacity-60"
							style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 20%)` }}
						/>
					</>
				)}
			</div>
		);

		// Renderizar con o sin enlace
		if (href && interactive) {
			return (
				<a className="block h-full" href={href} onClick={handleCardClick}>
					{cardContent}
				</a>
			);
		}

		// Renderizar con manejador de eventos
		if (interactive && onClick) {
			return (
				<button
					className="block h-full w-full text-left"
					onClick={handleCardClick}
					onKeyDown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							handleCardClick();
						}
					}}
					type="button"
				>
					{cardContent}
				</button>
			);
		}

		// Renderizar estático
		return cardContent;
	},
	(prevProps, nextProps) => {
		// Custom comparison function to prevent unnecessary re-renders
		if (prevProps.tcgMode !== nextProps.tcgMode) return false;
		if (prevProps.interactive !== nextProps.interactive) return false;
		if (prevProps.className !== nextProps.className) return false;
		if (prevProps.href !== nextProps.href) return false;

		// Deep comparison for folder object - only check relevant props for rendering
		const prevFolder = prevProps.folder;
		const nextFolder = nextProps.folder;

		if (prevFolder.id !== nextFolder.id) return false;
		if (prevFolder.name !== nextFolder.name) return false;
		if (prevFolder.color !== nextFolder.color) return false;
		if (prevFolder.emoji !== nextFolder.emoji) return false;
		if (prevFolder.isFavorite !== nextFolder.isFavorite) return false;
		if (prevFolder.description !== nextFolder.description) return false;
		if (prevFolder.featuredImage !== nextFolder.featuredImage) return false;
		if (prevFolder.totalFiles !== nextFolder.totalFiles) return false;
		if (prevFolder.totalSize !== nextFolder.totalSize) return false;
		const prevTime = prevFolder.lastIndexed instanceof Date ? prevFolder.lastIndexed.getTime() : 0;
		const nextTime = nextFolder.lastIndexed instanceof Date ? nextFolder.lastIndexed.getTime() : 0;
		if (prevTime !== nextTime) return false;

		// Compare stats object
		if (prevFolder.stats?.totalItems !== nextFolder.stats?.totalItems) return false;
		if (prevFolder.stats?.totalSize !== nextFolder.stats?.totalSize) return false;
		if (prevFolder.stats?.folderCount !== nextFolder.stats?.folderCount) return false;

		// Compare _count object
		if (prevFolder._count?.images !== nextFolder._count?.images) return false;

		// Shallow comparison of recent images array
		if (prevFolder.recentImages?.length !== nextFolder.recentImages?.length) return false;
		if (prevFolder.recentImages && nextFolder.recentImages) {
			for (let i = 0; i < prevFolder.recentImages.length; i++) {
				const prevImg = prevFolder.recentImages[i];
				const nextImg = nextFolder.recentImages[i];
				if (prevImg?.id !== nextImg?.id || prevImg?.thumbnailUrl !== nextImg?.thumbnailUrl) {
					return false;
				}
			}
		}

		// Compare onClick function reference (for cases where it might be memoized)
		if (prevProps.onClick !== nextProps.onClick) return false;

		return true; // Props are equal, don't re-render
	}
);
