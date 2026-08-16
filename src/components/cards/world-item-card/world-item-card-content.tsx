import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';
import { useTheme } from '@/components/ui/theme-provider';
import { cn } from '@/lib/utils';
import type {
	WorldItemEffect,
	WorldItemProperty,
	WorldItemRequirement,
	WorldItemStats,
} from '@/types/entities/world-item/stats-types';

interface WorldItemCardContentProps {
	attributes?: string[] | string | null;
	description?: string | null;
	effects?: WorldItemEffect[] | string | null;
	origin?: string | null;
	primaryColor?: string;
	properties?: WorldItemProperty[] | string | null;
	rarity?: string | null;
	requirements?: Record<string, WorldItemRequirement> | string | null;
	stats?: WorldItemStats | string | null;
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
	primaryColor = 'var(--dt-primary-500)',
}: WorldItemCardContentProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

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
			className="flex flex-1 flex-col gap-2 overflow-hidden p-4 text-sm"
			style={{
				borderTop: `1px solid ${primaryColor}20`,
				borderBottom: `1px solid ${primaryColor}20`,
				background: `linear-gradient(180deg, transparent 0%, ${primaryColor}05 50%, transparent 100%)`,
			}}
		>
			{/* Descripción */}
			{description && <div className="mb-1 text-muted-foreground italic">{description}</div>}

			{/* Atributos */}
			{parsedAttributes && parsedAttributes.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{parsedAttributes.map((attr: string, _index: number) => (
						<span
							className="rounded-sm px-1.5 py-0.5 font-medium text-xs"
							key={`attr-${renderKey}-${attr}`}
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
				<div className="text-muted-foreground text-sm">
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
							className="mb-0.5 flex justify-between text-sm"
							key={`prop-${renderKey}-${prop.name || `property-${index + 1}`}`}
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
						<div className="flex justify-between text-xs" key={`stat-${renderKey}-${key}`}>
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
					<div className="mb-0.5 font-semibold text-sm" style={{ color: primaryColor }}>
						Efectos:
					</div>
					{parsedEffects.map((effect: WorldItemEffect, index: number) => (
						<div className="mb-0.5 text-xs" key={`effect-${renderKey}-${effect.name || `effect-${index + 1}`}`}>
							<span className="font-medium">{String(effect.name || '')}: </span>
							<span className="text-muted-foreground">{String(effect.description || '')}</span>
						</div>
					))}
				</div>
			)}

			{/* Requerimientos */}
			{parsedRequirements && Object.keys(parsedRequirements).length > 0 && (
				<div className="mt-1 border-t border-dashed pt-1" style={{ borderColor: `${primaryColor}30` }}>
					<div className="mb-0.5 font-semibold text-sm" style={{ color: primaryColor }}>
						Requisitos:
					</div>
					{Object.entries(parsedRequirements).map(([key, req]) => (
						<div className="mb-0.5 text-xs" key={`req-${renderKey}-${key}`}>
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
						'mt-auto rounded-sm pt-1 text-center font-semibold text-xs',
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
