import { Heart, Image, Tag, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { VideoWithStats } from '@/types/entities/video';

interface VideoCardFooterProps {
	video: VideoWithStats;
	primaryColor: string;
	secondaryColor: string;
	cardId: string;
	rarityLevel: number;
	totalRelations: number;
	tcgMode?: boolean;
	compact?: boolean;
}

const RARITY_KEYS = ['one', 'two', 'three', 'four', 'five'] as const;

function CountBadge(props: { count: number; icon: ReactNode; primaryColor: string; tcgMode: boolean; glow: number }) {
	const { count, icon, primaryColor, tcgMode, glow } = props;
	if (count <= 0) {
		return null;
	}
	return (
		<div
			className={cn('flex items-center gap-1 rounded px-2 py-1 text-xs', tcgMode && 'border')}
			style={{
				backgroundColor: tcgMode ? `${primaryColor}15` : 'rgba(0,0,0,0.1)',
				borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
				boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}60` : 'none',
			}}
		>
			{icon}
			<span className="font-medium">{count}</span>
		</div>
	);
}

function TcgIdBadge(props: { cardId: string; primaryColor: string; show: boolean }) {
	const { cardId, primaryColor, show } = props;
	if (!show) {
		return null;
	}
	return (
		<div
			className="rounded border px-2 py-1 font-mono text-xs"
			style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30`, color: primaryColor }}
		>
			{cardId}
		</div>
	);
}

function TechnicalGradeBadge(props: {
	technicalGrade: string | number;
	primaryColor: string;
	tcgMode: boolean;
	glow: number;
}) {
	const { technicalGrade, primaryColor, tcgMode, glow } = props;
	return (
		<div
			className={cn('rounded px-2 py-1 font-bold text-xs', tcgMode && 'border')}
			style={{
				backgroundColor: `${primaryColor}20`,
				borderColor: tcgMode ? `${primaryColor}50` : 'transparent',
				color: primaryColor,
				boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}40` : 'none',
			}}
		>
			{technicalGrade}
		</div>
	);
}

function RarityDots(props: { show: boolean; cardId: string; rarityLevel: number; primaryColor: string }) {
	const { show, cardId, rarityLevel, primaryColor } = props;
	if (!show) {
		return null;
	}
	const filled = Math.floor(rarityLevel / 2);
	return (
		<div className="mt-2 flex justify-center">
			<div className="flex gap-1">
				{RARITY_KEYS.map((k, i) => (
					<div
						className={cn('h-1 w-1 rounded-full', i < filled ? 'opacity-100' : 'opacity-30')}
						key={`${cardId}-rarity-${k}`}
						style={{ backgroundColor: primaryColor }}
					/>
				))}
			</div>
		</div>
	);
}

/**
 * 🎬 Footer del VideoCard con conteos y stats TCG
 */
export function VideoCardFooter(props: VideoCardFooterProps) {
	const { video, primaryColor, secondaryColor, cardId, rarityLevel, tcgMode = true, compact = false } = props;
	const { isFavorite } = video;
	const {
		albumCount: albumsCount,
		collectionCount: collectionsCount,
		tagCount: tagsCount,
		technicalGrade,
	} = video.stats;

	let glow = 0;
	if (rarityLevel >= 7) {
		glow = 4;
	} else if (rarityLevel >= 5) {
		glow = 2;
	}

	return (
		<div className={cn('mt-auto border-t', compact ? 'p-2' : 'p-3')} style={{ borderColor: `${primaryColor}30` }}>
			{tcgMode ? (
				<div
					className="absolute inset-0 opacity-10"
					style={{ background: `linear-gradient(0deg, ${secondaryColor}40, transparent 50%)` }}
				/>
			) : null}

			<div className="relative z-10 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<CountBadge
						count={albumsCount}
						glow={glow}
						icon={<Image className="h-3 w-3" />}
						primaryColor={primaryColor}
						tcgMode={tcgMode}
					/>
					<CountBadge
						count={tagsCount}
						glow={glow}
						icon={<Tag className="h-3 w-3" />}
						primaryColor={primaryColor}
						tcgMode={tcgMode}
					/>
					<CountBadge
						count={collectionsCount}
						glow={glow}
						icon={<Users className="h-3 w-3" />}
						primaryColor={primaryColor}
						tcgMode={tcgMode}
					/>
				</div>

				<div className="flex items-center gap-2">
					{isFavorite ? <Heart className="h-4 w-4 fill-red-500 text-red-500" /> : null}
					<TcgIdBadge cardId={cardId} primaryColor={primaryColor} show={tcgMode && !compact} />
					<TechnicalGradeBadge
						glow={glow}
						primaryColor={primaryColor}
						tcgMode={tcgMode}
						technicalGrade={technicalGrade}
					/>
				</div>
			</div>

			<RarityDots
				cardId={cardId}
				primaryColor={primaryColor}
				rarityLevel={rarityLevel}
				show={tcgMode && rarityLevel >= 5}
			/>
		</div>
	);
}
