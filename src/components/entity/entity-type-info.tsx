/**
 * @file Componente de información de tipo de entidad integrado
 * @module components/entity/entity-type-info
 * @description Componente que usa EntityTypeConfig para mostrar información
 * completa sobre tipos de entidad en diferentes contextos
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEntityTypeConfig } from '@/hooks/use-entity-type-config';
import { type AnyEntityWithStats, getEntityStatsType } from '@/types/migration';
import { EntityTypeBadge } from './entity-type-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Eye,
	Edit3,
	Trash2,
	Star,
	Share2,
	Download,
	ExternalLink,
	MoreHorizontal
} from 'lucide-react';

interface EntityTypeInfoProps {
	/** Entidad para mostrar información */
	entity: AnyEntityWithStats;
	/** Modo de visualización */
	mode?: 'compact' | 'detailed' | 'full';
	/** Si mostrar acciones disponibles */
	showActions?: boolean;
	/** Si mostrar estadísticas */
	showStats?: boolean;
	/** Clases CSS adicionales */
	className?: string;
	/** Callbacks para acciones */
	onAction?: (action: string, entity: AnyEntityWithStats) => void;
}

/**
 * Mapeo de acciones a iconos
 */
const actionIcons = {
	view: Eye,
	edit: Edit3,
	delete: Trash2,
	'favorite-toggle': Star,
	share: Share2,
	download: Download,
	'open-in-explorer': ExternalLink,
	more: MoreHorizontal,
};

/**
 * Componente principal de información de tipo de entidad
 */
export const EntityTypeInfo = memo<EntityTypeInfoProps>(({
	entity,
	mode = 'detailed',
	showActions = false,
	showStats = true,
	className,
	onAction,
}) => {
	const entityType = getEntityStatsType(entity);
	if (!entityType) return null;

	const { config } = useEntityTypeConfig(entityType);
	if (!config) return null;

	// Renderizar modo compacto
	if (mode === 'compact') {
		return (
			<div className={cn('flex items-center gap-2', className)}>
				<EntityTypeBadge type={entityType} size="sm" />
				<span className="text-sm text-muted-foreground truncate">
					{entity.name || 'Sin nombre'}
				</span>
			</div>
		);
	}

	// Renderizar acciones disponibles
	const renderActions = () => {
		if (!showActions || !config.supportedOperations) return null;

		return (
			<div className="flex items-center gap-1">
				{config.supportedOperations.slice(0, 4).map((action) => {
					const IconComponent = actionIcons[action as keyof typeof actionIcons];
					if (!IconComponent) return null;

					return (
						<Button
							key={action}
							variant="ghost"
							size="sm"
							onClick={() => onAction?.(action, entity)}
							className="h-8 w-8 p-0"
						>
							<IconComponent className="h-4 w-4" />
						</Button>
					);
				})}
				{config.supportedOperations.length > 4 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onAction?.('more', entity)}
						className="h-8 w-8 p-0"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				)}
			</div>
		);
	};

	// Renderizar estadísticas de la entidad
	const renderStats = () => {
		if (!showStats) return null;

		// Estadísticas básicas disponibles en todas las entidades
		const stats = [];

		if ('createdAt' in entity && entity.createdAt) {
			stats.push({
				label: 'Creado',
				value: new Date(entity.createdAt).toLocaleDateString()
			});
		}

		if ('updatedAt' in entity && entity.updatedAt) {
			stats.push({
				label: 'Modificado',
				value: new Date(entity.updatedAt).toLocaleDateString()
			});
		}

		if ('size' in entity && entity.size) {
			stats.push({
				label: 'Tamaño',
				value: formatFileSize(entity.size as number)
			});
		}

		if (stats.length === 0) return null;

		return (
			<div className="grid grid-cols-2 gap-2 text-xs">
				{stats.map((stat, index) => (
					<div key={index} className="flex flex-col">
						<span className="text-muted-foreground">{stat.label}</span>
						<span className="font-medium">{stat.value}</span>
					</div>
				))}
			</div>
		);
	};

	// Renderizar modo detallado
	if (mode === 'detailed') {
		return (
			<motion.div
				className={cn(
					'rounded-lg border bg-card p-4 space-y-3',
					className
				)}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div
							className="p-2 rounded-md"
							style={{ backgroundColor: `${config.color}20` }}
						>
							<config.icon
								className="h-5 w-5"
								style={{ color: config.color }}
							/>
						</div>
						<div>
							<h3 className="font-medium truncate">
								{entity.name || 'Sin nombre'}
							</h3>
							<p className="text-sm text-muted-foreground">
								{config.displayName}
							</p>
						</div>
					</div>
					{renderActions()}
				</div>
				{renderStats()}
			</motion.div>
		);
	}

	// Renderizar modo completo
	return (
		<motion.div
			className={cn(
				'rounded-lg border bg-card p-6 space-y-4',
				className
			)}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
		>
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-4">
					<div
						className="p-3 rounded-lg"
						style={{ backgroundColor: `${config.color}20` }}
					>
						<config.icon
							className="h-8 w-8"
							style={{ color: config.color }}
						/>
					</div>
					<div>
						<h2 className="text-xl font-semibold">
							{entity.name || 'Sin nombre'}
						</h2>
						<div className="flex items-center gap-2 mt-1">
							<EntityTypeBadge type={entityType} />
							<Badge variant="outline">
								{config.emoji} {config.displayName}
							</Badge>
						</div>
					</div>
				</div>
				{renderActions()}
			</div>

			{/* Información adicional basada en el tipo */}
			<div className="text-sm text-muted-foreground">
				Tipo de entidad: {config.displayName}
			</div>

			{renderStats()}
		</motion.div>
	);
});

EntityTypeInfo.displayName = 'EntityTypeInfo';

/**
 * Variante de header compacta para usar en listas
 */
export const EntityTypeHeader = memo<{
	entity: AnyEntityWithStats;
	className?: string;
}>(({ entity, className }) => {
	const entityType = getEntityStatsType(entity);
	if (!entityType) return null;

	const { config } = useEntityTypeConfig(entityType);
	if (!config) return null;

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<config.icon
				className="h-4 w-4 flex-shrink-0"
				style={{ color: config.color }}
			/>
			<span className="text-sm font-medium truncate">
				{entity.name || 'Sin nombre'}
			</span>
			<Badge variant="secondary" className="ml-auto">
				{config.emoji}
			</Badge>
		</div>
	);
});

EntityTypeHeader.displayName = 'EntityTypeHeader';

/**
 * Utilidad para formatear tamaños de archivo
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
