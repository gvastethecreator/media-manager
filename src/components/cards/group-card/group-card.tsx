import { motion } from 'motion/react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GroupCardContent } from './group-card-content';
import { GroupCardFooter } from './group-card-footer';
import { GroupCardHeader } from './group-card-header';
import { GroupCardImages } from './group-card-images';
import type { GroupCardData } from './group-server-actions';

export interface GroupCardProps {
	group: GroupCardData;
	onClick?: (group: GroupCardData) => void;
	className?: string;
	tcgMode?: boolean;
	compact?: boolean;
	disabled?: boolean;
	isSelected?: boolean;
}

/**
 * Card para mostrar un grupo en estilo TCG
 */
export function GroupCard({
	group,
	onClick,
	className,
	tcgMode = true,
	compact = false,
	disabled = false,
	isSelected = false,
}: GroupCardProps) {
	// Estado para el efecto de hover
	const [isHovered, setIsHovered] = useState(false);

	// Calcular colores
	const primaryColor = useMemo(() => group.color || '#3b82f6', [group.color]);
	const _secondaryColor = useMemo(() => {
		if (!group.color) return '#2563eb';

		try {
			// Convertir hex a RGB y oscurecer
			const r = Number.parseInt(group.color.slice(1, 3), 16);
			const g = Number.parseInt(group.color.slice(3, 5), 16);
			const b = Number.parseInt(group.color.slice(5, 7), 16);

			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			return '#2563eb';
		}
	}, [group.color]);

	// Preparar media para la galería
	const _allMedia = useMemo(() => {
		return [...(group.recentImages || []), ...(group.recentVideos || [])];
	}, [group.recentImages, group.recentVideos]);

	// Función de manejadores de eventos
	const handleClick = () => {
		if (onClick && !disabled) {
			onClick(group);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onClick(group);
		}
	};

	// Determinar el número total de entidades
	const entityCounts = useMemo(
		() => ({
			images: group._count.images,
			videos: group._count.videos,
			albums: group._count.albums,
			collections: group._count.collections,
			tags: group._count.tags,
			characters: group._count.characters,
			places: group._count.places,
			worldItems: group._count.worldItems,
			concepts: group._count.concepts,
			prompts: group._count.prompts,
			notes: group._count.notes,
			wildcards: group._count.wildcards,
			properties: group._count.properties,
		}),
		[group._count]
	);

	// Preparar filters count
	const filtersCount = useMemo(() => {
		if (Array.isArray(group.filters)) {
			return group.filters.length;
		}
		return 0;
	}, [group.filters]);

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
				...(isSelected && ({ '--tw-ring-color': primaryColor } as React.CSSProperties)),
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
							`linear-gradient(45deg, transparent, ${primaryColor}50, transparent)`,
							`linear-gradient(45deg, transparent, ${primaryColor}80, transparent)`,
							`linear-gradient(45deg, transparent, ${primaryColor}50, transparent)`,
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

// Exportar también un componente memorizado
export const MemoizedGroupCard = React.memo(GroupCard);
