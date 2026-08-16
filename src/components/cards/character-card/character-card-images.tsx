import React, { useState } from 'react';
import {
	buildHolographicStyle,
	computeRarityVisualConfig,
	rarityAccessibilityLabel,
} from '@/components/cards/shared/rarity-style';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';

// Imágenes con thumbnails para el componente de galería
export interface ThumbnailImage {
	id: string;
	isVideo?: boolean;
	name?: string;
	thumbnailUrl: string;
	url?: string;
}

interface CharacterCardImagesProps {
	/** Si está en modo compacto */
	compact?: boolean;
	/** Si está habilitado el efecto holográfico */
	holographicEffect?: boolean;
	/** Imágenes a mostrar (rutas) */
	images?: string[];
	/** URL de la imagen destacada */
	mainImage?: string;
	/** Color primario para estilizado */
	primaryColor?: string;
	/** Nivel de rareza (1-10) para determinar efectos */
	rarityLevel?: number;
	/** Si está en modo tarjeta TCG */
	tcgMode?: boolean;
}

// Eliminado getHolographicEffects: sustituido por buildHolographicStyle + config centralizada.

/**
 * Componente para mostrar imágenes en una tarjeta de personaje TCG.
 * Incluye efectos holográficos y animaciones según el nivel de rareza.
 */
export function CharacterCardImages(props: CharacterCardImagesProps) {
	const state = useCharacterCardImagesState(props);
	return <CharacterCardImagesView {...state} />;
}

interface CharacterCardImagesState extends CharacterCardImagesProps {
	active: boolean;
	ariaLabel: string;
	displayImage: string | null;
	hasImage: boolean;
	holographicStyle: React.CSSProperties;
	setViewAngle: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
	viewAngle: { x: number; y: number };
}

function useCharacterCardImagesState({
	images = [],
	mainImage,
	primaryColor = 'var(--entity-character)',
	rarityLevel = 1,
	holographicEffect = true,
	tcgMode = true,
	compact = false,
}: CharacterCardImagesProps): CharacterCardImagesState {
	const [viewAngle, setViewAngle] = useState({ x: 0, y: 0 });
	const displayImage = mainImage || (images.length > 0 ? images[0] : null);
	const hasImage = Boolean(displayImage);
	const active = tcgMode && holographicEffect;
	const rarityConfig = computeRarityVisualConfig({ level: rarityLevel });
	const holographicStyle = buildHolographicStyle(primaryColor, rarityConfig, active);
	const ariaLabel = hasImage
		? rarityAccessibilityLabel('Character image', rarityConfig)
		: 'Character image unavailable';
	return {
		images,
		mainImage,
		primaryColor,
		rarityLevel,
		holographicEffect,
		tcgMode,
		compact,
		displayImage,
		hasImage,
		viewAngle,
		setViewAngle,
		active,
		holographicStyle,
		ariaLabel,
	};
}

const CharacterCardImagesView: React.FC<CharacterCardImagesState> = ({
	ariaLabel,
	compact = false,
	tcgMode = true,
	primaryColor = 'var(--entity-character)',
	rarityLevel = 1,
	displayImage,
	hasImage,
	viewAngle,
	setViewAngle,
	active,
	holographicStyle,
}) => {
	const resetAngle = () => setViewAngle({ x: 0, y: 0 });
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!active) {
			return;
		}
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
		const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
		setViewAngle({ x, y });
	};
	return (
		<div
			aria-label={ariaLabel}
			className={cn('relative overflow-hidden', compact ? 'h-24' : 'h-48', tcgMode && 'border-border/40 border-b')}
			onBlur={resetAngle}
			onFocus={resetAngle}
			onMouseLeave={resetAngle}
			onMouseMove={handleMouseMove}
			role="img"
		>
			{tcgMode && <BackgroundDecor primaryColor={primaryColor} />}
			{/* Uso de thresholds centralizados: glow a partir de >=3 en lógica anterior, aquí mantenemos compatibilidad */}
			{tcgMode && rarityLevel >= 3 && <CornersFrame primaryColor={primaryColor} />}
			{hasImage ? (
				<MainImageLayer
					active={active}
					displayImage={displayImage}
					holographicStyle={holographicStyle}
					rarityLevel={rarityLevel}
					viewAngle={viewAngle}
				/>
			) : (
				<Placeholder primaryColor={primaryColor} />
			)}
			{tcgMode && <OverlayEffects primaryColor={primaryColor} rarityLevel={rarityLevel} />}
		</div>
	);
};

// Subcomponentes decorativos
const BackgroundDecor: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
	<div
		className="absolute inset-0 z-0 bg-muted/20"
		style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${primaryColor}30, transparent 80%)` }}
	/>
);

const CornersFrame: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
	<div className="pointer-events-none absolute inset-0 z-10">
		{[
			'top-0 left-0 rounded-br-sm border-t-2 border-l-2',
			'top-0 right-0 rounded-bl-sm border-t-2 border-r-2',
			'bottom-0 left-0 rounded-tr-sm border-b-2 border-l-2',
			'right-0 bottom-0 rounded-tl-sm border-r-2 border-b-2',
		].map((cls) => (
			<div className={`absolute h-8 w-8 opacity-60 ${cls}`} key={cls} style={{ borderColor: primaryColor }} />
		))}
	</div>
);

const MainImageLayer: React.FC<{
	active: boolean;
	displayImage: string | null;
	holographicStyle: React.CSSProperties;
	rarityLevel: number;
	viewAngle: { x: number; y: number };
}> = ({ active, displayImage, holographicStyle, rarityLevel, viewAngle }) => (
	<motion.div
		className="relative z-10 h-full w-full"
		style={{
			transform: active
				? `perspective(1000px) rotateY(${viewAngle.x * 5}deg) rotateX(${-viewAngle.y * 5}deg)`
				: undefined,
			transformStyle: 'preserve-3d',
			transition: 'transform 0.1s ease-out',
		}}
	>
		<img
			alt=""
			className={cn('h-full w-full object-cover', rarityLevel >= 5 && active && 'transition-all duration-500')}
			src={displayImage || ''}
			style={{ ...holographicStyle, transformStyle: 'preserve-3d' }}
		/>
		{active && rarityLevel >= 3 && (
			<div
				className="pointer-events-none absolute inset-0 z-20 opacity-30"
				style={{
					background: `linear-gradient(${135 + viewAngle.x * 30}deg,transparent,color-mix(in oklch, var(--foreground), transparent 50%) ${50 + viewAngle.y * 10}%,transparent)`,
				}}
			/>
		)}
		{active && rarityLevel >= 7 && (
			<div
				className="pointer-events-none absolute inset-0 z-20 opacity-10 mix-blend-overlay"
				style={{
					backgroundImage: `repeating-linear-gradient(${90 + viewAngle.x * 20}deg,transparent,rgba(255,255,255,0.8) 1px,transparent 2px)`,
					backgroundSize: '4px 4px',
				}}
			/>
		)}
	</motion.div>
);

const Placeholder: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
	<div
		className="flex h-full w-full items-center justify-center bg-muted/20 text-white/50"
		style={{ background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)` }}
	>
		<span className="-rotate-12 transform text-4xl">?</span>
	</div>
);

const OverlayEffects: React.FC<{ primaryColor: string; rarityLevel: number }> = ({ primaryColor, rarityLevel }) => (
	<div className="pointer-events-none absolute inset-0 z-30">
		<div
			className="absolute inset-3 rounded border border-border/40"
			style={{ boxShadow: rarityLevel >= 5 ? `0 0 10px ${primaryColor}50 inset` : 'none' }}
		/>
		<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
		<div className="absolute top-0 right-0 left-0 h-[20%] bg-gradient-to-b from-white/10 to-transparent" />
	</div>
);
