import { FolderIcon } from 'lucide-react';
import React, { useState } from 'react';
import {
	buildHolographicStyle,
	computeRarityVisualConfig,
	rarityAccessibilityLabel,
} from '@/components/cards/shared/rarity-style';
import { motion } from '@/components/ui/animejs-shim';
import { cn } from '@/lib/utils';

interface GroupCardImagesProps {
	/** Imágenes a mostrar (rutas) */
	images?: string[];
	/** Videos a mostrar (rutas de thumbnails) */
	videos?: string[];
	/** Emoji del grupo para mostrar si no hay imágenes */
	emoji?: string;
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
 * Componente para mostrar imágenes en una tarjeta de grupo TCG.
 * Incluye efectos holográficos según el nivel de rareza.
 */
export function GroupCardImages({
	images = [],
	videos = [],
	emoji = '📂',
	primaryColor = 'var(--dt-primary-500)',
	rarityLevel = 1,
	holographicEffect = true,
	tcgMode = true,
	compact = false,
}: GroupCardImagesProps) {
	// Estado para el ángulo de visualización (para efecto holográfico)
	const [viewAngle, setViewAngle] = useState({ x: 0, y: 0 });

	// Combinar imágenes y videos (hasta 4 en total)
	const allMedia = [...images, ...videos].slice(0, 4);

	// Si no hay media, mostrar un placeholder
	const hasMedia = allMedia.length > 0;

	// Configuración centralizada de rareza
	const rarityConfig = computeRarityVisualConfig({ level: rarityLevel });
	const active = tcgMode && holographicEffect;
	const holographicStyle = buildHolographicStyle(primaryColor, rarityConfig, active);

	// Manejar el efecto holográfico en movimiento
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!(tcgMode && holographicEffect)) {
			return;
		}

		const el = e.currentTarget;
		const rect = el.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;

		// Calcular la posición relativa del mouse
		const x = ((e.clientX - rect.left) / width - 0.5) * 2; // -1 a 1
		const y = ((e.clientY - rect.top) / height - 0.5) * 2; // -1 a 1

		setViewAngle({ x, y });
	};

	// Restablecer el ángulo de vista cuando el mouse sale
	const handleMouseLeave = () => {
		setViewAngle({ x: 0, y: 0 });
	};

	// aria-label accesible usando helper central
	const ariaLabel = hasMedia
		? rarityAccessibilityLabel(
				`Galería de grupo con ${allMedia.length} ${allMedia.length === 1 ? 'elemento' : 'elementos'}`,
				rarityConfig
			)
		: 'Grupo sin imágenes disponibles';

	return (
		<div
			aria-label={ariaLabel}
			className={cn('relative overflow-hidden', compact ? 'h-24' : 'h-40', tcgMode && 'border-border/40 border-b')}
			onBlur={handleMouseLeave}
			onFocus={handleMouseLeave}
			onMouseLeave={handleMouseLeave}
			onMouseMove={handleMouseMove}
			role="img"
		>
			{/* Fondo decorativo para cartas TCG */}
			{tcgMode && (
				<div
					className="absolute inset-0 z-0 bg-muted/20"
					style={{
						backgroundImage: `radial-gradient(circle at 50% 50%, ${primaryColor}30, transparent 80%)`,
					}}
				/>
			)}

			{/* Marco decorativo para grupos raros */}
			{tcgMode && rarityLevel >= 3 && (
				<div className="pointer-events-none absolute inset-0 z-10">
					{/* Bordes estilo TCG */}
					<div
						className="absolute top-0 left-0 h-6 w-6 rounded-br-sm border-t-2 border-l-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute top-0 right-0 h-6 w-6 rounded-bl-sm border-t-2 border-r-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute bottom-0 left-0 h-6 w-6 rounded-tr-sm border-b-2 border-l-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute right-0 bottom-0 h-6 w-6 rounded-tl-sm border-r-2 border-b-2 opacity-60"
						style={{ borderColor: primaryColor }}
					/>
				</div>
			)}

			{hasMedia ? (
				<motion.div
					className="relative z-10 grid h-full w-full grid-cols-2 grid-rows-2 gap-px"
					style={{
						transform:
							tcgMode && holographicEffect
								? `perspective(1000px) rotateY(${viewAngle.x * 5}deg) rotateX(${-viewAngle.y * 5}deg)`
								: undefined,
						transformStyle: 'preserve-3d',
						transition: 'transform 0.1s ease-out',
					}}
				>
					{/* Mostrar imágenes en una grilla 2x2 */}
					{allMedia.map((media, index) => (
						<div
							className="relative overflow-hidden bg-muted/10"
							key={`media-${index}-${media.substring(media.lastIndexOf('/') + 1)}`}
						>
							<img
								alt={`Contenido grupo ${index + 1}`}
								className={cn(
									'absolute inset-0 h-full w-full object-cover',
									rarityLevel >= 5 && tcgMode && holographicEffect && 'transition-all duration-500'
								)}
								src={media}
								style={{
									...holographicStyle,
									transformStyle: 'preserve-3d',
									opacity: 0.9,
								}}
							/>

							{/* Overlay para dar uniformidad */}
							<div
								className="pointer-events-none absolute inset-0"
								style={{
									background: `linear-gradient(to bottom, transparent 70%, ${primaryColor}40 100%)`,
									opacity: 0.6,
								}}
							/>
						</div>
					))}

					{/* Relleno para grilla si faltan imágenes */}
					{Array.from({ length: Math.max(0, 4 - allMedia.length) }).map((_, idx) => (
						<div
							className="flex items-center justify-center bg-muted/10"
							key={`placeholder-${emoji}-${rarityLevel}-${idx + 1}`}
						>
							<FolderIcon className="h-6 w-6 opacity-20" />
						</div>
					))}

					{/* Efecto holográfico general */}
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
				</motion.div>
			) : (
				// Placeholder cuando no hay multimedia
				<div
					className="flex h-full w-full items-center justify-center bg-muted/10 text-white/50"
					style={{
						background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)`,
					}}
				>
					<span className="-rotate-12 transform text-4xl">{emoji}</span>
				</div>
			)}

			{/* Capa de arte para cartas TCG (marco y efectos) */}
			{tcgMode && (
				<div className="pointer-events-none absolute inset-0 z-30">
					{/* Efecto viñeta */}
					<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

					{/* Efecto de brillo superior */}
					<div className="absolute top-0 right-0 left-0 h-[20%] bg-gradient-to-b from-white/10 to-transparent" />
				</div>
			)}
		</div>
	);
}
