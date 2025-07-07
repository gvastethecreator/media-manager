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
		if (!group?.color) return '#2563eb';

		try {
			// Convertir hex a RGB y oscurecer
			const r = Number.parseInt(primaryColor.slice(1, 3), 16);
			const g = Number.parseInt(primaryColor.slice(2, 4), 16);
			const b = Number.parseInt(primaryColor.slice(4, 6), 16);

			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			return '#2563eb';
		}
	}, [primaryColor, group?.color]);

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
			images: group?._count?.images || 0,
			videos: group?._count?.videos || 0,
			albums: group?._count?.albums || 0,
			collections: group?._count?.collections || 0,
			tags: group?._count?.tags || 0,
			characters: group?._count?.characters || 0,
			places: group?._count?.places || 0,
			worldItems: group?._count?.worldItems || 0,
			concepts: group?._count?.concepts || 0,
			prompts: group?._count?.prompts || 0,
			notes: group?._count?.notes || 0,
			wildcards: group?._count?.wildcards || 0,
			properties: group?._count?.properties || 0,
		}),
		[group?._count]
	);

	// Preparar filters count
	const filtersCount = useMemo(() => {
		if (Array.isArray(group?.filters)) {
			return group.filters.length;
		}
		return 0;
	}, [group?.filters]);

	// Si no hay datos del grupo o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
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
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-red-100 dark:bg-red-900 flex items-center justify-center',
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
				'relative rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm transition-all',
				isHovered && !disabled && 'shadow-md scale-[1.01]',
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
				name={group.name}
				emoji={group.emoji}
				color={primaryColor}
				category={group.category || undefined}
				organizationType={group.organizationType}
				organizationLevel={group.organizationLevel}
				isFavorite={group.isFavorite}
				tcgMode={tcgMode}
				compact={compact}
			/>

			{/* Imágenes */}
			<GroupCardImages
				images={group.recentImages}
				videos={group.recentVideos}
				emoji={group.emoji}
				primaryColor={primaryColor}
				rarityLevel={group.rarityLevel}
				holographicEffect={isHovered}
				tcgMode={tcgMode}
				compact={compact}
			/>

			{/* Contenido */}
			<GroupCardContent
				description={group.description || undefined}
				category={group.category || undefined}
				organizationType={group.organizationType}
				flexibilityScore={group.flexibilityScore}
				filtersCount={filtersCount}
				entityCounts={entityCounts}
				primaryColor={primaryColor}
				tcgMode={tcgMode}
				compact={compact}
			/>

			{/* Pie */}
			<GroupCardFooter
				id={group.id}
				name={group.name}
				isFavorite={group.isFavorite}
				category={group.category || undefined}
				organizationType={group.organizationType}
				power={group.power}
				rarityLevel={group.rarityLevel}
				hp={group.hp}
				mp={group.mp}
				primaryColor={primaryColor}
				cardId={group.cardId}
				tcgMode={tcgMode}
				compact={compact}
				imagesCount={group._count.images}
				videosCount={group._count.videos}
			/>

			{/* Efecto holográfico general en modo TCG */}
			{tcgMode && isHovered && !disabled && (
				<motion.div
					className="absolute inset-0 pointer-events-none z-50 opacity-30 mix-blend-overlay"
					animate={{
						opacity: [0.1, 0.2, 0.1],
						background: [
							`linear-gradient(45deg, ${primaryColor}50, transparent)`,
							`linear-gradient(45deg, ${primaryColor}80, transparent)`,
							`linear-gradient(45deg, ${primaryColor}50, transparent)`,
						],
					}}
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
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={cn(
					'cursor-pointer text-left p-0 m-0 w-full border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-offset-2',
					!disabled && 'hover:opacity-100',
					disabled && 'cursor-not-allowed'
				)}
				type="button"
				disabled={disabled}
				aria-pressed={isSelected}
			>
				{cardContent}
			</button>
		);
	}

	// Si no hay onClick, lo envolvemos en un Link para navegar a la página del grupo
	return (
		<Link
			to={`/dashboard/groups/${group.id}`}
			className="block"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{cardContent}
		</Link>
	);
}
