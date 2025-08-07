import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useCharacter, useRecentCharacterMedia } from '@/lib/api/characters';
import { cn } from '@/lib/utils';
import { CardContainer } from '../card-container';
import type { CharacterCardProps } from './character-card.types';
import { adaptCharacterWithStats } from './character-card-adapter';
import { CharacterCardContent } from './character-card-content';
import { CharacterCardFooter } from './character-card-footer';
import { CharacterCardHeader } from './character-card-header';
import { CharacterCardImages } from './character-card-images';

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
			if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick && character) {
				e.preventDefault();
				onClick(character);
			}
		},
		[onClick, disabled, character]
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
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
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
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Personaje no encontrado'}</p>
			</div>
		);
	}

	return (
		<motion.div
			aria-label={`Character: ${character.name}`}
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-[400px]',
				compact && 'h-[220px]',
				disabled && 'pointer-events-none opacity-70',
				className
			)}
			onClick={disabled || !character ? undefined : () => onClick?.(character)}
			onKeyDown={handleKeyDown}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			role={onClick ? 'button' : 'article'}
			tabIndex={disabled || !onClick ? -1 : 0}
			whileHover={disabled ? {} : { y: -8, transition: { duration: 0.3 } }}
			whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
		>
			<CardContainer
				className={cn(
					'transition-all duration-300',
					isHovered && 'scale-[1.02]',
					isSelected && 'ring-4 ring-primary/60'
				)}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			>
				{tcgMode && (
					<>
						<div
							className="pointer-events-none absolute inset-0 z-1 opacity-0 transition-opacity duration-300 hover:opacity-30"
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
						<div className="pointer-events-none absolute inset-0 z-1 opacity-0 transition-opacity duration-300 hover:opacity-20">
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
						<div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/3 left-1/2 z-1 h-20 w-20 opacity-10">
							<div
								className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed"
								style={{ borderColor: primaryColor }}
							>
								<div className="font-bold text-xs" style={{ color: primaryColor }}>
									POWER
									<br />
									{character.metadata?.power}
								</div>
							</div>
						</div>
						{character.isFavorite && (
							<div className="pointer-events-none absolute top-0 right-0 z-30 h-24 w-24 overflow-hidden">
								<div
									className="-translate-y-8 absolute top-0 right-0 h-24 w-24 translate-x-12 rotate-45 opacity-70"
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
				<div className="relative z-1 flex h-full flex-col">
					<CharacterCardHeader
						class={character.class}
						color={primaryColor}
						compact={compact}
						emoji={character.emoji || ''}
						isFavorite={character.isFavorite}
						level={character.level}
						name={character.name || 'Sin nombre'}
						race={character.race}
						tcgMode={tcgMode}
					/>
					{!compact && (
						<>
							<CharacterCardImages
								compact={false}
								images={recentMediaData?.map((m) => m.thumbnailUrl) ?? []}
								tcgMode={tcgMode}
							/>
							<CharacterCardContent
								abilities={character.parsedAbilities}
								alignment={character.alignment}
								backstory={character.backstory}
								description={character.description}
								metadata={character.metadata}
								primaryColor={primaryColor}
								secondaryColor={secondaryColor}
								stats={character.stats}
								tcgMode={tcgMode}
							/>
						</>
					)}
					<CharacterCardFooter
						cardId={character.metadata?.cardId ?? ''}
						compact={compact}
						id={character.id}
						level={character.level}
						primaryColor={primaryColor}
						rarityLevel={
							character.metadata?.rarityLevel
								? ({ Common: 1, Uncommon: 2, Rare: 3, Mythic: 4 }[character.metadata.rarityLevel] ?? 1)
								: 1
						}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}
