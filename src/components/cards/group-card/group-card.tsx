import { motion } from 'motion/react';
import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroupCardData } from '@/lib/api/groups';
import { cn } from '@/lib/utils';
import type { GroupCardProps } from './group-card.types';
import { GroupCardContent } from './group-card-content';
import { GroupCardFooter } from './group-card-footer';
import { GroupCardHeader } from './group-card-header';
import { GroupCardImages } from './group-card-images';

export function GroupCard({
	groupId,
	onClick,
	className,
	tcgMode = true,
	compact = false,
	disabled = false,
	isSelected = false,
}: GroupCardProps) {
	const { data: group, isLoading, error } = useGroupCardData(groupId);
	const [isHovered, setIsHovered] = useState(false);

	// Calcular colores
	const primaryColor = useMemo(() => group?.color || '#3b82f6', [group?.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!group?.color) return '#2563eb';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(group.color.slice(1, 3), 16);
			const g = Number.parseInt(group.color.slice(3, 5), 16);
			const b = Number.parseInt(group.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			// Si hay algún error, volver al valor por defecto
			return '#2563eb';
		}
	}, [group?.color]);

	// Preparar media para la galería
	const allMedia = useMemo(() => {
		return [...(group?.recentImages || []), ...(group?.recentVideos || [])];
	}, [group?.recentImages, group?.recentVideos]);

	// Función de manejadores de eventos
	const handleClick = useCallback(() => {
		if (onClick && !disabled && group) {
			onClick(group);
		}
	}, [onClick, disabled, group]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ') && group) {
				e.preventDefault();
				onClick(group);
			}
		},
		[onClick, disabled, group]
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
				console.error('Error parsing group filters:', e);
				return 0;
			}
		}
		return 0;
	}, [group?.filters]);

	// Si no hay datos del grupo o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
					className
				)}
			>
				<p className="text-gray-500">Cargando grupo...</p>
			</div>
		);
	}

	if (error || !group) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Grupo no encontrado'}</p>
			</div>
		);
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
				boxShadow: tcgMode ? `0 0 0 1px ${primaryColor}30, 0 2px 10px ${primaryColor}20` : undefined,
				backgroundColor: tcgMode ? '#1a1a1a' : undefined,
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
				images={group.recentImages || []}
				primaryColor={primaryColor}
				rarityLevel={Number(group.rarityLevel) || 1}
				tcgMode={tcgMode}
				videos={group.recentVideos || []}
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
				imagesCount={group.stats.imageCount}
				isFavorite={group.isFavorite}
				mp={group.mp || 0}
				name={group.name}
				organizationType={group.organizationType || ''}
				power={group.power || 0}
				primaryColor={primaryColor}
				rarityLevel={Number(group.rarityLevel) || 1}
				tcgMode={tcgMode}
				videosCount={group.stats.videoCount}
			/>

			{/* Efecto holográfico general en modo TCG */}
			{tcgMode && isHovered && !disabled && (
				<motion.div
					animate={{
						opacity: [0.1, 0.2, 0.1],
						background: [
							`linear-gradient(45deg, ${primaryColor}50, transparent)`,
							`linear-gradient(45deg, ${primaryColor}80, transparent)`,
							`linear-gradient(45deg, ${primaryColor}50, transparent)`,
						],
					}}
					className="pointer-events-none absolute inset-0 z-50 opacity-30 mix-blend-overlay"
					transition={{
						duration: 2,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: 'reverse',
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
}
