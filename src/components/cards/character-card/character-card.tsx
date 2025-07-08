import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useCharacter, useRecentCharacterMedia } from '@/lib/api/characters';
import { cn } from '@/lib/utils';
import type { CharacterWithStats } from '@/types/entities/character';
import { CardContainer } from '../card-container';
import { adaptCharacterWithStats } from './character-card-adapter';
import { CharacterCardContent } from './character-card-content';
import { CharacterCardFooter } from './character-card-footer';
import { CharacterCardHeader } from './character-card-header';
import { CharacterCardImages } from './character-card-images';

export interface CharacterCardProps {
	characterId: string;
	compact?: boolean;
	tcgMode?: boolean;
	disabled?: boolean;
	className?: string;
	onClick?: (characterData: CharacterWithStats) => void;
	isSelected?: boolean;
}

export function CharacterCard({
	characterId,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
}: CharacterCardProps) {
	const { data: characterData, isLoading, error } = useCharacter(characterId);
	const { data: recentMediaData } = useRecentCharacterMedia(characterId);
	const [isHovered, setIsHovered] = useState(false);

	const character = useMemo(() => {
		if (!characterData) return null;
		return adaptCharacterWithStats(characterData);
	}, [characterData]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick && characterData) {
				e.preventDefault();
				onClick(characterData);
			}
		},
		[onClick, disabled, characterData]
	);

	const primaryColor = useMemo(() => character?.color || '#8e44ad', [character?.color]);
	const secondaryColor = useMemo(() => {
		if (!character?.color) {
			const classLower = character?.class?.toLowerCase();
			if (classLower === 'warrior') return '#c0392b';
			if (classLower === 'mage') return '#2980b9';
			if (classLower === 'rogue') return '#27ae60';
			return '#8e44ad';
		}
		try {
			const r = Number.parseInt(character.color.slice(1, 3), 16);
			const g = Number.parseInt(character.color.slice(3, 5), 16);
			const b = Number.parseInt(character.color.slice(5, 7), 16);
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			return '#6d28d9';
		}
	}, [character?.color, character?.class]);

	if (isLoading) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
					className
				)}
			>
				<p className="text-gray-500">Cargando personaje...</p>
			</div>
		);
	}

	if (error || !character) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-red-100 dark:bg-red-900 flex items-center justify-center',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Personaje no encontrado'}</p>
			</div>
		);
	}

	return (
		<motion.div
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-[400px]',
				compact && 'h-[220px]',
				disabled && 'opacity-70 pointer-events-none',
				className
			)}
			whileHover={!disabled ? { y: -8, transition: { duration: 0.3 } } : {}}
			whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
			onClick={disabled ? undefined : () => onClick?.(characterData)}
			onKeyDown={handleKeyDown}
			tabIndex={disabled || !onClick ? -1 : 0}
			role={onClick ? 'button' : 'article'}
			aria-label={`Character: ${character.name}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<CardContainer
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				className={cn(
					'transition-all duration-300',
					isHovered && 'scale-[1.02]',
					isSelected && 'ring-4 ring-primary/60'
				)}
			>
				{tcgMode && (
					<>
						<div
							className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none z-1"
							style={{
								backgroundImage: `
									linear-gradient(125deg,
									transparent 0%,
									${primaryColor}30 25%,
									${secondaryColor}30 50%,
									${primaryColor}30 75%,
									transparent 100%)
								`,
								backgroundSize: '200% 200%',
								animation: 'gradient-shift 3s ease infinite',
							}}
						/>
						<div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none z-1">
							<div
								className="absolute inset-0"
								style={{
									background:
										character.metadata?.rarityLevel === 'Mythic'
											? `linear-gradient(45deg, transparent, ${primaryColor}70, gold, ${primaryColor}70, transparent)`
											: character.metadata?.rarityLevel === 'Rare'
												? `linear-gradient(45deg, transparent, ${primaryColor}70, silver, ${primaryColor}70, transparent)`
												: character.metadata?.rarityLevel === 'Uncommon'
													? `linear-gradient(45deg, transparent, ${primaryColor}70, ${secondaryColor}70, transparent)`
													: `linear-gradient(45deg, transparent, ${primaryColor}40, transparent)`,
									backgroundSize: '300% 300%',
									animation: 'shine 6s linear infinite',
								}}
							/>
						</div>
						<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 opacity-10 pointer-events-none z-1">
							<div
								className="w-full h-full rounded-full border-2 border-dashed flex items-center justify-center"
								style={{ borderColor: primaryColor }}
							>
								<div className="text-xs font-bold" style={{ color: primaryColor }}>
									POWER
									<br />
									{character.metadata?.power}
								</div>
							</div>
						</div>
						{character.isFavorite && (
							<div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
								<div
									className="absolute top-0 right-0 w-24 h-24 rotate-45 translate-x-12 -translate-y-8 opacity-70"
									style={{
										background: `linear-gradient(45deg, transparent 30%, ${primaryColor} 40%, gold 50%, ${primaryColor} 60%, transparent 70%)`,
										backgroundSize: '600% 600%',
										animation: 'shine 3s linear infinite',
									}}
								/>
							</div>
						)}
					</>
				)}
				<div className="flex flex-col h-full relative z-1">
					<CharacterCardHeader
						name={character.name || 'Sin nombre'}
						emoji={character.emoji || ''}
						color={primaryColor}
						isFavorite={character.isFavorite || false}
						class={character.class}
						level={character.level}
						race={character.race}
						tcgMode={tcgMode}
						compact={compact}
					/>
					{!compact && (
						<>
							<CharacterCardImages images={recentMediaData?.map((m) => m.thumbnailUrl) ?? []} tcgMode={tcgMode} compact={false} />
							<CharacterCardContent
								description={character.description}
								stats={character.stats}
								abilities={character.parsedAbilities}
								backstory={character.backstory}
								alignment={character.alignment}
								primaryColor={primaryColor}
								secondaryColor={secondaryColor}
								metadata={character.metadata}
								tcgMode={tcgMode}
							/>
						</>
					)}
					<CharacterCardFooter
						id={character.id}
						cardId={character.metadata?.cardId ?? ''}
						rarityLevel={character.metadata?.rarityLevel ? { Common: 1, Uncommon: 2, Rare: 3, Mythic: 4 }[character.metadata.rarityLevel] ?? 1 : 1}
						primaryColor={primaryColor}
						level={character.level}
						compact={compact}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}