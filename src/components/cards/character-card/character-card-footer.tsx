import { Heart, ImageIcon, Scroll, Shield, Sparkles, Star, Swords, Video, Wand } from 'lucide-react';
import { nanoid } from 'nanoid';
import React from 'react';
import { getCardIdFromUrl } from '@/lib/utils/index';

interface CharacterCardFooterProps {
	/** ID o URL del personaje */
	id: string;
	/** Color primario de la tarjeta */
	primaryColor: string;
	/** Número de imágenes del personaje */
	imagesCount?: number;
	/** Número de videos del personaje */
	videosCount?: number;
	/** Nivel de rareza (1-10) */
	rarityLevel?: number;
	/** HP del personaje (puntos de vida) */
	hp?: number;
	/** MP del personaje (puntos de maná) */
	mp?: number;
	/** Clasificación de poder (1-10) */
	power?: number;
	/** Alineación del personaje */
	alignment?: string;
	/** Habilidades principales del personaje */
	skills?: { name: string; level: number }[];
	/** Si está en modo TCG con efectos especiales */
	tcgMode?: boolean;
	cardId?: string;
	level?: number | null;
	compact?: boolean;
}

/**
 * Pie de la tarjeta de personaje que muestra estadísticas y atributos
 * en un estilo TCG, con iconos para HP, MP, alineación y nivel de poder.
 */
export function CharacterCardFooter({
	id,
	primaryColor,
	imagesCount = 0,
	videosCount = 0,
	rarityLevel = 1,
	hp = 100,
	mp = 50,
	power = 1,
	alignment = 'Neutral',
	skills = [],
	tcgMode = true,
}: CharacterCardFooterProps) {
	// Generar un ID de renderizado único
	const renderKey = React.useMemo(() => nanoid(), []);

	// Obtener ID del personaje de la URL si es necesario
	const characterId = getCardIdFromUrl(id);

	// Lookup table para nombres de rareza
	const RARITY_NAMES = {
		9: 'MYTHIC',
		7: 'LEGENDARY',
		5: 'EPIC',
		3: 'RARE',
		0: 'COMMON',
	} as const;

	// Determinar rareza basada en nivel
	const getRarityName = (level: number): string => {
		const thresholds = [9, 7, 5, 3, 0] as const;
		const threshold = thresholds.find((t) => level >= t) ?? 0;
		return RARITY_NAMES[threshold];
	};

	const getRarityColor = (level: number) => {
		if (level >= 9) {
			return 'var(--rarity-mythic)';
		}
		if (level >= 7) {
			return 'var(--rarity-legendary)';
		}
		if (level >= 5) {
			return 'var(--rarity-epic)';
		}
		if (level >= 3) {
			return 'var(--rarity-rare)';
		}
		return 'var(--rarity-common)';
	};

	// Calcular estrellas de rareza (1-5)
	const rarityStars = Math.min(5, Math.ceil(rarityLevel / 2));

	// Simplificar la alineación para el ícono
	const getAlignmentIcon = () => {
		const lowerAlignment = alignment.toLowerCase();
		if (lowerAlignment.includes('good') || lowerAlignment.includes('lawful')) {
			return <Shield className="h-4 w-4" />;
		}
		if (lowerAlignment.includes('evil') || lowerAlignment.includes('chaotic')) {
			return <Swords className="h-4 w-4" />;
		}
		if (lowerAlignment.includes('neutral')) {
			return <Scroll className="h-4 w-4" />;
		}
		return <Star className="h-4 w-4" />;
	};

	if (!tcgMode) {
		return (
			<div className="flex items-center justify-between px-3 py-2 text-sm">
				<div className="flex items-center space-x-2 text-white/70">
					<div className="flex items-center">
						<ImageIcon className="mr-1 h-4 w-4" />
						<span>{imagesCount}</span>
					</div>
					{videosCount > 0 && (
						<div className="flex items-center">
							<Video className="mr-1 h-4 w-4" />
							<span>{videosCount}</span>
						</div>
					)}
				</div>
				<div className="text-right text-xs opacity-60">#{characterId}</div>
			</div>
		);
	}

	return (
		<div className="px-4 py-3 text-sm">
			{/* Sección de estadísticas de TCG */}
			<div className="mb-2 flex justify-between">
				{/* HP/MP/POWER en estilo TCG */}
				<div className="flex items-center gap-3">
					{/* HP (Puntos de vida) */}
					<div className="flex items-center gap-1">
						<Heart className="h-4 w-4 text-destructive" />
						<span className="font-medium">{hp}</span>
					</div>

					{/* MP (Puntos de maná) */}
					<div className="flex items-center gap-1">
						<Wand className="h-4 w-4 text-blue-400" />
						<span className="font-medium">{mp}</span>
					</div>

					{/* Power (Nivel de poder) */}
					<div className="flex items-center gap-1">
						<Sparkles className="h-4 w-4 text-warning" />
						<span className="font-medium">{power}</span>
					</div>
				</div>

				{/* Alineación */}
				<div className="flex items-center gap-1">
					{getAlignmentIcon()}
					<span className="font-medium text-xs uppercase opacity-80">{alignment}</span>
				</div>
			</div>

			{/* Contadores de media */}
			<div className="flex items-center justify-between">
				{/* Contador de imágenes y vídeos */}
				<div className="flex items-center space-x-2 text-white/70">
					<div className="flex items-center">
						<ImageIcon className="mr-1 h-4 w-4" />
						<span>{imagesCount}</span>
					</div>

					{videosCount > 0 && (
						<div className="flex items-center">
							<Video className="mr-1 h-4 w-4" />
							<span>{videosCount}</span>
						</div>
					)}
				</div>

				{/* Indicador de rareza con estrellas */}
				<div className="flex items-center gap-0.5" style={{ color: getRarityColor(rarityLevel) }}>
					<span className="mr-1 font-semibold text-xs">{getRarityName(rarityLevel)}</span>
					{[...new Array(rarityStars)].map((_, i) => (
						<Star className="h-4 w-4 fill-current" key={`rarity-star-${renderKey}-${i + 1}`} />
					))}
				</div>
			</div>

			{/* Habilidades destacadas (si existen) */}
			{skills && skills.length > 0 && (
				<div className="mt-2 border-border/40 border-t pt-2">
					<div className="flex flex-wrap gap-1.5">
						{skills.slice(0, 3).map((skill, _index) => (
							<div
								className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium text-xs"
								key={`skill-${characterId}-${skill.name}`}
								style={{
									backgroundColor: `color-mix(in oklab, ${primaryColor}, transparent 60%)`,
									border: `1px solid color-mix(in oklab, ${primaryColor}, transparent 20%)`,
								}}
							>
								<span>{skill.name}</span>
								<span className="opacity-70">Lv{skill.level}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Línea decorativa inferior en estilo TCG */}
			<div
				className="mt-2 h-1 w-full overflow-hidden rounded-full"
				style={{ background: 'rgba(var(--effect-highlight-rgb), 0.1)' }}
			>
				<div
					className="h-full rounded-full"
					style={{
						width: `${(rarityLevel / 10) * 100}%`,
						background: getRarityColor(rarityLevel),
						boxShadow: `0 0 8px ${getRarityColor(rarityLevel)}`,
					}}
				/>
			</div>

			{/* ID de la carta en formato TCG */}
			<div className="mt-2 text-right text-xs opacity-60">#{characterId}</div>
		</div>
	);
}
