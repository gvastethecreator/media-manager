import React, { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from '@/components/ui/motion-shim';
import { useRecentGroupMedia } from '@/lib/api/groups';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import type { GroupCardProps } from './group-card.types';
import { GroupCardContent } from './group-card-content';
import { GroupCardFooter } from './group-card-footer';
import { GroupCardHeader } from './group-card-header';
import { GroupCardImages } from './group-card-images';

export const GroupCard = memo(function GroupCard({
	group,
	onClick,
	className,
	tcgMode = true,
	compact = false,
	disabled = false,
	isSelected = false,
}: GroupCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	// Cargar media reciente si no viene en las props
	const { data: mediaData } = useRecentGroupMedia(group?.id || '', 6);

	// Calcular colores
	const primaryColor = useMemo(() => group?.color || 'var(--entity-group)', [group?.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto (cielo/azul de grupos)
		if (!group?.color) {
			return 'oklch(0.68 0.16 230)';
		}

		return `color-mix(in oklab, ${primaryColor}, black 20%)`;
	}, [group?.color, primaryColor]);

	// Preparar media para la galería (usar props o datos cargados)
	const recentImages = useMemo(() => {
		if (group?.recentImages?.length) return group.recentImages;
		return mediaData?.filter((m) => !m.isVideo).map((m) => m.thumbnailUrl) || [];
	}, [group?.recentImages, mediaData]);

	const recentVideos = useMemo(() => {
		if (group?.recentVideos?.length) return group.recentVideos;
		return mediaData?.filter((m) => m.isVideo).map((m) => m.thumbnailUrl) || [];
	}, [group?.recentVideos, mediaData]);

	const allMedia = useMemo(() => {
		return [...recentImages, ...recentVideos];
	}, [recentImages, recentVideos]);

	// Función de manejadores de eventos
	const handleClick = useCallback(() => {
		if (onClick && !disabled) {
			onClick();
		}
	}, [onClick, disabled]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick, disabled]
	);

	// Determinar el número total de entidades
	const entityCounts = useMemo(
		() => ({
			images: group?.stats?.imageCount || 0,
			videos: group?.stats?.videoCount || 0,
			albums: group?.stats?.albumCount || 0,
			collections: group?.stats?.collectionCount || 0,
			tags: group?.stats?.tagCount || 0,
			characters: group?.stats?.characterCount || 0,
			places: group?.stats?.placeCount || 0,
			worldItems: group?.stats?.worldItemCount || 0,
			concepts: group?.stats?.conceptCount || 0,
			prompts: group?.stats?.promptCount || 0,
			notes: group?.stats?.noteCount || 0,
			wildcards: group?.stats?.wildcardCount || 0,
			properties: group?.stats?.propertyCount || 0,
		}),
		[group?.stats]
	);

	// Preparar filters count
	const filtersCount = useMemo(() => {
		if (typeof group?.filters === 'string' && group.filters) {
			try {
				const parsedFilters = JSON.parse(group.filters);
				return Array.isArray(parsedFilters) ? parsedFilters.length : 0;
			} catch (e) {
				clientLogger.error('Error parsing group filters:', e);
				return 0;
			}
		}
		return 0;
	}, [group?.filters]);

	// Si no hay group, no renderizar nada
	if (!group) {
		return null;
	}

	// Construir la tarjeta
	const cardContent = (
		<div
			className={cn(
				'relative overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm transition-all',
				isHovered && !disabled && 'scale-[1.01] shadow-md',
				disabled && 'opacity-70',
				isSelected && 'ring-2',
				className
			)}
			style={{
				maxWidth: compact ? '280px' : '300px',
				minWidth: compact ? '220px' : '260px',
				borderRadius: tcgMode ? '0.5rem' : '0.375rem',
				boxShadow: tcgMode
					? `0 0 0 1px color-mix(in oklab, ${primaryColor}, transparent 70%), 0 2px 10px color-mix(in oklab, ${primaryColor}, transparent 80%)`
					: undefined,
				backgroundColor: tcgMode ? 'var(--card)' : undefined,
				...(isSelected && { '--tw-ring-color': primaryColor }),
			}}
		>
			{/* Encabezado */}
			<GroupCardHeader
				category={group.category || undefined}
				color={primaryColor}
				compact={compact}
				emoji={group.emoji || ''}
				isFavorite={group.isFavorite}
				name={group.name}
				organizationLevel={Number(group.organizationLevel) || 1}
				organizationType={group.organizationType || ''}
				tcgMode={tcgMode}
			/>

			{/* Imágenes */}
			<GroupCardImages
				compact={compact}
				emoji={group.emoji || ''}
				holographicEffect={isHovered}
				images={recentImages}
				primaryColor={primaryColor}
				rarityLevel={Number(group.rarityLevel) || 1}
				tcgMode={tcgMode}
				videos={recentVideos}
			/>

			{/* Contenido */}
			<GroupCardContent
				category={group.category || undefined}
				compact={compact}
				description={group.description || undefined}
				entityCounts={entityCounts}
				filtersCount={filtersCount}
				flexibilityScore={group.flexibilityScore || 0}
				organizationType={group.organizationType || ''}
				primaryColor={primaryColor}
				tcgMode={tcgMode}
			/>

			{/* Pie */}
			<GroupCardFooter
				cardId={group.cardId || ''}
				category={group.category || undefined}
				compact={compact}
				hp={group.hp || 0}
				id={group.id}
				imagesCount={group.stats?.imageCount || 0}
				isFavorite={group.isFavorite}
				mp={group.mp || 0}
				name={group.name}
				organizationType={group.organizationType || ''}
				power={group.power || 0}
				primaryColor={primaryColor}
				rarityLevel={Number(group.rarityLevel) || 1}
				tcgMode={tcgMode}
				videosCount={group.stats?.videoCount || 0}
			/>

			{/* Efecto holográfico general en modo TCG */}
			{tcgMode && isHovered && !disabled && (
				<motion.div
					animate={{
						opacity: 0.2,
					}}
					className="pointer-events-none absolute inset-0 z-50 opacity-30 mix-blend-overlay"
					style={{
						background: `linear-gradient(45deg, color-mix(in oklab, ${primaryColor}, transparent 50%), transparent)`,
					}}
					transition={{
						duration: 2,
					}}
				/>
			)}
		</div>
	);

	// Si hay onClick, usamos un botón para mejor accesibilidad
	if (onClick) {
		return (
			<button
				aria-pressed={isSelected}
				className={cn(
					'm-0 w-full cursor-pointer border-0 bg-transparent p-0 text-left focus:outline-none focus:ring-2 focus:ring-offset-2',
					!disabled && 'hover:opacity-100',
					disabled && 'cursor-not-allowed'
				)}
				disabled={disabled}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				type="button"
			>
				{cardContent}
			</button>
		);
	}

	// Si no hay onClick, lo envolvemos en un Link para navegar a la página del grupo
	return (
		<Link
			className="block"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			to={`/dashboard/groups/${group.id}`}
		>
			{cardContent}
		</Link>
	);
});
