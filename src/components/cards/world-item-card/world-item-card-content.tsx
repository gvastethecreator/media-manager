import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';
import { useTheme } from '@/lib/contexts/theme-context';
import { cn } from '@/lib/utils';
import worldItemService from '@/services/world-item/world-item.service';
import type { PropertyWithStats } from '@/types/entities/property/base';
import type {
	WorldItemEffect,
	WorldItemProperty,
	WorldItemRequirement,
	WorldItemStats,
} from '@/types/entities/world-item/stats-types';

const { getRecentWorldItemImages } = worldItemService;

interface WorldItemCardContentProps {
	description?: string | null;
	properties?: PropertyWithStats[] | string | null;
	requirements?: Record<string, WorldItemRequirement> | string | null;
	attributes?: string[] | string | null;
	effects?: WorldItemEffect[] | string | null;
	stats?: WorldItemStats | string | null;
	origin?: string | null;
	rarity?: string | null;
	primaryColor?: string;
}

/**
 * Componente para mostrar el contenido principal de una tarjeta de objeto del mundo.
 * Incluye descripción, propiedades, requerimientos, atributos, efectos y estadísticas.
 */
export function WorldItemCardContent({
	description,
	properties,
	requirements,
	attributes,
	effects,
	stats,
	origin,
	rarity,
	primaryColor = '#3b82f6',
}: WorldItemCardContentProps) {
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	// Generar un ID de renderizado único
	const renderKey = React.useMemo(() => nanoid(), []);

	// Procesar propiedades si es un string o formato JSON
	const parsedProperties = useMemo(() => {
		if (typeof properties === 'string' && properties) {
			try {
				return JSON.parse(properties);
			} catch (_e) {
				return [];
			}
		}
		return properties || [];
	}, [properties]);

	// Procesar requerimientos si es un string o formato JSON
	const parsedRequirements = useMemo(() => {
		if (typeof requirements === 'string' && requirements) {
			try {
				return JSON.parse(requirements);
			} catch (_e) {
				return {};
			}
		}
		return requirements || {};
	}, [requirements]);

	// Procesar atributos si es un string o formato JSON
	const parsedAttributes = useMemo(() => {
		if (typeof attributes === 'string' && attributes) {
			try {
				return JSON.parse(attributes);
			} catch (_e) {
				return [];
			}
		}
		return attributes || [];
	}, [attributes]);

	// Procesar efectos si es un string o formato JSON
	const parsedEffects = useMemo(() => {
		if (typeof effects === 'string' && effects) {
			try {
				return JSON.parse(effects);
			} catch (_e) {
				return [];
			}
		}
		return effects || [];
	}, [effects]);

	// Procesar estadísticas si es un string o formato JSON
	const parsedStats = useMemo(() => {
		if (typeof stats === 'string' && stats) {
			try {
				return JSON.parse(stats);
			} catch (_e) {
				return {};
			}
		}
		return stats || {};
	}, [stats]);

	return (
		<div
			className="flex flex-col flex-1 p-3 gap-2 text-xs overflow-hidden"
			style={{
				borderTop: `1px solid ${primaryColor}20`,
				borderBottom: `1px solid ${primaryColor}20`,
				background: `linear-gradient(180deg, transparent 0%, ${primaryColor}05 50%, transparent 100%)`,
			}}
		>
			{/* Descripción */}
			{description && <div className="mb-1 italic text-muted-foreground">{description}</div>}

			{/* Atributos */}
			{parsedAttributes && parsedAttributes.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{parsedAttributes.map((attr: string, _index: number) => (
						<span
							key={`attr-${renderKey}-${attr}`}
							className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
							style={{
								backgroundColor: `${primaryColor}20`,
								color: isDark ? 'white' : primaryColor,
							}}
						>
							{attr}
						</span>
					))}
				</div>
			)}

			{/* Origen */}
			{origin && (
				<div className="text-xs text-muted-foreground">
					<span className="font-semibold text-foreground" style={{ color: primaryColor }}>
						Origen:
					</span>{' '}
					{origin}
				</div>
			)}

			{/* Propiedades */}
			{parsedProperties && parsedProperties.length > 0 && (
				<div className="mt-1">
					{parsedProperties.map((prop: WorldItemProperty, index: number) => (
						<div
							key={`prop-${renderKey}-${prop.name || `property-${index + 1}`}`}
							className="flex justify-between mb-0.5 text-xs"
						>
							<span className="font-medium">{prop.name || 'Propiedad'}</span>
							<span className="text-muted-foreground">{String(prop.value || '')}</span>
						</div>
					))}
				</div>
			)}

			{/* Estadísticas */}
			{parsedStats && Object.keys(parsedStats).length > 0 && (
				<div
					className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-dashed pt-1"
					style={{ borderColor: `${primaryColor}30` }}
				>
					{Object.entries(parsedStats).map(([key, value]) => (
						<div key={`stat-${renderKey}-${key}`} className="flex justify-between text-[10px]">
							<span className="font-semibold" style={{ color: primaryColor }}>
								{key}:
							</span>
							<span>{typeof value === 'number' ? value : String(value || '')}</span>
						</div>
					))}
				</div>
			)}

			{/* Efectos */}
			{parsedEffects && parsedEffects.length > 0 && (
				<div className="mt-1 border-t border-dashed pt-1" style={{ borderColor: `${primaryColor}30` }}>
					<div className="font-semibold mb-0.5 text-xs" style={{ color: primaryColor }}>
						Efectos:
					</div>
					{parsedEffects.map((effect: WorldItemEffect, index: number) => (
						<div key={`effect-${renderKey}-${effect.name || `effect-${index + 1}`}`} className="text-[10px] mb-0.5">
							<span className="font-medium">{String(effect.name || '')}: </span>
							<span className="text-muted-foreground">{String(effect.description || '')}</span>
						</div>
					))}
				</div>
			)}

			{/* Requerimientos */}
			{parsedRequirements && Object.keys(parsedRequirements).length > 0 && (
				<div className="mt-1 border-t border-dashed pt-1" style={{ borderColor: `${primaryColor}30` }}>
					<div className="font-semibold mb-0.5 text-xs" style={{ color: primaryColor }}>
						Requisitos:
					</div>
					{Object.entries(parsedRequirements).map(([key, req]) => (
						<div key={`req-${renderKey}-${key}`} className="text-[10px] mb-0.5">
							<span className="font-medium">{key}: </span>
							<span className="text-muted-foreground">
								{typeof req === 'object' && req !== null && 'value' in req
									? String((req as any).value || '')
									: String(req || '')}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Rareza */}
			{rarity && (
				<div
					className={cn(
						'mt-auto pt-1 text-center font-semibold text-[10px] rounded-sm',
						rarity.toLowerCase() === 'legendary' && 'animate-pulse'
					)}
					style={{
						color: primaryColor,
						textShadow: rarity.toLowerCase() === 'legendary' ? `0 0 5px ${primaryColor}80` : undefined,
					}}
				>
					{rarity.toUpperCase()}
				</div>
			)}
		</div>
	);
}
