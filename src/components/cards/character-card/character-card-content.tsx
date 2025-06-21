'use client';

import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, Brain, Heart, Shield, Sparkles, Star, Swords, User, Wand, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface CharacterCardContentProps {
	/** Descripción del personaje */
	description?: string;
	/** Color primario para estilizar la tarjeta */
	primaryColor?: string;
	/** Color secundario para estilizar la tarjeta */
	secondaryColor?: string;
	/** Trasfondo o historia del personaje */
	backstory?: string;
	/** Estadísticas del personaje (fuerza, destreza, etc.) */
	stats?: Record<string, number>;
	/** Habilidades del personaje */
	abilities?: string[] | { name: string; description?: string }[];
	/** Personalidad del personaje */
	personality?: string[];
	/** Miedos del personaje */
	fears?: string[];
	/** Objetivos del personaje */
	goals?: string[];
	/** Creencias del personaje */
	beliefs?: string[];
	/** Clase del personaje */
	characterClass?: string;
	/** Raza del personaje */
	race?: string;
	/** Nivel del personaje */
	level?: number;
	/** Alineamiento del personaje */
	alignment?: string;
	/** Metadatos adicionales */
	metadata?: {
		power?: number;
		healthPoints?: number;
		manaPoints?: number;
		rarityLevel?: string;
		cardId?: string;
	};
	/** Modo compacto para mostrar menos información */
	compact?: boolean;
	/** Modo tarjeta TCG para estilos especiales */
	tcgMode?: boolean;
}

/**
 * Componente de contenido principal para la tarjeta de personaje.
 * Muestra la descripción, estadísticas y habilidades en un estilo
 * de juego de cartas coleccionables.
 */
export function CharacterCardContent({
	description = '',
	primaryColor = '#8e44ad',
	secondaryColor = '#6d28d9',
	backstory = '',
	stats = {},
	abilities = [],
	personality = [],
	fears = [],
	goals = [],
	beliefs = [],
	characterClass = 'Unknown',
	race = 'Unknown',
	level = 1,
	alignment = 'Neutral',
	metadata = {},
	compact = false,
	tcgMode = true,
}: CharacterCardContentProps) {
	// Limitar descripción para modo compacto
	const displayDescription = compact
		? description?.substring(0, 60) + (description.length > 60 ? '...' : '')
		: description;

	// Determinar el color de alineamiento
	const getAlignmentColor = () => {
		const align = alignment.toLowerCase();
		if (align.includes('evil')) return '#dc2626';
		if (align.includes('good')) return '#16a34a';
		if (align.includes('lawful')) return '#2563eb';
		if (align.includes('chaotic')) return '#d97706';
		return '#6b7280'; // neutral
	};

	// Obtener icono basado en la clase
	const getStatIcon = (statKey: string) => {
		const key = statKey.toLowerCase();
		if (key.includes('str') || key.includes('force') || key.includes('power')) return <Swords className="w-3 h-3" />;
		if (key.includes('int') || key.includes('intellect')) return <Brain className="w-3 h-3" />;
		if (key.includes('wis') || key.includes('wisdom')) return <Sparkles className="w-3 h-3" />;
		if (key.includes('dex') || key.includes('agility') || key.includes('speed')) return <Zap className="w-3 h-3" />;
		if (key.includes('con') || key.includes('armor') || key.includes('stamina')) return <Shield className="w-3 h-3" />;
		if (key.includes('cha') || key.includes('soc') || key.includes('charisma')) return <User className="w-3 h-3" />;
		if (key.includes('hp') || key.includes('health')) return <Heart className="w-3 h-3" />;
		if (key.includes('mp') || key.includes('mana')) return <Wand className="w-3 h-3" />;
		return <Star className="w-3 h-3" />;
	};

	// Formatear nombre de estadística para mostrar
	const formatStatName = (statKey: string) => {
		const formatted = statKey
			.replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
			.replace(/_/g, ' ') // Reemplazar guiones bajos con espacios
			.trim()
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');

		// Usar abreviaturas para estadísticas comunes
		if (formatted.toLowerCase().includes('strength')) return 'STR';
		if (formatted.toLowerCase().includes('dexterity')) return 'DEX';
		if (formatted.toLowerCase().includes('constitution')) return 'CON';
		if (formatted.toLowerCase().includes('intelligence')) return 'INT';
		if (formatted.toLowerCase().includes('wisdom')) return 'WIS';
		if (formatted.toLowerCase().includes('charisma')) return 'CHA';

		return formatted;
	};

	// Normalizar las habilidades a un formato estándar
	const normalizedAbilities = abilities.map((ability) => {
		if (typeof ability === 'string') {
			return { name: ability, description: '' };
		}
		return ability;
	});

	// Vista compacta
	if (compact) {
		return (
			<div className="py-2 px-3 flex flex-col gap-1">
				{/* Descripción corta */}
				{displayDescription && (
					<p className="text-xs line-clamp-2 text-muted-foreground italic">{displayDescription}</p>
				)}

				{/* Estadísticas básicas */}
				<div className="flex justify-between items-center gap-2 mt-auto">
					<div className="flex items-center gap-1.5 text-xs">
						<span
							className="px-1.5 py-0.5 rounded font-medium"
							style={{
								backgroundColor: `${primaryColor}30`,
								color: primaryColor,
							}}
						>
							Lvl {level}
						</span>
						<span className="text-muted-foreground">
							{characterClass} • {race}
						</span>
					</div>

					{metadata.power && (
						<div
							className="text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
							style={{
								backgroundColor: `${secondaryColor}30`,
								color: secondaryColor,
							}}
						>
							<ArrowUpRight className="w-3 h-3" />
							{metadata.power}
						</div>
					)}
				</div>
			</div>
		);
	}

	// Vista completa
	return (
		<div className="py-3 px-4 flex flex-col gap-2">
			{/* Marco decorativo estilo TCG */}
			{tcgMode && (
				<div className="absolute top-2 right-2 bottom-2 left-2 border border-white/10 rounded pointer-events-none" />
			)}

			{/* Descripción del personaje */}
			{displayDescription && (
				<div className="text-sm line-clamp-3 italic relative">
					{/* Marco estilo TCG para texto de sabor */}
					{tcgMode && (
						<div
							className="absolute -left-2 -right-2 -top-1 -bottom-1 opacity-10 rounded"
							style={{
								background: `linear-gradient(135deg, ${primaryColor}70 0%, transparent 60%)`,
							}}
						/>
					)}

					<div className="relative">{displayDescription}</div>
				</div>
			)}

			{/* Barras de salud/mana/poder (como en cartas TCG) */}
			{tcgMode && metadata && (
				<div className="grid grid-cols-2 gap-1.5 my-1">
					{metadata.healthPoints && (
						<div className="space-y-0.5">
							<div className="flex justify-between items-center text-[10px]">
								<span className="flex items-center gap-0.5 font-semibold">
									<Heart className="w-3 h-3 fill-red-500 stroke-red-600" /> HP
								</span>
								<span>{metadata.healthPoints}</span>
							</div>
							<Progress
								value={100}
								className="h-1.5 bg-red-950/30 [&_[data-slot=progress-indicator]]:bg-gradient-to-r from-red-800 to-red-500"
							/>
						</div>
					)}

					{metadata.manaPoints && (
						<div className="space-y-0.5">
							<div className="flex justify-between items-center text-[10px]">
								<span className="flex items-center gap-0.5 font-semibold">
									<Wand className="w-3 h-3 text-blue-400" /> MP
								</span>
								<span>{metadata.manaPoints}</span>
							</div>
							<Progress
								value={100}
								className="h-1.5 bg-blue-950/30 [&_[data-slot=progress-indicator]]:bg-gradient-to-r from-blue-800 to-blue-500"
							/>
						</div>
					)}
				</div>
			)}

			{/* Estadísticas principales en una cuadrícula (como valores de ATK/DEF) */}
			{Object.keys(stats).length > 0 && (
				<div className="mt-1 grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
					{Object.entries(stats)
						.slice(0, 6) // Limitar a 6 estadísticas
						.map(([key, value]) => (
							<motion.div
								key={`stat-${key}`}
								className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: tcgMode ? `1px solid ${primaryColor}40` : 'none',
								}}
								whileHover={{ scale: 1.05, backgroundColor: `${primaryColor}30` }}
							>
								<div className="flex items-center gap-1">
									{getStatIcon(key)}
									<span className="font-semibold">{formatStatName(key)}</span>
								</div>
								<span>{value}</span>
							</motion.div>
						))}
				</div>
			)}

			{/* Sección de alineamiento (como nivel de karma) */}
			<div className="mt-1 flex justify-between items-center text-xs">
				<div
					className="px-2 py-0.5 rounded-md flex items-center gap-1 font-bold"
					style={{
						backgroundColor: `${getAlignmentColor()}20`,
						color: getAlignmentColor(),
						border: `1px dashed ${getAlignmentColor()}40`,
					}}
				>
					<Sparkles className="w-3 h-3" /> {alignment}
				</div>

				{metadata.rarityLevel && (
					<div
						className="px-2 py-0.5 rounded-md font-semibold"
						style={{
							backgroundColor: `${secondaryColor}20`,
							color: secondaryColor,
							border: `1px solid ${secondaryColor}30`,
						}}
					>
						{metadata.rarityLevel}
					</div>
				)}
			</div>

			{/* Sección de habilidades (como efectos de carta TCG) */}
			{normalizedAbilities.length > 0 && (
				<div className="mt-1.5 space-y-1.5">
					<div className="text-xs font-semibold flex items-center">
						<Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-400" />
						<span>HABILIDADES</span>
					</div>

					<div className="space-y-1.5">
						{normalizedAbilities.slice(0, 2).map((ability) => (
							<motion.div
								key={`ability-${ability.name}`}
								className="text-xs rounded px-2 py-1.5 relative overflow-hidden border"
								style={{
									backgroundColor: `${primaryColor}30`,
									borderColor: `${primaryColor}50`,
									backgroundImage: tcgMode
										? `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}30, ${primaryColor}20)`
										: undefined,
								}}
								whileHover={{ scale: 1.02, y: -2 }}
							>
								{/* Fondo decorativo para habilidades */}
								{tcgMode && (
									<div
										className="absolute inset-0 opacity-10 pointer-events-none"
										style={{
											backgroundImage: `radial-gradient(circle at 10% 10%, ${primaryColor}, transparent 60%)`,
										}}
									/>
								)}

								<div className="relative z-10">
									<div className="font-bold flex items-center">
										<Star className="w-3 h-3 mr-1 text-yellow-400" />
										{ability.name}
									</div>

									{ability.description && (
										<div className="text-[10px] italic mt-0.5 opacity-80 line-clamp-2">{ability.description}</div>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</div>
			)}

			{/* Objetivos o características adicionales */}
			{(goals.length > 0 || personality.length > 0) && (
				<div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] opacity-90">
					{goals.length > 0 && (
						<div className="px-1.5 py-1 rounded" style={{ backgroundColor: `${primaryColor}15` }}>
							<div className="font-semibold mb-0.5">OBJETIVOS:</div>
							<ul className="list-disc list-inside pl-1">
								{goals.slice(0, 2).map((goal) => (
									<li key={`goal-${goal.substring(0, 15)}`} className="truncate">
										{goal}
									</li>
								))}
							</ul>
						</div>
					)}

					{personality.length > 0 && (
						<div className="px-1.5 py-1 rounded" style={{ backgroundColor: `${secondaryColor}15` }}>
							<div className="font-semibold mb-0.5">PERSONALIDAD:</div>
							<ul className="list-disc list-inside pl-1">
								{personality.slice(0, 2).map((trait) => (
									<li key={`trait-${trait.substring(0, 15)}`} className="truncate">
										{trait}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* ID de carta TCG */}
			{tcgMode && metadata.cardId && <div className="mt-auto text-[9px] text-right opacity-60">{metadata.cardId}</div>}
		</div>
	);
}
