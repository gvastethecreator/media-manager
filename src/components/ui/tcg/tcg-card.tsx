/**
 * @file Componente base de Card estilo TCG (Trading Card Game)
 * @module components/ui/tcg/tcg-card
 * @description Card con efectos 3D, shaders sutiles, bordes dinámicos y diseño inspirado en cartas de juego
 */

import type { ReactNode } from 'react';
import React, { forwardRef, memo } from 'react';
import { useTilt3D } from '@/hooks/use-tilt-3d';
import { cn } from '@/lib/utils';

/**
 * Rarezas de carta TCG
 */
export type TCGCardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * Props del componente TCGCard
 */
export interface TCGCardProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Color principal de la carta (variable CSS o valor) */
	accentColor?: string;
	/** Contenido de la carta */
	children: ReactNode;
	/** Clases adicionales para el contenido */
	contentClassName?: string;
	/** Si deshabilitar efectos 3D */
	disable3D?: boolean;
	/** Footer de la carta (stats, info) */
	footer?: ReactNode;
	/** Clases adicionales para el frame */
	frameClassName?: string;
	/** Efecto de brillo personalizado */
	glareIntensity?: number;
	/** Header de la carta (título, icono) */
	header?: ReactNode;
	/** Si está en modo compacto */
	isCompact?: boolean;
	/** Si está seleccionada */
	isSelected?: boolean;
	/** Rareza de la carta (afecta efectos visuales) */
	rarity?: TCGCardRarity;
	/** Color secundario para gradientes */
	secondaryColor?: string;
	/** Tamaño de la carta */
	size?: 'sm' | 'md' | 'lg' | 'xl';
	/** Thumbnail/Imagen de la carta */
	thumbnail?: ReactNode;
}

/**
 * Configuración de efectos por rareza
 */
const RARITY_EFFECTS: Record<TCGCardRarity, { glow: string; borderWidth: string; animation?: string }> = {
	common: {
		glow: 'var(--tcg-glow-1)',
		borderWidth: '2px',
	},
	uncommon: {
		glow: 'var(--tcg-glow-2)',
		borderWidth: '2px',
	},
	rare: {
		glow: 'var(--tcg-glow-3)',
		borderWidth: '3px',
		animation: 'tcg-shimmer 3s ease-in-out infinite',
	},
	epic: {
		glow: 'var(--tcg-glow-4)',
		borderWidth: '3px',
		animation: 'tcg-shimmer 2s ease-in-out infinite',
	},
	legendary: {
		glow: 'var(--tcg-glow-5)',
		borderWidth: '4px',
		animation: 'tcg-legendary-glow 2s ease-in-out infinite',
	},
	mythic: {
		glow: 'var(--tcg-glow-6)',
		borderWidth: '4px',
		animation: 'tcg-mythic-shimmer 1.5s ease-in-out infinite',
	},
};

/**
 * Tamaños de carta
 */
const CARD_SIZES = {
	sm: {
		width: '180px',
		minHeight: '240px',
		fontSize: '0.875rem',
	},
	md: {
		width: '220px',
		minHeight: '300px',
		fontSize: '1rem',
	},
	lg: {
		width: '280px',
		minHeight: '380px',
		fontSize: '1.125rem',
	},
	xl: {
		width: '340px',
		minHeight: '460px',
		fontSize: '1.25rem',
	},
};

/**
 * Componente TCGCard - Carta estilo Trading Card Game
 */
export const TCGCard = memo(
	forwardRef<HTMLDivElement, TCGCardProps>(
		(
			{
				children,
				accentColor = 'var(--primary)',
				secondaryColor,
				rarity = 'common',
				size = 'md',
				isSelected = false,
				isCompact = false,
				disable3D = false,
				thumbnail,
				header,
				footer,
				glareIntensity = 0.3,
				frameClassName,
				contentClassName,
				className,
				style,
				...props
			},
			ref
		) => {
			// Hook para efecto 3D
			const {
				ref: tiltRef,
				style: tiltStyle,
				glareStyle,
				handlers,
			} = useTilt3D({
				maxTilt: isCompact ? 10 : 15,
				scale: isCompact ? 1.02 : 1.03,
				transitionSpeed: 400,
				glareOpacity: glareIntensity,
				enableGlare: !disable3D,
				perspective: !disable3D,
			});

			// Merge refs
			const mergedRef = (node: HTMLDivElement | null) => {
				// Asignar al ref del tilt
				if (tiltRef.current !== node) {
					(tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
				}
				// Asignar al forwardRef
				if (typeof ref === 'function') {
					ref(node);
				} else if (ref) {
					ref.current = node;
				}
			};

			const rarityEffects = RARITY_EFFECTS[rarity];
			const sizeConfig = CARD_SIZES[size];

			// Estilos CSS custom properties dinámicas
			const customProperties: React.CSSProperties = {
				'--tcg-accent': accentColor,
				'--tcg-accent-secondary': secondaryColor || accentColor,
				'--tcg-glow': rarityEffects.glow,
				'--tcg-border-width': rarityEffects.borderWidth,
				'--tcg-width': sizeConfig.width,
				'--tcg-min-height': isCompact ? 'auto' : sizeConfig.minHeight,
				'--tcg-font-size': sizeConfig.fontSize,
				...style,
			} as React.CSSProperties;

			return (
				<div
					className={cn(
						'tcg-card',
						'tcg-card--interactive',
						isSelected && 'tcg-card--selected',
						isCompact && 'tcg-card--compact',
						disable3D && 'tcg-card--no-3d',
						className
					)}
					ref={mergedRef}
					style={{
						...customProperties,
						...(disable3D ? {} : tiltStyle),
					}}
					{...(disable3D ? {} : handlers)}
					{...props}
				>
					{/* Efecto de reflejo/glare */}
					{!disable3D && <div className="tcg-card__glare" style={glareStyle} />}

					{/* Frame exterior con borde dinámico */}
					<div className={cn('tcg-card__frame', frameClassName)} style={{ animation: rarityEffects.animation }}>
						{/* Capa de textura/grain sutil */}
						<div className="tcg-card__texture" />

						{/* Header de la carta */}
						{header && <div className="tcg-card__header">{header}</div>}

						{/* Área de thumbnail/imagen */}
						{thumbnail && (
							<div className="tcg-card__thumbnail-container">
								<div className="tcg-card__thumbnail-frame">{thumbnail}</div>
								{/* Overlay con gradiente para integración */}
								<div className="tcg-card__thumbnail-overlay" />
							</div>
						)}

						{/* Contenido principal */}
						<div className={cn('tcg-card__content', contentClassName)}>{children}</div>

						{/* Footer con stats/info */}
						{footer && <div className="tcg-card__footer">{footer}</div>}

						{/* Esquinas decorativas TCG */}
						<div className="tcg-card__corner tcg-card__corner--tl" />
						<div className="tcg-card__corner tcg-card__corner--tr" />
						<div className="tcg-card__corner tcg-card__corner--bl" />
						<div className="tcg-card__corner tcg-card__corner--br" />
					</div>

					{/* Indicador de selección */}
					{isSelected && (
						<div className="tcg-card__selection-indicator">
							<div className="tcg-card__selection-glow" />
						</div>
					)}
				</div>
			);
		}
	)
);

TCGCard.displayName = 'TCGCard';

/**
 * Componente para el header de carta TCG (título + coste/tipo)
 */
export interface TCGCardHeaderProps {
	/** Color de acento */
	accentColor?: string;
	/** Coste (mana, energía, etc) - elemento a la derecha */
	cost?: ReactNode;
	/** Título/Nombre de la carta */
	title: string;
	/** Icono o elemento visual del tipo */
	typeIcon?: ReactNode;
	/** Texto del tipo */
	typeText?: string;
}

export const TCGCardHeader = memo(function TCGCardHeader({
	title,
	typeIcon,
	typeText,
	cost,
	accentColor = 'var(--primary)',
}: TCGCardHeaderProps) {
	return (
		<div className="tcg-card-header" style={{ '--header-accent': accentColor } as React.CSSProperties}>
			<div className="tcg-card-header__main">
				{typeIcon && <div className="tcg-card-header__icon">{typeIcon}</div>}
				<div className="tcg-card-header__info">
					<h3 className="tcg-card-header__title" title={title}>
						{title}
					</h3>
					{typeText && <span className="tcg-card-header__type">{typeText}</span>}
				</div>
			</div>
			{cost && <div className="tcg-card-header__cost">{cost}</div>}
		</div>
	);
});

/**
 * Componente para stats de carta TCG
 */
export interface TCGCardStatsProps {
	/** Color de acento */
	accentColor?: string;
	/** Disposición: horizontal o vertical */
	layout?: 'horizontal' | 'vertical';
	/** Stats a mostrar */
	stats: { label: string; value: string | number; icon?: ReactNode }[];
}

export const TCGCardStats = memo(function TCGCardStats({
	stats,
	layout = 'horizontal',
	accentColor = 'var(--primary)',
}: TCGCardStatsProps) {
	return (
		<div
			className={cn('tcg-card-stats', `tcg-card-stats--${layout}`)}
			style={{ '--stats-accent': accentColor } as React.CSSProperties}
		>
			{stats.map((stat, index) => (
				<div className="tcg-card-stat" key={index}>
					{stat.icon && <div className="tcg-card-stat__icon">{stat.icon}</div>}
					<div className="tcg-card-stat__info">
						<span className="tcg-card-stat__value">{stat.value}</span>
						<span className="tcg-card-stat__label">{stat.label}</span>
					</div>
				</div>
			))}
		</div>
	);
});

/**
 * Componente para rareza/badges de carta
 */
export interface TCGCardBadgeProps {
	/** Texto del badge */
	children: ReactNode;
	/** Color personalizado */
	color?: string;
	/** Variante visual */
	variant?: 'rarity' | 'type' | 'set';
}

export const TCGCardBadge = memo(function TCGCardBadge({ children, variant = 'type', color }: TCGCardBadgeProps) {
	return (
		<span
			className={cn('tcg-card-badge', `tcg-card-badge--${variant}`)}
			style={color ? ({ '--badge-color': color } as React.CSSProperties) : undefined}
		>
			{children}
		</span>
	);
});

export default TCGCard;
