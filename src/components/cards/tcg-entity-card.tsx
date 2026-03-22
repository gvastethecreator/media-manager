/**
 * @file Componente TCG Entity Card - Integración de cartas TCG con entidades
 * @module components/cards/tcg-entity-card
 * @description Card estilo TCG que representa cualquier tipo de entidad con todos sus datos
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { TCGCard, TCGCardBadge, TCGCardHeader, type TCGCardRarity, TCGCardStats } from '@/components/ui/tcg/tcg-card';
import { useEntityTypeConfig } from '@/hooks/use-entity-type-config';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { getEntityStatsType } from '@/types/entity-guards';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

/**
 * Props para TCGEntityCard
 */
export interface TCGEntityCardProps {
	/** Clases adicionales */
	className?: string;
	/** Si deshabilitar efectos 3D */
	disable3D?: boolean;
	/** Entidad a mostrar */
	entity: AnyEntityWithStats;
	/** Si está en modo compacto */
	isCompact?: boolean;
	/** Si está seleccionada */
	isSelected?: boolean;
	/** Callback al hacer clic */
	onClick?: (e: React.MouseEvent) => void;
	/** Callback al hacer doble clic */
	onDoubleClick?: () => void;
	/** Rareza calculada automáticamente o especificada */
	rarity?: TCGCardRarity;
	/** Tamaño de la carta */
	size?: 'sm' | 'md' | 'lg' | 'xl';
	/** Calidad del thumbnail */
	thumbnailQuality?: 'low' | 'medium' | 'high';
}

/**
 * Determina la rareza de la carta basada en estadísticas de la entidad
 */
function determineRarity(entity: AnyEntityWithStats): TCGCardRarity {
	// @ts-expect-error - Las entidades con stats tienen _count
	const stats = entity._count || {};
	const totalRelations = Object.values(stats).reduce(
		(sum: number, val: unknown) => sum + (typeof val === 'number' ? val : 0),
		0
	);

	if (totalRelations > 50) return 'mythic';
	if (totalRelations > 20) return 'legendary';
	if (totalRelations > 10) return 'epic';
	if (totalRelations > 5) return 'rare';
	if (totalRelations > 2) return 'uncommon';
	return 'common';
}

/**
 * Obtiene el conteo total de relaciones para mostrar
 */
function getTotalRelations(entity: AnyEntityWithStats): number {
	// @ts-expect-error
	const stats = entity._count || {};
	return Object.values(stats).reduce((sum: number, val: unknown) => sum + (typeof val === 'number' ? val : 0), 0);
}

/**
 * Componente TCG Entity Card
 * Muestra cualquier entidad en formato de carta TCG
 */
export const TCGEntityCard = memo(function TCGEntityCard({
	entity,
	isSelected = false,
	onClick,
	onDoubleClick,
	size = 'md',
	isCompact = false,
	rarity: propRarity,
	className,
	thumbnailQuality = 'medium',
	disable3D = false,
}: TCGEntityCardProps) {
	// Obtener tipo de entidad y configuración
	const entityType = useMemo(() => getEntityStatsType(entity) ?? EntityStatsType.IMAGE, [entity]);
	const { config, color, icon: IconComponent, displayName, emoji } = useEntityTypeConfig(entityType);

	// Determinar rareza
	const rarity = propRarity ?? determineRarity(entity);

	// Construir URL del thumbnail
	const thumbnailUrl = useMemo(() => {
		if ('thumbnailUrl' in entity && typeof entity.thumbnailUrl === 'string') {
			return entity.thumbnailUrl;
		}

		// URLs por tipo de entidad
		const sizeMap = { low: 128, medium: 256, high: 512 };
		const size_param = sizeMap[thumbnailQuality];

		switch (entityType) {
			case EntityStatsType.IMAGE:
				return `/api/images/${entity.id}/thumbnail?width=${size_param}`;
			case EntityStatsType.VIDEO:
				return `/api/videos/${entity.id}/thumbnail?width=${size_param}`;
			case EntityStatsType.AUDIO:
				return `/api/audio/${entity.id}/waveform?width=${size_param}`;
			case EntityStatsType.DOCUMENT:
				return `/api/documents/${entity.id}/thumbnail?width=${size_param}`;
			case EntityStatsType.FOLDER:
				return `/api/folders/${entity.id}/preview?width=${size_param}`;
			default:
				return '';
		}
	}, [entity, entityType, thumbnailQuality]);

	// Estado y ref para manejar errores de carga de imagen
	const imgRef = useRef<HTMLImageElement>(null);
	const [thumbnailError, setThumbnailError] = useState(false);

	// Manejar errores de carga de imagen via event listener
	useEffect(() => {
		const img = imgRef.current;
		if (img && thumbnailUrl && !thumbnailError) {
			const handleError = () => setThumbnailError(true);
			img.addEventListener('error', handleError);
			return () => img.removeEventListener('error', handleError);
		}
	}, [thumbnailUrl, thumbnailError]);

	// Preparar stats para el footer
	const stats = useMemo(() => {
		// @ts-expect-error
		const counts = entity._count || {};
		const result: { label: string; value: string | number; icon?: React.ReactNode }[] = [];

		// Stat: Relaciones totales
		const totalRelations = getTotalRelations(entity);
		if (totalRelations > 0) {
			result.push({
				label: 'Links',
				value: totalRelations,
			});
		}

		// Stats específicos por tipo
		if (counts.images !== undefined) {
			result.push({ label: 'Imgs', value: counts.images });
		}
		if (counts.videos !== undefined) {
			result.push({ label: 'Vids', value: counts.videos });
		}
		if (counts.audios !== undefined) {
			result.push({ label: 'Aud', value: counts.audios });
		}
		if (counts.tags !== undefined) {
			result.push({ label: 'Tags', value: counts.tags });
		}
		if (counts.albums !== undefined) {
			result.push({ label: 'Alb', value: counts.albums });
		}
		if (counts.collections !== undefined) {
			result.push({ label: 'Col', value: counts.collections });
		}

		return result.slice(0, 3); // Máximo 3 stats
	}, [entity]);

	// Renderizar thumbnail
	const thumbnailElement = useMemo(() => {
		if (thumbnailUrl && !thumbnailError) {
			return (
				<img
					alt={entity.name || 'Entity thumbnail'}
					className="h-full w-full object-cover"
					height={256}
					loading="lazy"
					ref={imgRef}
					src={thumbnailUrl}
					width={256}
				/>
			);
		}

		// Fallback: Icono del tipo de entidad
		return (
			<div
				className="flex h-full w-full items-center justify-center"
				style={{
					background: `color-mix(in oklch, ${color} 20%, transparent)`,
				}}
			>
				<IconComponent className="h-16 w-16 opacity-50" style={{ color }} />
			</div>
		);
	}, [thumbnailUrl, thumbnailError, entity.name, color]);

	// Header con nombre y tipo
	const headerElement = useMemo(
		() => (
			<TCGCardHeader
				accentColor={color}
				cost={<span className="text-sm">{emoji}</span>}
				title={entity.name || 'Sin nombre'}
				typeIcon={<IconComponent className="h-4 w-4" />}
				typeText={displayName}
			/>
		),
		[entity.name, displayName, color, emoji]
	);

	// Footer con stats
	const footerElement = useMemo(() => {
		if (stats.length === 0) return null;

		return (
			<div className="flex items-center justify-between">
				<TCGCardStats accentColor={color} layout="horizontal" stats={stats} />
				<TCGCardBadge color={color} variant="rarity">
					{rarity}
				</TCGCardBadge>
			</div>
		);
	}, [stats, color, rarity]);

	return (
		<TCGCard
			accentColor={color}
			className={cn('tcg-entity-card', className)}
			disable3D={disable3D}
			footer={footerElement}
			header={headerElement}
			isCompact={isCompact}
			isSelected={isSelected}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			rarity={rarity}
			size={size}
			thumbnail={thumbnailElement}
		>
			{/* Descripción o contenido adicional */}
			{!isCompact && 'description' in entity && entity.description && (
				<p className="tcg-entity-card__description line-clamp-3 text-muted-foreground text-sm">{entity.description}</p>
			)}

			{/* Metadatos adicionales */}
			{!isCompact && (
				<div className="tcg-entity-card__meta mt-auto flex flex-wrap gap-1">
					{'format' in entity && entity.format && (
						<TCGCardBadge color={color} variant="type">
							{entity.format}
						</TCGCardBadge>
					)}
					{'size' in entity && typeof entity.size === 'number' && (
						<TCGCardBadge color={color} variant="type">
							{formatFileSize(entity.size)}
						</TCGCardBadge>
					)}
				</div>
			)}
		</TCGCard>
	);
});

/**
 * Formatea tamaño de archivo
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export default TCGEntityCard;
