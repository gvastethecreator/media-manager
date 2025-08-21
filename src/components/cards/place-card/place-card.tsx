import { motion } from 'motion/react';
import React, { useCallback, useMemo, useState } from 'react';
import { getRarityGradient } from '@/components/cards/shared/rarity-gradients';
import { darkenHex } from '@/components/cards/shared/rarity-style';
import { usePlace, useRecentPlaceMedia } from '@/lib/api/places';
import { cn } from '@/lib/utils';
import { PlaceWithStats } from '@/types/entities/place';
import { CardContainer } from '../card-container';
import { PlaceCardContent } from './place-card-content';
import { PlaceCardFooter } from './place-card-footer';
import { PlaceCardHeader } from './place-card-header';
import { PlaceCardImages } from './place-card-images';

export interface PlaceCardProps {
	/** ID del lugar a mostrar */
	placeId: string;
	/** Tamaño compacto con menos información */
	compact?: boolean;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
	/** Deshabilitar interacciones */
	disabled?: boolean;
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: (placeData: PlaceWithStats) => void;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
}

/**
 * Componente de tarjeta de lugar inspirado en cartas TCG
 * Muestra información detallada de un lugar con elementos visuales de Trading Card Game
 */
// --- Helpers & constantes extraídas para reducir complejidad del componente principal ---

const TYPE_COLORS: Record<string, string> = {
	city: '#2563eb',
	forest: '#047857',
	mountain: '#b91c1c',
	desert: '#d97706',
};

// darkenHex centralizado en shared/rarity-style

function computeSecondaryColor(color: string | undefined, type: string | undefined): string {
	if (!color) {
		return TYPE_COLORS[type ?? ''] || '#064e3b';
	}
	return darkenHex(color, 0.7);
}

interface DerivedPlaceData {
	primaryColor: string;
	secondaryColor: string;
	rarityLevel: number;
	power: number;
	healthPoints: number;
	valueLevel: number;
	cardId: string;
	imagesCount: number;
	videosCount: number;
	cardMedia: Array<{ id: string; name: string; thumbnailUrl: string; url: string; type: string; isVideo: boolean }>;
	parsedResources: { name: string; abundance: number; description?: string }[];
	parsedDangers: { type: string; level: number; description?: string }[];
	parsedStats: Record<string, number>;
	population: number;
}

function normalizeArrays(parsedResources: unknown, parsedDangers: unknown, parsedStats: unknown) {
	const safeParsedResources = Array.isArray(parsedResources)
		? (parsedResources as { name: string; abundance: number; description?: string }[])
		: [];
	const safeParsedDangers = Array.isArray(parsedDangers)
		? (parsedDangers as { type: string; level: number; description?: string }[])
		: [];
	const safeParsedStats = parsedStats && typeof parsedStats === 'object' ? (parsedStats as Record<string, number>) : {};
	return { safeParsedResources, safeParsedDangers, safeParsedStats };
}

function buildCardMedia(recentMediaData: any[] | undefined) {
	return (recentMediaData || []).map((media) => ({
		id: media.id,
		name: media.name,
		thumbnailUrl: media.thumbnailUrl || '',
		url: media.url || '',
		type: media.type,
		isVideo: media.type === 'video',
	}));
}

function extractMetadata(metadata: unknown, id: string) {
	const parsedMetadata = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
	return {
		rarityLevel: (parsedMetadata.rarityLevel as number) || 1,
		power: (parsedMetadata.power as number) || 1,
		healthPoints: (parsedMetadata.healthPoints as number) || 100,
		valueLevel: (parsedMetadata.valueLevel as number) || 1,
		cardId: (parsedMetadata.cardId as string) || `P${String(id).substring(0, 6)}`,
	};
}

function preparePlaceDerivedData(place: PlaceWithStats, recentMediaData: any[] | undefined): DerivedPlaceData {
	const {
		color = '#10b981',
		type,
		parsedResources = [],
		parsedDangers = [],
		parsedStats = {},
		metadata,
		_count,
		population: rawPopulation = 0,
		id,
	} = place as any;
	const population = typeof rawPopulation === 'string' ? Number.parseInt(rawPopulation, 10) : rawPopulation;
	const primaryColor = color || '#10b981';
	const secondaryColor = computeSecondaryColor(color, type);
	const { safeParsedResources, safeParsedDangers, safeParsedStats } = normalizeArrays(
		parsedResources,
		parsedDangers,
		parsedStats
	);
	const cardMedia = buildCardMedia(recentMediaData);
	const { rarityLevel, power, healthPoints, valueLevel, cardId } = extractMetadata(metadata, String(id));
	return {
		primaryColor,
		secondaryColor,
		rarityLevel,
		power,
		healthPoints,
		valueLevel,
		cardId,
		imagesCount: _count?.images || 0,
		videosCount: _count?.videos || 0,
		cardMedia,
		parsedResources: safeParsedResources,
		parsedDangers: safeParsedDangers,
		parsedStats: safeParsedStats,
		population: typeof population === 'string' ? Number.parseInt(population, 10) : population,
	};
}

// --- Componentes de presentación auxiliares ---

const PlaceCardLoading: React.FC<{ className?: string }> = ({ className }) => (
	<div
		className={cn(
			'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
			className
		)}
	>
		<p className="text-gray-500">Cargando lugar...</p>
	</div>
);

const PlaceCardError: React.FC<{ className?: string; message: string }> = ({ className, message }) => (
	<div
		className={cn(
			'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
			className
		)}
	>
		<p className="text-red-800">Error: {message}</p>
	</div>
);

interface PlaceCardViewProps extends Omit<PlaceCardProps, 'placeId'> {
	place: PlaceWithStats;
	derived: DerivedPlaceData;
}

const TCGEffects: React.FC<{
	tcgMode: boolean;
	isFavorite: boolean;
	primaryColor: string;
	secondaryColor: string;
	rarityLevel: number;
	valueLevel: number;
}> = ({ tcgMode, isFavorite, primaryColor, secondaryColor, rarityLevel, valueLevel }) => {
	if (!tcgMode) {
		return null;
	}
	return (
		<>
			<div
				className="pointer-events-none absolute inset-0 z-1 opacity-0 transition-opacity duration-300 hover:opacity-30"
				style={{
					backgroundImage: `linear-gradient(125deg,transparent 0%,${primaryColor}30 25%,${secondaryColor}30 50%,${primaryColor}30 75%,transparent 100%)`,
					backgroundSize: '200% 200%',
					animation: 'gradient-shift 3s ease infinite',
				}}
			/>
			<div className="pointer-events-none absolute inset-0 z-1 opacity-0 transition-opacity duration-300 hover:opacity-20">
				<div
					className="absolute inset-0"
					style={{
						background: getRarityGradient({ level: rarityLevel, primary: primaryColor, secondary: secondaryColor }),
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
						VALOR
						<br />
						{valueLevel}
					</div>
				</div>
			</div>
			{isFavorite && (
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
	);
};

// Reducir complejidad: dividir extracción de props y render
function usePlaceCardViewKeyboard(
	disabled: boolean,
	onClick: ((p: PlaceWithStats) => void) | undefined,
	place: PlaceWithStats
) {
	return useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
				e.preventDefault();
				onClick(place);
			}
		},
		[onClick, disabled, place]
	);
}

const PlaceCardView: React.FC<PlaceCardViewProps> = ({
	place,
	derived,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const {
		name,
		emoji = '📍',
		climate = 'templado',
		region = 'desconocido',
		type = 'desconocido',
		description,
		government,
		isFavorite = false,
		createdAt,
	} = place as any;
	const {
		primaryColor,
		secondaryColor,
		rarityLevel,
		valueLevel,
		cardId,
		healthPoints,
		power,
		imagesCount,
		videosCount,
		cardMedia,
		parsedResources,
		parsedDangers,
		parsedStats,
		population,
	} = derived;

	const handleKeyDown = usePlaceCardViewKeyboard(disabled, onClick, place);

	const renderMediaAndContent = () => {
		if (compact) {
			return null;
		}
		return (
			<>
				<PlaceCardImages
					compact={false}
					images={cardMedia}
					mainImage={cardMedia[0]}
					primaryColor={primaryColor}
					rarityLevel={rarityLevel}
					tcgMode={tcgMode}
				/>
				<PlaceCardContent
					climate={climate || undefined}
					description={description || undefined}
					government={government || undefined}
					parsedDangers={parsedDangers}
					parsedResources={parsedResources}
					parsedStats={parsedStats}
					population={population || 0}
				/>
				<PlaceCardFooter
					cardId={cardId}
					compact={compact}
					createdAt={createdAt}
					healthPoints={healthPoints}
					imagesCount={imagesCount}
					power={power}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
					tcgMode={tcgMode}
					videosCount={videosCount}
				/>
			</>
		);
	};

	return (
		<motion.div
			aria-label={`Lugar: ${name}`}
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-[400px]',
				compact && 'h-[220px]',
				disabled && 'pointer-events-none opacity-70',
				className
			)}
			onClick={disabled || !onClick ? undefined : () => onClick(place)}
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
				<TCGEffects
					isFavorite={isFavorite}
					primaryColor={primaryColor}
					rarityLevel={rarityLevel}
					secondaryColor={secondaryColor}
					tcgMode={tcgMode}
					valueLevel={valueLevel}
				/>
				<div className="relative z-1 flex h-full flex-col">
					<PlaceCardHeader
						climate={climate}
						color={primaryColor}
						compact={compact}
						emoji={emoji}
						isFavorite={isFavorite}
						name={name}
						region={region}
						tcgMode={tcgMode}
						type={type}
					/>
					{renderMediaAndContent()}
				</div>
			</CardContainer>
		</motion.div>
	);
};

export function PlaceCard({
	placeId,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
}: PlaceCardProps) {
	const { data: place, isLoading, error } = usePlace(placeId);
	const { data: recentMediaData } = useRecentPlaceMedia(placeId);

	if (isLoading) {
		return <PlaceCardLoading className={className} />;
	}
	if (error || !place) {
		return <PlaceCardError className={className} message={error?.message || 'Lugar no encontrado'} />;
	}

	const derived = useMemo(() => preparePlaceDerivedData(place, recentMediaData), [place, recentMediaData]);

	return (
		<PlaceCardView
			className={className}
			compact={compact}
			derived={derived}
			disabled={disabled}
			isSelected={isSelected}
			onClick={onClick}
			place={place}
			tcgMode={tcgMode}
		/>
	);
}
