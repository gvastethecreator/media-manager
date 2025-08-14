import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, Brain, Heart, Shield, Sparkles, Star, Swords, User, Wand, Zap } from 'lucide-react';
import { motion } from 'motion/react';

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
	const displayDescription = computeDisplayDescription(description, compact);
	const alignmentColor = computeAlignmentColor(alignment);
	const normalizedAbilities = normalizeAbilities(abilities);

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
			<StatsGrid primaryColor={primaryColor} stats={stats} tcgMode={tcgMode} />
			<AlignmentAndRarity
				alignment={alignment}
				alignmentColor={alignmentColor}
				metadata={metadata}
				secondaryColor={secondaryColor}
			/>
			<AbilitiesList
				abilities={normalizedAbilities}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
			/>
			<GoalsAndPersonality
				goals={goals}
				personality={personality}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>
			{tcgMode && metadata?.cardId && <div className="mt-auto text-right text-[9px] opacity-60">{metadata.cardId}</div>}
		</div>
	);
}

// --- Helpers extraídos ---
function computeDisplayDescription(description?: string | null, compact?: boolean): string {
	if (!description) {
		return '';
	}
	if (compact) {
		const COMPACT_LIMIT = 60;
		if (description.length > COMPACT_LIMIT) {
			return `${description.substring(0, COMPACT_LIMIT)}...`;
		}
	}
	return description;
}

function computeAlignmentColor(alignment?: string | null): string {
	const align = alignment?.toLowerCase() ?? 'neutral';
	if (align.includes('evil')) {
		return '#dc2626';
	}
	if (align.includes('good')) {
		return '#16a34a';
	}
	if (align.includes('lawful')) {
		return '#2563eb';
	}
	if (align.includes('chaotic')) {
		return '#d97706';
	}
	return '#6b7280';
}

function normalizeAbilities(
	abilities: CharacterCardContentProps['abilities']
): Array<{ name: string; description?: string }> {
	if (!abilities) {
		return [];
	}
	if (Array.isArray(abilities)) {
		return abilities.map((a) => (typeof a === 'string' ? { name: a, description: '' } : a));
	}
	return Object.entries(abilities).map(([name, abilityDesc]) => ({
		name,
		description: typeof abilityDesc === 'string' ? abilityDesc : '',
	}));
}

function statIcon(statKey: string) {
	const key = statKey.toLowerCase();
	const iconMatchers: Array<{ match: string[]; icon: React.ReactElement }> = [
		{ match: ['str', 'force', 'power'], icon: <Swords className="h-3 w-3" /> },
		{ match: ['int', 'intellect'], icon: <Brain className="h-3 w-3" /> },
		{ match: ['wis', 'wisdom'], icon: <Sparkles className="h-3 w-3" /> },
		{ match: ['dex', 'agility', 'speed'], icon: <Zap className="h-3 w-3" /> },
		{ match: ['con', 'armor', 'stamina'], icon: <Shield className="h-3 w-3" /> },
		{ match: ['cha', 'soc', 'charisma'], icon: <User className="h-3 w-3" /> },
		{ match: ['hp', 'health'], icon: <Heart className="h-3 w-3" /> },
		{ match: ['mp', 'mana'], icon: <Wand className="h-3 w-3" /> },
	];
	for (const { match, icon } of iconMatchers) {
		if (match.some((m) => key.includes(m))) {
			return icon;
		}
	}
	return <Star className="h-3 w-3" />;
}

function formatStatName(statKey: string) {
	const formatted = statKey
		.replace(/([A-Z])/g, ' $1')
		.replace(/_/g, ' ')
		.trim()
		.split(' ')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ');
	const lower = formatted.toLowerCase();
	if (lower.includes('strength')) {
		return 'STR';
	}
	if (lower.includes('dexterity')) {
		return 'DEX';
	}
	if (lower.includes('constitution')) {
		return 'CON';
	}
	if (lower.includes('intelligence')) {
		return 'INT';
	}
	if (lower.includes('wisdom')) {
		return 'WIS';
	}
	if (lower.includes('charisma')) {
		return 'CHA';
	}
	return formatted;
}

// --- Subcomponentes ---
const StatsGrid: React.FC<{ stats?: CharacterStats | null; primaryColor: string; tcgMode: boolean }> = ({
	stats,
	primaryColor,
	tcgMode,
}) => {
	if (!stats || Object.keys(stats).length === 0) {
		return null;
	}
	return (
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
							{statIcon(key)}
							<span className="font-semibold">{formatStatName(key)}</span>
						</div>
						<span>{value}</span>
					</motion.div>
				))}
		</div>
	);
};

const AlignmentAndRarity: React.FC<{
	alignment?: string | null;
	alignmentColor: string;
	metadata?: CharacterCardContentProps['metadata'];
	secondaryColor: string;
}> = ({ alignment, alignmentColor, metadata, secondaryColor }) => (
	<div className="mt-1 flex items-center justify-between text-xs">
		<div
			className="flex items-center gap-1 rounded-md px-2 py-0.5 font-bold"
			style={{
				backgroundColor: `${alignmentColor}20`,
				color: alignmentColor,
				border: `1px dashed ${alignmentColor}40`,
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
);

const AbilitiesList: React.FC<{
	abilities: Array<{ name: string; description?: string }>;
	primaryColor: string;
	secondaryColor: string;
	tcgMode: boolean;
}> = ({ abilities, primaryColor, secondaryColor, tcgMode }) => {
	if (abilities.length === 0) {
		return null;
	}
	return (
		<div className="mt-1.5 space-y-1.5">
			<div className="flex items-center font-semibold text-xs">
				<Sparkles className="mr-1 h-3.5 w-3.5 text-yellow-400" />
				<span>HABILIDADES</span>
			</div>
			<div className="space-y-1.5">
				{abilities.slice(0, 2).map((ability) => (
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
								style={{ backgroundImage: `radial-gradient(circle at 10% 10%, ${primaryColor}, transparent 60%)` }}
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
	);
};

const GoalsAndPersonality: React.FC<{
	goals?: string[] | null;
	personality?: string[] | null;
	primaryColor: string;
	secondaryColor: string;
}> = ({ goals, personality, primaryColor, secondaryColor }) => {
	if (!((goals && goals.length > 0) || (personality && personality.length > 0))) {
		return null;
	}
	return (
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
	);
};
