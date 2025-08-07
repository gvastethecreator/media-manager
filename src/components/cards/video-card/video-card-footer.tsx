import { Heart, Image, Tag, Users } from 'lucide-react';
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

/**
 * 🎬 Footer del VideoCard con conteos y stats TCG
 */
export function VideoCardFooter({
	video,
	primaryColor,
	secondaryColor,
	cardId,
	rarityLevel,
	tcgMode = true,
	compact = false,
}: VideoCardFooterProps) {
	const { isFavorite } = video;
	const {
		albumCount: albumsCount,
		collectionCount: collectionsCount,
		tagCount: tagsCount,
		technicalGrade,
	} = video.stats;

	// Efecto de brillo para rareza alta
	const glow = rarityLevel >= 7 ? 4 : rarityLevel >= 5 ? 2 : 0;

	return (
		<div className={cn('mt-auto border-t', compact ? 'p-2' : 'p-3')} style={{ borderColor: `${primaryColor}30` }}>
			{/* Fondo decorativo */}
			{tcgMode && (
				<div
					className="absolute inset-0 opacity-10"
					style={{
						background: `linear-gradient(0deg, ${secondaryColor}40, transparent 50%)`,
					}}
				/>
			)}

			<div className="relative z-10 flex items-center justify-between">
				{/* Lado izquierdo: Contadores */}
				<div className="flex items-center gap-2">
					{/* Contador de álbumes */}
					{albumsCount > 0 && (
						<div
							className={cn('flex items-center gap-1 rounded px-2 py-1 text-xs', tcgMode && 'border')}
							style={{
								backgroundColor: tcgMode ? `${primaryColor}15` : 'rgba(0,0,0,0.1)',
								borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
								boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}60` : 'none',
							}}
						>
							<Image className="h-3 w-3" />
							<span className="font-medium">{albumsCount}</span>
						</div>
					)}

					{/* Contador de tags */}
					{tagsCount > 0 && (
						<div
							className={cn('flex items-center gap-1 rounded px-2 py-1 text-xs', tcgMode && 'border')}
							style={{
								backgroundColor: tcgMode ? `${primaryColor}15` : 'rgba(0,0,0,0.1)',
								borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
								boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}60` : 'none',
							}}
						>
							<Tag className="h-3 w-3" />
							<span className="font-medium">{tagsCount}</span>
						</div>
					)}

					{/* Contador de colecciones */}
					{collectionsCount > 0 && (
						<div
							className={cn('flex items-center gap-1 rounded px-2 py-1 text-xs', tcgMode && 'border')}
							style={{
								backgroundColor: tcgMode ? `${primaryColor}15` : 'rgba(0,0,0,0.1)',
								borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
								boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}60` : 'none',
							}}
						>
							<Users className="h-3 w-3" />
							<span className="font-medium">{collectionsCount}</span>
						</div>
					)}
				</div>

				{/* Lado derecho: Stats TCG */}
				<div className="flex items-center gap-2">
					{/* Indicador de favorito */}
					{isFavorite && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}

					{/* ID de carta TCG */}
					{tcgMode && !compact && (
						<div
							className="rounded border px-2 py-1 font-mono text-xs"
							style={{
								backgroundColor: `${primaryColor}10`,
								borderColor: `${primaryColor}30`,
								color: primaryColor,
							}}
						>
							{cardId}
						</div>
					)}

					{/* Grade técnico */}
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
				</div>
			</div>

			{/* Barra de rareza para TCG */}
			{tcgMode && rarityLevel >= 5 && (
				<div className="mt-2 flex justify-center">
					<div className="flex gap-1">
						{Array.from({ length: 5 }, (_, i) => (
							<div
								className={cn('h-1 w-1 rounded-full', i < Math.floor(rarityLevel / 2) ? 'opacity-100' : 'opacity-30')}
								key={i}
								style={{ backgroundColor: primaryColor }}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
