'use client';

import { EntityStats, type StatItem } from '@/components/ui/entity-stats';
import { ShineButton } from '@/components/ui/shine-border';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import Link from 'next/link';
import { CardContainer } from '../cards/card-container';
import { CardHeader } from '../cards/card-header';

export interface EntityCardProps {
	/**
	 * Título de la tarjeta
	 */
	title: string;

	/**
	 * Subtítulo opcional (categoría, tipo, etc.)
	 */
	subtitle?: string;

	/**
	 * Descripción corta
	 */
	description?: string;

	/**
	 * Icono para mostrar junto al título
	 */
	icon?: React.ReactNode;

	/**
	 * Color principal para la tarjeta en formato hex (#RRGGBB)
	 */
	primaryColor?: string;

	/**
	 * Color secundario para gradientes y efectos
	 */
	secondaryColor?: string;

	/**
	 * URL para navegación al hacer clic
	 */
	href?: string;

	/**
	 * Función personalizada para manejar el clic si no se usa href
	 */
	onClick?: () => void;

	/**
	 * Estadísticas a mostrar en la tarjeta
	 */
	stats?: StatItem[];

	/**
	 * Habilitar modo TCG (Trading Card Game) con estilo de carta coleccionable
	 */
	tcgMode?: boolean;

	/**
	 * Modo compacto con menos altura
	 */
	compact?: boolean;

	/**
	 * Si la tarjeta debe ser interactiva (con efectos hover, etc.)
	 */
	interactive?: boolean;

	/**
	 * Imágenes en miniatura para mostrar (máximo 4)
	 */
	thumbnails?: string[];

	/**
	 * Clases adicionales
	 */
	className?: string;

	/**
	 * Contenido adicional para el pie de la tarjeta
	 */
	footer?: React.ReactNode;

	/**
	 * Modo de animación para la tarjeta
	 */
	animationMode?: 'hover' | 'always' | 'none';
}

/**
 * Componente de tarjeta genérico para entidades de la aplicación.
 * Soporta múltiples modos de visualización y funcionalidades.
 */
export function EntityCard({
	title,
	subtitle,
	description,
	icon,
	primaryColor = '#3b82f6',
	secondaryColor,
	href,
	onClick,
	stats,
	tcgMode = false,
	compact = false,
	interactive = true,
	thumbnails,
	className,
	footer,
	animationMode = 'hover',
}: EntityCardProps) {
	// Generar color secundario si no se proporciona
	const computedSecondaryColor = secondaryColor || generateSecondaryColor(primaryColor);

	// Altura base según el modo compacto
	const baseHeight = compact ? 'h-[120px]' : 'h-[200px]';

	// Determinar si se debe usar Link o button
	const isClickable = href || onClick;

	// Contenido de la tarjeta
	const cardContent = (
		<CardContainer
			className={cn(
				baseHeight,
				'w-full transition-all',
				interactive && 'hover:shadow-md hover:scale-[1.02]',
				tcgMode && 'border-2 border-primary/20',
				className
			)}
			primaryColor={primaryColor}
			secondaryColor={computedSecondaryColor}
			tcgMode={tcgMode}
		>
			{/* Encabezado */}
			<CardHeader title={title} subtitle={subtitle} icon={icon} primaryColor={primaryColor} />

			{/* Contenido principal */}
			<div className="flex-1 p-3 flex flex-col">
				{/* Descripción */}
				{description && (
					<p className={cn('text-sm text-muted-foreground', compact ? 'line-clamp-1' : 'line-clamp-2')}>
						{description}
					</p>
				)}

				{/* Miniatura de imágenes si hay disponibles */}
				{thumbnails && thumbnails.length > 0 && (
					<div className="mt-2 flex gap-1">
						{thumbnails.slice(0, 4).map((src, idx) => (
							<div
								key={`${title}-thumb-${src.substring(src.lastIndexOf('/') + 1, src.length)}-${idx}`}
								className="w-10 h-10 overflow-hidden rounded-sm"
							>
								<img
									src={src}
									alt={`${title} thumbnail ${idx + 1}`}
									className="w-full h-full object-cover"
									loading="lazy"
								/>
							</div>
						))}
						{thumbnails.length > 4 && (
							<div className="w-10 h-10 flex items-center justify-center bg-muted rounded-sm text-xs">
								+{thumbnails.length - 4}
							</div>
						)}
					</div>
				)}

				{/* Espacio flexible para empujar estadísticas/footer al fondo */}
				<div className="flex-grow" />

				{/* Estadísticas en la parte inferior */}
				{stats && stats.length > 0 && (
					<div className="mt-auto">
						<EntityStats
							stats={stats}
							primaryColor={primaryColor}
							size="sm"
							animated={animationMode !== 'none'}
							asBadges={true}
						/>
					</div>
				)}

				{/* Footer opcional */}
				{footer && <div className="mt-2">{footer}</div>}
			</div>

			{/* Efectos de TCG */}
			{tcgMode && (
				<div className="absolute inset-0 pointer-events-none">
					<div
						className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-md"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-md"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-md"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-md"
						style={{ borderColor: primaryColor }}
					/>
				</div>
			)}
		</CardContainer>
	);

	// Animación de hover si está activada y es clickable
	const wrapWithAnimation = (content: React.ReactNode) => {
		if (!interactive || animationMode === 'none') return content;

		return (
			<motion.div
				whileHover={animationMode === 'hover' ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
				animate={
					animationMode === 'always'
						? { y: [0, -5, 0], transition: { duration: 2, repeat: Number.MAX_SAFE_INTEGER } }
						: undefined
				}
				className="w-full"
			>
				{content}
			</motion.div>
		);
	};

	// Envolver con componente de botón si tiene onClick
	if (onClick && !href) {
		return (
			<button
				onClick={onClick}
				className="w-full text-left p-0 m-0 bg-transparent border-0 cursor-pointer"
				type="button"
			>
				{wrapWithAnimation(cardContent)}
			</button>
		);
	}

	// Envolver con Link si tiene href
	if (href) {
		return wrapWithAnimation(
			<Link href={href} className="block">
				{tcgMode ? <ShineButton>{cardContent}</ShineButton> : cardContent}
			</Link>
		);
	}

	// Sin interacción
	return wrapWithAnimation(cardContent);
}

/**
 * Genera un color secundario más oscuro a partir del color primario
 */
function generateSecondaryColor(primaryColor: string): string {
	try {
		// Convertir hex a RGB y oscurecer
		const r = Number.parseInt(primaryColor.slice(1, 3), 16);
		const g = Number.parseInt(primaryColor.slice(3, 5), 16);
		const b = Number.parseInt(primaryColor.slice(5, 7), 16);

		const darkenFactor = 0.7;
		const darkerR = Math.floor(r * darkenFactor);
		const darkerG = Math.floor(g * darkenFactor);
		const darkerB = Math.floor(b * darkenFactor);

		return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
	} catch (e) {
		return '#2563eb';
	}
}
