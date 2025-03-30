'use client';

import { getCardIdFromUrl } from '@/lib/utils';
import {
	Heart,
	ImageIcon,
	Scroll,
	Shield,
	Sparkles,
	Star,
	Swords,
	Video,
	Wand
} from 'lucide-react';

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
	tcgMode = true
}: CharacterCardFooterProps) {
	// Obtener ID del personaje de la URL si es necesario
	const characterId = getCardIdFromUrl(id);

	// Determinar el color de rareza
	const getRarityColor = (level: number) => {
		if (level >= 9) return 'rgb(255, 100, 255)'; // Mítico
		if (level >= 7) return 'rgb(255, 128, 0)';   // Legendario
		if (level >= 5) return 'rgb(163, 53, 238)';  // Épico
		if (level >= 3) return 'rgb(0, 112, 221)';   // Raro
		return 'rgb(30, 255, 0)';                    // Común
	};

	// Calcular estrellas de rareza (1-5)
	const rarityStars = Math.min(5, Math.ceil(rarityLevel / 2));

	// Simplificar la alineación para el ícono
	const getAlignmentIcon = () => {
		const lowerAlignment = alignment.toLowerCase();
		if (lowerAlignment.includes('good') || lowerAlignment.includes('lawful'))
			return <Shield className="w-3.5 h-3.5" />;
		if (lowerAlignment.includes('evil') || lowerAlignment.includes('chaotic'))
			return <Swords className="w-3.5 h-3.5" />;
		if (lowerAlignment.includes('neutral'))
			return <Scroll className="w-3.5 h-3.5" />;
		return <Star className="w-3.5 h-3.5" />;
	};

	return (
		<div className="py-3 px-4 text-xs">
			{/* Sección de estadísticas de TCG */}
			<div className="mb-2 flex justify-between">
				{/* HP/MP/POWER en estilo TCG */}
				<div className="flex items-center gap-3">
					{/* HP (Puntos de vida) */}
					<div className="flex items-center gap-1">
						<Heart className="w-3.5 h-3.5 text-red-500" />
						<span className="font-medium">{hp}</span>
					</div>

					{/* MP (Puntos de maná) */}
					<div className="flex items-center gap-1">
						<Wand className="w-3.5 h-3.5 text-blue-400" />
						<span className="font-medium">{mp}</span>
					</div>

					{/* Power (Nivel de poder) */}
					<div className="flex items-center gap-1">
						<Sparkles className="w-3.5 h-3.5 text-yellow-400" />
						<span className="font-medium">{power}</span>
					</div>
				</div>

				{/* Alineación */}
				<div className="flex items-center gap-1">
					{getAlignmentIcon()}
					<span className="font-medium text-[10px] uppercase opacity-80">{alignment}</span>
				</div>
			</div>

			{/* Contadores de media */}
			<div className="flex justify-between items-center">
				{/* Contador de imágenes y vídeos */}
				<div className="flex items-center space-x-2 text-white/70">
					<div className="flex items-center">
						<ImageIcon className="h-3.5 w-3.5 mr-1" />
						<span>{imagesCount}</span>
					</div>

					{videosCount > 0 && (
						<div className="flex items-center">
							<Video className="h-3.5 w-3.5 mr-1" />
							<span>{videosCount}</span>
						</div>
					)}
				</div>

				{/* Indicador de rareza con estrellas */}
				<div className="flex items-center gap-0.5" style={{ color: getRarityColor(rarityLevel) }}>
					<span className="text-[10px] font-semibold mr-1">
						{rarityLevel >= 9 ? 'MYTHIC' :
							rarityLevel >= 7 ? 'LEGENDARY' :
								rarityLevel >= 5 ? 'EPIC' :
									rarityLevel >= 3 ? 'RARE' : 'COMMON'}
					</span>
					{[...Array(rarityStars)].map((_, i) => (
						<Star key={`rarity-${characterId}-${rarityLevel}-${i}`} className="h-3 w-3 fill-current" />
					))}
				</div>
			</div>

			{/* Habilidades destacadas (si existen) */}
			{skills && skills.length > 0 && (
				<div className="mt-2 border-t border-white/10 pt-2">
					<div className="flex flex-wrap gap-1.5">
						{skills.slice(0, 3).map((skill, index) => (
							<div
								key={`skill-${characterId}-${skill.name}`}
								className="px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5"
								style={{
									backgroundColor: `${primaryColor}40`,
									border: `1px solid ${primaryColor}80`,
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
				className="mt-2 h-1 w-full rounded-full overflow-hidden"
				style={{ background: 'rgba(255,255,255,0.1)' }}>
				<div
					className="h-full rounded-full"
					style={{
						width: `${(rarityLevel / 10) * 100}%`,
						background: getRarityColor(rarityLevel),
						boxShadow: `0 0 8px ${getRarityColor(rarityLevel)}`,
					}} />
			</div>

			{/* ID de la carta en formato TCG */}
			<div className="mt-2 text-[9px] opacity-60 text-right">
				#{characterId}
			</div>
		</div>
	);
}