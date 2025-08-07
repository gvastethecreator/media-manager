import { ArrowUpRight, Brain, Heart, Shield, Sparkles, Star, Swords, User, Wand, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Progress } from '@/components/ui/progress';

import type { CharacterStats } from '@/types/entities/character';

interface CharacterCardContentProps {
	description?: string | null;
	primaryColor?: string;
	secondaryColor?: string;
	backstory?: string | null;
	stats?: CharacterStats | null;
	abilities?: Array<{ name: string; description?: string }> | Record<string, any> | null;
	personality?: string[] | null;
	fears?: string[] | null;
	goals?: string[] | null;
	beliefs?: string[] | null;
	characterClass?: string | null;
	race?: string | null;
	level?: number | null;
	alignment?: string | null;
	metadata?: {
		power?: number;
		healthPoints?: number;
		manaPoints?: number;
		rarityLevel?: string;
		cardId?: string;
	};
	compact?: boolean;
	tcgMode?: boolean;
	onImageClick?: (imageId: string) => void;
}

export function CharacterCardContent({
	description,
	primaryColor = '#8e44ad',
	secondaryColor = '#6d28d9',
	stats,
	abilities,
	personality,
	goals,
	characterClass,
	race,
	level,
	alignment,
	metadata,
	compact = false,
	tcgMode = true,
}: CharacterCardContentProps) {
	const displayDescription =
		compact && description ? `${description.substring(0, 60)}${description.length > 60 ? '...' : ''}` : description;

	const getAlignmentColor = () => {
		const align = alignment?.toLowerCase() ?? 'neutral';
		if (align.includes('evil')) return '#dc2626';
		if (align.includes('good')) return '#16a34a';
		if (align.includes('lawful')) return '#2563eb';
		if (align.includes('chaotic')) return '#d97706';
		return '#6b7280';
	};

	const getStatIcon = (statKey: string) => {
		const key = statKey.toLowerCase();
		if (key.includes('str') || key.includes('force') || key.includes('power')) return <Swords className="h-3 w-3" />;
		if (key.includes('int') || key.includes('intellect')) return <Brain className="h-3 w-3" />;
		if (key.includes('wis') || key.includes('wisdom')) return <Sparkles className="h-3 w-3" />;
		if (key.includes('dex') || key.includes('agility') || key.includes('speed')) return <Zap className="h-3 w-3" />;
		if (key.includes('con') || key.includes('armor') || key.includes('stamina')) return <Shield className="h-3 w-3" />;
		if (key.includes('cha') || key.includes('soc') || key.includes('charisma')) return <User className="h-3 w-3" />;
		if (key.includes('hp') || key.includes('health')) return <Heart className="h-3 w-3" />;
		if (key.includes('mp') || key.includes('mana')) return <Wand className="h-3 w-3" />;
		return <Star className="h-3 w-3" />;
	};

	const formatStatName = (statKey: string) => {
		const formatted = statKey
			.replace(/([A-Z])/g, ' $1')
			.replace(/_/g, ' ')
			.trim()
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');

		if (formatted.toLowerCase().includes('strength')) return 'STR';
		if (formatted.toLowerCase().includes('dexterity')) return 'DEX';
		if (formatted.toLowerCase().includes('constitution')) return 'CON';
		if (formatted.toLowerCase().includes('intelligence')) return 'INT';
		if (formatted.toLowerCase().includes('wisdom')) return 'WIS';
		if (formatted.toLowerCase().includes('charisma')) return 'CHA';

		return formatted;
	};

	const normalizedAbilities = (() => {
		if (!abilities) return [];
		if (Array.isArray(abilities)) {
			return abilities.map((ability) => (typeof ability === 'string' ? { name: ability, description: '' } : ability));
		}
		// Si es un Record, convertir a array
		return Object.entries(abilities).map(([name, description]) => ({
			name,
			description: typeof description === 'string' ? description : '',
		}));
	})();

	if (compact) {
		return (
			<div className="flex flex-col gap-1 px-3 py-2">
				{displayDescription && (
					<p className="line-clamp-2 text-muted-foreground text-xs italic">{displayDescription}</p>
				)}
				<div className="mt-auto flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5 text-xs">
						<span
							className="rounded px-1.5 py-0.5 font-medium"
							style={{
								backgroundColor: `${primaryColor}30`,
								color: primaryColor,
							}}
						>
							Lvl {level ?? '?'}
						</span>
						<span className="text-muted-foreground">
							{characterClass} • {race}
						</span>
					</div>
					{metadata?.power && (
						<div
							className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bold text-xs"
							style={{
								backgroundColor: `${secondaryColor}30`,
								color: secondaryColor,
							}}
						>
							<ArrowUpRight className="h-3 w-3" />
							{metadata.power}
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 px-4 py-3">
			{tcgMode && (
				<div className="pointer-events-none absolute top-2 right-2 bottom-2 left-2 rounded border border-white/10" />
			)}
			{displayDescription && (
				<div className="relative line-clamp-3 text-sm italic">
					{tcgMode && (
						<div
							className="-left-2 -right-2 -top-1 -bottom-1 absolute rounded opacity-10"
							style={{
								background: `linear-gradient(135deg, ${primaryColor}70 0%, transparent 60%)`,
							}}
						/>
					)}
					<div className="relative">{displayDescription}</div>
				</div>
			)}
			{tcgMode && metadata && (
				<div className="my-1 grid grid-cols-2 gap-1.5">
					{metadata.healthPoints && (
						<div className="space-y-0.5">
							<div className="flex items-center justify-between text-[10px]">
								<span className="flex items-center gap-0.5 font-semibold">
									<Heart className="h-3 w-3 fill-red-500 stroke-red-600" /> HP
								</span>
								<span>{metadata.healthPoints}</span>
							</div>
							<Progress
								className="h-1.5 bg-red-950/30 from-red-800 to-red-500 [&_[data-slot=progress-indicator]]:bg-gradient-to-r"
								value={100}
							/>
						</div>
					)}
					{metadata.manaPoints && (
						<div className="space-y-0.5">
							<div className="flex items-center justify-between text-[10px]">
								<span className="flex items-center gap-0.5 font-semibold">
									<Wand className="h-3 w-3 text-blue-400" /> MP
								</span>
								<span>{metadata.manaPoints}</span>
							</div>
							<Progress
								className="h-1.5 bg-blue-950/30 from-blue-800 to-blue-500 [&_[data-slot=progress-indicator]]:bg-gradient-to-r"
								value={100}
							/>
						</div>
					)}
				</div>
			)}
			{stats && Object.keys(stats).length > 0 && (
				<div className="mt-1 grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
					{Object.entries(stats)
						.filter(([_, value]) => value !== undefined && typeof value === 'number')
						.slice(0, 6)
						.map(([key, value]) => (
							<motion.div
								className="flex items-center justify-between gap-1 rounded px-1.5 py-0.5"
								key={`stat-${key}`}
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
			<div className="mt-1 flex items-center justify-between text-xs">
				<div
					className="flex items-center gap-1 rounded-md px-2 py-0.5 font-bold"
					style={{
						backgroundColor: `${getAlignmentColor()}20`,
						color: getAlignmentColor(),
						border: `1px dashed ${getAlignmentColor()}40`,
					}}
				>
					<Sparkles className="h-3 w-3" /> {alignment}
				</div>
				{metadata?.rarityLevel && (
					<div
						className="rounded-md px-2 py-0.5 font-semibold"
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
			{normalizedAbilities.length > 0 && (
				<div className="mt-1.5 space-y-1.5">
					<div className="flex items-center font-semibold text-xs">
						<Sparkles className="mr-1 h-3.5 w-3.5 text-yellow-400" />
						<span>HABILIDADES</span>
					</div>
					<div className="space-y-1.5">
						{normalizedAbilities.slice(0, 2).map((ability) => (
							<motion.div
								className="relative overflow-hidden rounded border px-2 py-1.5 text-xs"
								key={`ability-${ability.name}`}
								style={{
									backgroundColor: `${primaryColor}30`,
									borderColor: `${primaryColor}50`,
									backgroundImage: tcgMode
										? `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}30, ${primaryColor}20)`
										: undefined,
								}}
								whileHover={{ scale: 1.02, y: -2 }}
							>
								{tcgMode && (
									<div
										className="pointer-events-none absolute inset-0 opacity-10"
										style={{
											backgroundImage: `radial-gradient(circle at 10% 10%, ${primaryColor}, transparent 60%)`,
										}}
									/>
								)}
								<div className="relative z-10">
									<div className="flex items-center font-bold">
										<Star className="mr-1 h-3 w-3 text-yellow-400" />
										{ability.name}
									</div>
									{ability.description && (
										<div className="mt-0.5 line-clamp-2 text-[10px] italic opacity-80">{ability.description}</div>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</div>
			)}
			{((goals && goals.length > 0) || (personality && personality.length > 0)) && (
				<div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] opacity-90">
					{goals && goals.length > 0 && (
						<div className="rounded px-1.5 py-1" style={{ backgroundColor: `${primaryColor}15` }}>
							<div className="mb-0.5 font-semibold">OBJETIVOS:</div>
							<ul className="list-inside list-disc pl-1">
								{goals.slice(0, 2).map((goal) => (
									<li className="truncate" key={`goal-${goal.substring(0, 15)}`}>
										{goal}
									</li>
								))}
							</ul>
						</div>
					)}
					{personality && personality.length > 0 && (
						<div className="rounded px-1.5 py-1" style={{ backgroundColor: `${secondaryColor}15` }}>
							<div className="mb-0.5 font-semibold">PERSONALIDAD:</div>
							<ul className="list-inside list-disc pl-1">
								{personality.slice(0, 2).map((trait) => (
									<li className="truncate" key={`trait-${trait.substring(0, 15)}`}>
										{trait}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
			{tcgMode && metadata?.cardId && <div className="mt-auto text-right text-[9px] opacity-60">{metadata.cardId}</div>}
		</div>
	);
}
