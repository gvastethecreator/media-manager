import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/animejs-shim';
import { useCharacter, useRecentCharacterMedia } from '@/lib/api/characters';
import { cn } from '@/lib/utils';
import { CardContainer } from '../card-container';
import type { CharacterCardProps } from './character-card.types';
import { adaptCharacterWithStats } from './character-card-adapter';
import { CharacterCardContent } from './character-card-content';
import { CharacterCardFooter } from './character-card-footer';
import { CharacterCardHeader } from './character-card-header';
import { CharacterCardImages } from './character-card-images';

function LoadingPlaceholder({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-muted md:w-[320px] dark:bg-background',
				className
			)}
		>
			<p className="text-muted-foreground">Cargando personaje...</p>
		</div>
	);
}

function ErrorPlaceholder({ className, message }: { className?: string; message?: string }) {
	return (
		<div
			className={cn(
				'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
				className
			)}
		>
			<p className="text-destructive">Error: {message || 'Personaje no encontrado'}</p>
		</div>
	);
}

function TcgVisualOverlays({
	tcgMode,
	primaryColor,
	secondaryColor,
	rarityLevel,
	power,
	isFavorite,
}: {
	tcgMode: boolean;
	primaryColor: string;
	secondaryColor: string;
	rarityLevel?: string | null;
	power?: number | null;
	isFavorite: boolean;
}) {
	if (!tcgMode) {
		return null;
	}
	return (
		<>
			<div
				className="pointer-events-none absolute inset-0 z-1 opacity-0 transition-opacity duration-300 hover:opacity-30"
				style={{
					backgroundImage: `
						linear-gradient(125deg,
						transparent 0%,
						color-mix(in oklab, ${primaryColor}, transparent 70%) 25%,
						color-mix(in oklab, ${secondaryColor}, transparent 70%) 50%,
						color-mix(in oklab, ${primaryColor}, transparent 70%) 75%,
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
						background: getRarityGradientStatic(primaryColor, secondaryColor, rarityLevel),
						backgroundSize: '300% 300%',
						animation: 'shine 6s linear infinite',
					}}
				/>
			</div>
			<div className="pointer-events-none absolute top-1/3 left-1/2 z-1 h-20 w-20 -translate-x-1/2 -translate-y-1/2 opacity-10">
				<div
					className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed"
					style={{ borderColor: primaryColor }}
				>
					<div className="font-bold text-sm" style={{ color: primaryColor }}>
						POWER
						<br />
						{power}
					</div>
				</div>
			</div>
			{isFavorite && (
				<div className="pointer-events-none absolute top-0 right-0 z-30 h-24 w-24 overflow-hidden">
					<div
						className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-8 rotate-45 opacity-70"
						style={{
							background: `linear-gradient(45deg, transparent 30%, ${primaryColor} 40%, gold 50%, ${primaryColor} 60%, transparent 70%)`,
							backgroundSize: '600% 600%',
							animation: 'shine 3s linear infinite',
						}}
					/>
				</div>
			)}
		</>
	);
}

// Versión estática del gradiente por rareza para usar fuera del componente
function getRarityGradientStatic(primaryColor: string, secondaryColor: string, rarity?: string | null) {
	const base = `linear-gradient(45deg, transparent, color-mix(in oklab, ${primaryColor}, transparent 60%), transparent)`;
	if (!rarity) {
		return base;
	}
	switch (rarity) {
		case 'Mythic':
			return `linear-gradient(45deg, transparent, color-mix(in oklab, ${primaryColor}, transparent 30%), gold, color-mix(in oklab, ${primaryColor}, transparent 30%), transparent)`;
		case 'Rare':
			return `linear-gradient(45deg, transparent, color-mix(in oklab, ${primaryColor}, transparent 30%), silver, color-mix(in oklab, ${primaryColor}, transparent 30%), transparent)`;
		case 'Uncommon':
			return `linear-gradient(45deg, transparent, color-mix(in oklab, ${primaryColor}, transparent 30%), color-mix(in oklab, ${secondaryColor}, transparent 30%), transparent)`;
		default:
			return base;
	}
}

// Helper secundario: color de contraste a partir del personaje
function getSecondaryColorFromCharacter(character: { color?: string | null; class?: string | null } | null) {
	if (!character?.color) {
		const classLower = character?.class?.toLowerCase() ?? '';
		const map: Record<string, string> = {
			warrior: 'var(--preset-red)',
			mage: 'var(--preset-blue)',
			rogue: 'var(--preset-green)',
		};
		return map[classLower] ?? 'var(--entity-character)';
	}

	return `color-mix(in oklab, ${character.color}, black 20%)`;
}

function CardShell({
	ariaLabel,
	className,
	compact,
	tcgMode,
	disabled,
	isSelected,
	onClick,
	onKeyDown,
	primaryColor,
	secondaryColor,
	children,
}: {
	ariaLabel: string;
	className?: string;
	compact: boolean;
	tcgMode: boolean;
	disabled: boolean;
	isSelected: boolean;
	onClick?: () => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	primaryColor: string;
	secondaryColor: string;
	children: React.ReactNode;
}) {
	const [isHovered, setIsHovered] = useState(false);
	return (
		<motion.div
			aria-label={ariaLabel}
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-[400px]',
				compact && 'h-[220px]',
				disabled && 'pointer-events-none opacity-70',
				className
			)}
			onClick={disabled ? undefined : onClick}
			onKeyDown={onKeyDown}
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
				{children}
			</CardContainer>
		</motion.div>
	);
}

function CharacterCardBody({
	character,
	compact,
	tcgMode,
	disabled,
	className,
	isSelected,
	onClick,
	recentThumbnails,
}: {
	character: ReturnType<typeof adaptCharacterWithStats>;
	compact: boolean;
	tcgMode: boolean;
	disabled: boolean;
	className?: string;
	isSelected: boolean;
	onClick?: (c: any) => void;
	recentThumbnails: string[];
}) {
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
				e.preventDefault();
				onClick(character);
			}
		},
		[onClick, disabled, character]
	);

	const primaryColor = useMemo(() => character?.color || 'var(--entity-character)', [character?.color]);
	const secondaryColor = useMemo(() => getSecondaryColorFromCharacter(character), [character]);

	const getRarityGradient = useCallback(
		(rarity?: string | null) => getRarityGradientStatic(primaryColor, secondaryColor, rarity),
		[primaryColor, secondaryColor]
	);

	return (
		<CardShell
			ariaLabel={`Character: ${character.name}`}
			className={className}
			compact={compact}
			disabled={disabled}
			isSelected={isSelected}
			onClick={onClick ? () => onClick(character) : undefined}
			onKeyDown={handleKeyDown}
			primaryColor={primaryColor}
			secondaryColor={secondaryColor}
			tcgMode={tcgMode}
		>
			<div className="relative z-1 flex h-full flex-col">
				<TcgVisualOverlays
					isFavorite={character.isFavorite}
					power={character.metadata?.power}
					primaryColor={primaryColor}
					rarityLevel={character.metadata?.rarityLevel}
					secondaryColor={secondaryColor}
					tcgMode={tcgMode}
				/>
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
						<CharacterCardImages compact={false} images={recentThumbnails} tcgMode={tcgMode} />
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
		</CardShell>
	);
}

export function CharacterCard({
	characterId,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	onSelect,
	isSelected = false,
}: CharacterCardProps) {
	const { data: characterData, isLoading, error } = useCharacter(characterId);
	const { data: recentMediaData } = useRecentCharacterMedia(characterId);

	const handleCardSelect = useCallback(
		(c: ReturnType<typeof adaptCharacterWithStats>) => {
			onSelect?.(c as any);
			onClick?.(c as any);
		},
		[onClick, onSelect]
	);

	const character = useMemo(() => (characterData ? adaptCharacterWithStats(characterData) : null), [characterData]);

	if (isLoading) {
		return <LoadingPlaceholder className={className} />;
	}

	if (error || !character) {
		return <ErrorPlaceholder className={className} message={error?.message} />;
	}

	const thumbnails = (recentMediaData ?? []).map((m) => m.thumbnailUrl);

	return (
		<CharacterCardBody
			character={character}
			className={className}
			compact={compact}
			disabled={disabled}
			isSelected={isSelected}
			onClick={onSelect || onClick ? handleCardSelect : undefined}
			recentThumbnails={thumbnails}
			tcgMode={tcgMode}
		/>
	);
}
