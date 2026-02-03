import React, { useState } from 'react';
import { motion } from '@/components/ui/animejs-shim';
import { cn } from '@/lib/utils';

interface CardMediaItem {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

interface PlaceCardImagesProps {
	/** Imágenes a mostrar (rutas) */
	images?: CardMediaItem[];
	/** URL de la imagen destacada */
	mainImage?: CardMediaItem;
	/** Color primario para estilizado */
	primaryColor?: string;
	/** Nivel de rareza (1-10) para determinar efectos */
	rarityLevel?: number;
	/** Si está habilitado el efecto holográfico */
	holographicEffect?: boolean;
	/** Si está en modo tarjeta TCG */
	tcgMode?: boolean;
	/** Si está en modo compacto */
	compact?: boolean;
}

/**
 * Componente para mostrar imágenes en una tarjeta de lugar TCG.
 * Incluye efectos holográficos y animaciones según el nivel de rareza.
 */
export function PlaceCardImages({
	images = [],
	mainImage,
	primaryColor = 'var(--dt-success-500)',
	rarityLevel = 1,
	holographicEffect = true,
	tcgMode = true,
	compact = false,
}: PlaceCardImagesProps) {
	// Estado para el ángulo de visualización (para efecto holográfico)
	const [viewAngle, setViewAngle] = useState({ x: 0, y: 0 });

	// Usar la imagen principal o la primera de la lista
	const displayImage = mainImage || (images && images.length > 0 ? images[0] : null);

	// Si no hay imagen, mostrar un placeholder
	const hasImage = Boolean(displayImage);

	// Helper function para generar aria-label
	const getImageAriaLabel = (): string => {
		if (!hasImage) {
			return 'Lugar sin imagen disponible';
		}

		const baseLabel = 'Imagen de lugar';
		const specialEffects = rarityLevel >= 5 ? ' con efectos especiales' : '';
		return `${baseLabel}${specialEffects}`;
	};

	// Determinar los efectos holográficos basados en la rareza
	const getHolographicEffects = () => {
		if (!(tcgMode && holographicEffect)) {
			return {};
		}

		// A mayor rareza, más pronunciados son los efectos
		if (rarityLevel >= 9) {
			return {
				// Efecto iridiscente para lugares míticos
				filter: 'hue-rotate(45deg) saturate(1.75)',
				animation: 'var(--animate-iridescent)',
			};
		}

		if (rarityLevel >= 7) {
			return {
				// Efecto brillante para lugares legendarios
				filter: 'brightness(1.1) contrast(1.1)',
				animation: 'var(--animate-shine-effect)',
			};
		}

		if (rarityLevel >= 5) {
			return {
				// Efecto de cambio de gradiente para lugares épicos
				background: `linear-gradient(45deg, color-mix(in oklab, ${primaryColor}, transparent 75%), color-mix(in oklab, ${primaryColor}, transparent 44%), color-mix(in oklab, ${primaryColor}, transparent 75%))`,
				backgroundSize: '200% 200%',
				animation: 'var(--animate-gradient-shift)',
			};
		}

		// Para lugares comunes, sin efectos especiales
		return {};
	};

	// Manejar el efecto holográfico en movimiento
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!(tcgMode && holographicEffect)) {
			return;
		}

		const el = e.currentTarget;
		const rect = el.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;

		// Calcular la posición relativa del mouse dentro del elemento
		const x = ((e.clientX - rect.left) / width - 0.5) * 2; // -1 a 1
		const y = ((e.clientY - rect.top) / height - 0.5) * 2; // -1 a 1

		setViewAngle({ x, y });
	};

	// Restablecer el ángulo de vista cuando el mouse sale
	const handleMouseLeave = () => {
		setViewAngle({ x: 0, y: 0 });
	};

	// Aplicar los efectos holográficos basados en la rareza
	const holographicStyle = getHolographicEffects();

	return (
		<div
			aria-label={getImageAriaLabel()}
			className={cn('relative overflow-hidden', compact ? 'h-24' : 'h-48', tcgMode && 'border-border/40 border-b')}
			onPointerLeave={handleMouseLeave}
			onPointerMove={handleMouseMove}
			role="img"
		>
			{/* Fondo decorativo para cartas TCG */}
			{tcgMode && (
				<div
					className="absolute inset-0 z-0 bg-muted/20"
					style={{
						backgroundImage: `radial-gradient(circle at 50% 50%, color-mix(in oklab, ${primaryColor}, transparent 81%), transparent 80%)`,
					}}
				/>
			)}

			{/* Marco decorativo para lugares raros */}
			{tcgMode && rarityLevel >= 3 && (
				<div className="pointer-events-none absolute inset-0 z-10">
					{/* Bordes en estilo TCG */}
					<div
						className="absolute top-0 left-0 h-8 w-8 rounded-br-sm border-t-2 border-l-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute top-0 right-0 h-8 w-8 rounded-bl-sm border-t-2 border-r-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute bottom-0 left-0 h-8 w-8 rounded-tr-sm border-b-2 border-l-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute right-0 bottom-0 h-8 w-8 rounded-tl-sm border-r-2 border-b-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
				</div>
			)}

			{/* Imagen principal con efectos holográficos */}
			{hasImage ? (
				<motion.div
					className="relative z-10 h-full w-full"
					style={{
						transform: `perspective(1000px) rotateY(${viewAngle.x * 5}deg) rotateX(${-viewAngle.y * 5}deg)`,
						transformStyle: 'preserve-3d',
						transition: 'transform 0.1s ease-out',
					}}
				>
					{/* Imagen del lugar */}
					<img
						alt="Lugar"
						className={cn(
							'h-full w-full object-cover',
							rarityLevel >= 5 && tcgMode && holographicEffect && 'transition-all duration-500'
						)}
						height={compact ? 96 : 192}
						src={displayImage?.thumbnailUrl || ''}
						style={{
							...holographicStyle,
							transformStyle: 'preserve-3d',
						}}
						width={192}
					/>

					{/* Efecto holográfico de brillo */}
					{tcgMode && holographicEffect && rarityLevel >= 3 && (
						<div
							className="pointer-events-none absolute inset-0 z-20 opacity-30"
							style={{
								background: `linear-gradient(
									${135 + viewAngle.x * 30}deg,
									transparent,
									color-mix(in oklch, var(--foreground), transparent 50%) ${50 + viewAngle.y * 10}%,
									transparent
								)`,
							}}
						/>
					)}

					{/* Patrón de líneas holográficas para lugares especiales */}
					{tcgMode && holographicEffect && rarityLevel >= 7 && (
						<div
							className="pointer-events-none absolute inset-0 z-20 opacity-10 mix-blend-overlay"
							style={{
								backgroundImage: `repeating-linear-gradient(
									${90 + viewAngle.x * 20}deg,
									transparent,
									color-mix(in oklch, var(--effect-highlight-rgb), transparent 20%) 1px,
									transparent 2px
								)`,
								backgroundSize: '4px 4px',
							}}
						/>
					)}
				</motion.div>
			) : (
				// Placeholder cuando no hay imagen
				<div
					className="flex h-full w-full items-center justify-center bg-muted/20 text-white/50"
					style={{
						background: `radial-gradient(circle, color-mix(in oklab, ${primaryColor}, transparent 81%) 0%, transparent 70%)`,
					}}
				>
					<span className="-rotate-12 transform text-4xl">📍</span>
				</div>
			)}

			{/* Capa de arte para cartas TCG (marco y efectos) */}
			{tcgMode && (
				<div className="pointer-events-none absolute inset-0 z-30">
					{/* Marco interno */}
					<div
						className="absolute inset-3 rounded border border-border/40"
						style={{
							boxShadow:
								rarityLevel >= 5 ? `0 0 10px color-mix(in oklab, ${primaryColor}, transparent 69%) inset` : 'none',
						}}
					/>

					{/* Efecto viñeta */}
					<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/30" />

					{/* Efecto de brillo superior */}
					<div className="absolute top-0 right-0 left-0 h-[20%] bg-linear-to-b from-white/10 to-transparent" />
				</div>
			)}
		</div>
	);
}
