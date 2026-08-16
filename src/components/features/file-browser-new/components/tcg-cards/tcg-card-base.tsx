/**
 * @file TCG Card Base - Componente base para tarjetas estilo Trading Card Game
 * @module file-browser-new/components/tcg-cards/tcg-card-base
 * @description Base component con efectos holográficos y animaciones
 */

import gsap from 'gsap';
import type { CSSProperties, ReactNode } from 'react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { BrowserItem } from '../../types/item.types';
import './tcg-cards.css';

// ============================================================================
// TIPOS
// ============================================================================

export interface TCGCardBaseProps {
	/** Color de acento de la entidad */
	accentColor: string;
	/** Permite animación de entrada */
	animateIn?: boolean;
	/** Estilos adicionales */
	className?: string;
	/** Contenido del footer (info) */
	footerContent?: ReactNode;
	/** Alto de la tarjeta en px (calculado automático si no se provee) */
	height?: number;
	/** Si está activa */
	isActive?: boolean;
	/** Si está seleccionada */
	isSelected?: boolean;
	item: BrowserItem;
	/** Orden para animación escalonada */
	layoutOrder?: number;
	/** Handlers */
	onClick?: (e: React.MouseEvent) => void;
	onContextMenu?: (e: React.MouseEvent) => void;
	onDoubleClick?: () => void;
	/** Rareza visual (afecta brillo/efecto) */
	rarity?: 'common' | 'rare' | 'epic' | 'legendary';
	style?: CSSProperties;
	testId?: string;
	/** Contenido del thumbnail */
	thumbnailContent: ReactNode;
	/** Variante de la tarjeta */
	variant: 'grid' | 'card' | 'masonry' | 'list';
	/** Ancho de la tarjeta en px */
	width: number;
}

// ============================================================================
// UTILIDADES
// ============================================================================

const ANIMATED_CARD_IDS = new Set<string>();

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const TCGCardBase = memo(
	function TCGCardBase({
		item,
		width,
		height,
		variant,
		isSelected = false,
		isActive = false,
		animateIn = true,
		layoutOrder,
		thumbnailContent,
		footerContent,
		accentColor,
		rarity = 'common',
		onClick,
		onDoubleClick,
		onContextMenu,
		className,
		style,
		testId,
	}: TCGCardBaseProps) {
		const cardRef = useRef<HTMLButtonElement>(null);

		// Calcular altura basada en ratio TCG (típico: 2.5:3.5 o ~0.714)
		const cardHeight = height ?? Math.round(width * 1.35);
		const isMasonry = variant === 'masonry';
		const showFooter = !isMasonry && footerContent;
		const resolvedHeight = isMasonry ? (height ? `${height}px` : 'auto') : `${cardHeight}px`;

		// Animación de entrada - solo en mount inicial y si no se ha animado antes
		// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only animation
		useEffect(() => {
			const card = cardRef.current;
			// Early exit checks para minimizar trabajo
			if (!(animateIn && card)) return;
			if (prefersReducedMotion()) return;
			if (ANIMATED_CARD_IDS.has(item.id)) return;

			// Marcar como animado inmediatamente para evitar re-runs
			ANIMATED_CARD_IDS.add(item.id);

			// Usar requestAnimationFrame para no bloquear el hilo principal
			const rafId = requestAnimationFrame(() => {
				const delay = layoutOrder != null ? Math.min(layoutOrder * 20, 200) : 0;

				// Programar animación sin bloquear el hilo principal
				const timer = setTimeout(() => {
					gsap.fromTo(
						card,
						{ opacity: 0, y: 12, scale: 0.96 },
						{ opacity: 1, y: 0, scale: 1, ease: 'power1.out', duration: 0.35, delay: delay / 1000 }
					);
				}, 0);

				return () => clearTimeout(timer);
			});

			return () => cancelAnimationFrame(rafId);
		}, []); // Solo ejecutar en mount

		// Efecto de hover 3D
		const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
			if (prefersReducedMotion()) return;
			const card = cardRef.current;
			if (!card) return;

			const rect = card.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const centerX = rect.width / 2;
			const centerY = rect.height / 2;

			const rotateX = ((y - centerY) / centerY) * -8;
			const rotateY = ((x - centerX) / centerX) * 8;

			card.style.setProperty('--rotate-x', `${rotateX}deg`);
			card.style.setProperty('--rotate-y', `${rotateY}deg`);
			card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
			card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
		}, []);

		const handleMouseLeave = useCallback(() => {
			const card = cardRef.current;
			if (!card) return;
			card.style.setProperty('--rotate-x', '0deg');
			card.style.setProperty('--rotate-y', '0deg');
		}, []);

		return (
			<button
				className={cn(
					'tcg-card',
					`tcg-card--${variant}`,
					`tcg-card--${rarity}`,
					isSelected && 'tcg-card--selected',
					isActive && 'tcg-card--active',
					className
				)}
				data-entity-type={item.entityType}
				data-item-id={item.id}
				data-testid={testId}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				onMouseLeave={handleMouseLeave}
				onMouseMove={handleMouseMove}
				ref={cardRef}
				style={
					{
						'--card-width': `${width}px`,
						'--card-height': resolvedHeight,
						'--accent-color': accentColor,
						'--thumb-url': item.thumbnailUrl ? `url("${item.thumbnailUrl}")` : 'none',
						...style,
					} as CSSProperties
				}
				type="button"
			>
				{/* Capa de efecto holográfico */}
				<div className="tcg-card__holo" />

				{/* Borde con gradiente */}
				<div className="tcg-card__border" />

				{/* Contenido interno */}
				<div className="tcg-card__inner">
					{/* Área del thumbnail */}
					<div className="tcg-card__thumbnail">{thumbnailContent}</div>

					{/* Footer con info */}
					{showFooter && <div className="tcg-card__footer">{footerContent}</div>}
				</div>

				{/* Indicador de selección */}
				{isSelected && <div className="tcg-card__selection-glow" />}
			</button>
		);
	},
	(prev, next) => {
		// Custom comparison: only re-render if important props change
		// Ignore function references for handlers (they should be stable)
		return (
			prev.item.id === next.item.id &&
			prev.item.entityType === next.item.entityType &&
			prev.width === next.width &&
			prev.height === next.height &&
			prev.variant === next.variant &&
			prev.isSelected === next.isSelected &&
			prev.isActive === next.isActive &&
			prev.accentColor === next.accentColor &&
			prev.className === next.className &&
			prev.rarity === next.rarity &&
			prev.layoutOrder === next.layoutOrder
		);
	}
);
