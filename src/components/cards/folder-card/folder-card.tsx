'use client';

import { cn } from '@/lib/utils';
import type { Folder } from '@/types/entities/folders';
import { memo, useMemo } from 'react';
import { FolderCardContent } from './folder-card-content';
import { FolderCardFooter } from './folder-card-footer';
import { FolderCardHeader } from './folder-card-header';
import { FolderCardImages } from './folder-card-images';

// Tipo extendido para asegurar que tenemos los datos necesarios
// Podrías necesitar ajustar este tipo basado en lo que realmente usa FolderCard y sus hijos
type FolderCardData = Folder & {
	imageCount?: number; // O _count?.images
	recentImageUrls?: string[];
	featuredImage?: string | null;
	totalFiles?: number;
	totalSize?: number;
	lastIndexed?: Date | null;
	autoReindex?: boolean;
	childrenCount?: number;
	isFavorite?: boolean;
};

export interface FolderCardProps {
	folder: FolderCardData;
	onClick: () => void;
	href?: string;
	className?: string;
	compact?: boolean;
	interactive?: boolean;
	tcgMode?: boolean;
}

/**
 * Componente principal para mostrar una carpeta como una carta (Client Component).
 * Recibe los datos de la carpeta como props.
 */
export function FolderCard({
	folder,
	onClick,
	href,
	className,
	compact = false,
	interactive = true,
	tcgMode = false
}: FolderCardProps) {
	// Validar que el objeto folder exista
	if (!folder || !folder.id) {
		console.error("FolderCard: Objeto folder inválido recibido", folder);
		return (
			<div className="p-2 text-sm text-red-500 border border-red-200 rounded-md bg-red-50 dark:bg-red-950 dark:border-red-900">
				Error: Datos de carpeta inválidos
			</div>
		);
	}

	// Ya no se necesita fetching aquí
	// const folderData = await getFolderStats(folderId); // Eliminar
	const folderData = folder; // Usar el prop directamente

	// Ya no se necesita generar color secundario aquí, podría hacerse en el componente padre
	// o si es puramente visual, calcularlo aquí si es necesario (pero sin async)
	const primaryColor = folderData.color || '#6366f1';
	// const secondaryColor = await generateSecondaryColor(primaryColor); // Eliminar
	// Ejemplo de cálculo síncrono simple (ajustar según necesidad)
	const secondaryColor = useMemo(() => {
		// Lógica simple para derivar un color secundario (ej. aclarar/oscurecer)
		// Reemplazar con la lógica real de generateSecondaryColor si es posible hacerla síncrona
		// o pasar el secondaryColor como prop si se calcula en el servidor.
		// Por ahora, un valor por defecto o derivado simple.
		const hex = primaryColor.replace('#', '');
		const r = Number.parseInt(hex.substring(0, 2), 16);
		const g = Number.parseInt(hex.substring(2, 4), 16);
		const b = Number.parseInt(hex.substring(4, 6), 16);
		// Aclarar ligeramente (ejemplo)
		const nr = Math.min(255, r + 30);
		const ng = Math.min(255, g + 30);
		const nb = Math.min(255, b + 30);
		return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
	}, [primaryColor]);

	// Establecer la URL base del enlace
	const baseHref = href || `/dashboard/folders/${folderData.id}`;

	// Componente de la carta
	const cardContent = (
		<div
			className={cn(
				"group flex flex-col relative h-full overflow-hidden rounded-md transition-all duration-300",
				tcgMode ? "bg-gradient-to-b from-gray-900 to-black shadow-lg border border-white/10" : "bg-card shadow",
				interactive && "hover:shadow-md cursor-pointer",
				className
			)}
			style={tcgMode ? {
				boxShadow: `0 10px 15px -3px ${primaryColor}20, 0 4px 6px -4px ${primaryColor}30`
			} : {}}
		>
			{/* Borde brillante para TCG mode */}
			{tcgMode && (
				<div
					className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
					style={{
						boxShadow: `inset 0 0 0 1px ${primaryColor}50, 0 0 15px ${primaryColor}30`,
						zIndex: 20
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
					color: primaryColor
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
							zIndex: 1
						}}
					/>

					{/* Esquinas decorativas TCG */}
					<div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-br-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }} />
					<div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-bl-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }} />
					<div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-tr-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }} />
					<div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-tl-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }} />
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
				onClick();
			}
		};

		return (
			<button
				type="button"
				onClick={onClick}
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
}

// Exportar componente memorizado para mejor rendimiento
export const MemoizedFolderCard = memo(FolderCard, (prevProps, nextProps) => {
	// Comparar las props relevantes, especialmente el objeto folder
	return prevProps.folder.id === nextProps.folder.id &&
		prevProps.folder.name === nextProps.folder.name &&
		prevProps.folder.emoji === nextProps.folder.emoji &&
		prevProps.folder.updatedAt === nextProps.folder.updatedAt && // Comparar fechas/timestamps si es posible
		prevProps.folder.imageCount === nextProps.folder.imageCount &&
		prevProps.folder.isFavorite === nextProps.folder.isFavorite &&
		prevProps.className === nextProps.className &&
		prevProps.tcgMode === nextProps.tcgMode;
});