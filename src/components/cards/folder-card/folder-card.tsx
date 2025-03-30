'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { memo } from 'react';
import { FolderCardContent } from './folder-card-content';
import { FolderCardFooter } from './folder-card-footer';
import { FolderCardHeader } from './folder-card-header';
import { FolderCardImages } from './folder-card-images';
import { generateSecondaryColor, getFolderStats } from './folder-server-actions';

export interface FolderCardProps {
	folderId: string;
	href?: string;
	className?: string;
	compact?: boolean;
	interactive?: boolean;
	tcgMode?: boolean;
}

/**
 * Componente principal para mostrar una carpeta como una carta.
 * Tiene dos modos: normal y TCG (estilo carta de juego coleccionable).
 *
 * @example
 * // Modo normal
 * <FolderCard folderId="..." />
 *
 * // Modo TCG
 * <FolderCard folderId="..." tcgMode />
 */
export async function FolderCard({
	folderId,
	href,
	className,
	compact = false,
	interactive = true,
	tcgMode = false
}: FolderCardProps) {
	// Validar que el ID sea válido
	if (!folderId || folderId.trim() === '') {
		return (
			<div className="p-2 text-sm text-red-500 border border-red-200 rounded-md bg-red-50 dark:bg-red-950 dark:border-red-900">
				Error: ID de carpeta no proporcionado
			</div>
		);
	}

	// Obtener datos de la carpeta y estadísticas
	const folderData = await getFolderStats(folderId);

	if (!folderData) {
		return (
			<div className="p-2 text-sm text-red-500 border border-red-200 rounded-md bg-red-50 dark:bg-red-950 dark:border-red-900">
				Error: No se pudo cargar la carpeta
			</div>
		);
	}

	// Obtener imágenes recientes si no tenemos una imagen destacada
	const recentImages: string[] = folderData.recentImageUrls || [];

	// Generar color secundario para efectos visuales
	const primaryColor = folderData.color || '#6366f1';
	const secondaryColor = await generateSecondaryColor(primaryColor);

	// Establecer la URL base del enlace
	const baseHref = href || `/dashboard/folders/${folderId}`;

	// Componente de la carta
	const cardContent = (
		<div
			className={cn(
				"group flex flex-col relative h-full overflow-hidden rounded-md transition-all duration-300",
				tcgMode ? "bg-gradient-to-b from-gray-900 to-black shadow-lg border border-white/10" : "bg-card shadow",
				interactive && "hover:shadow-md",
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
				recentImages={recentImages}
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
							{new Date(folderData.updatedAt).toLocaleDateString()}
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

	// Si es interactivo, envolver en un enlace
	if (interactive) {
		return (
			<Link href={baseHref} className="block h-full">
				{cardContent}
			</Link>
		);
	}

	// Si no es interactivo, devolver solo el contenido
	return cardContent;
}

// Exportar componente memorizado para mejor rendimiento
export const MemoizedFolderCard = memo(FolderCard);