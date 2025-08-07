import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoWithStats } from '@/types/entities/video';

interface VideoCardHeaderProps {
	video: VideoWithStats;
	primaryColor: string;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * 🎬 Header del VideoCard con nombre, duración y indicadores
 */
export function VideoCardHeader({ video, primaryColor, tcgMode = true, compact = false }: VideoCardHeaderProps) {
	const { name, isFavorite } = video;
	const { formattedDuration, technicalGrade } = video.stats;
	const qualityLabel = video.stats.qualityLevel;

	return (
		<div className={cn('relative z-10 border-b', compact ? 'p-2' : 'p-3')} style={{ borderColor: `${primaryColor}30` }}>
			{/* Fondo decorativo TCG */}
			{tcgMode && (
				<div
					className="absolute inset-0 opacity-20"
					style={{
						background: `linear-gradient(135deg, ${primaryColor}40, transparent 70%)`,
					}}
				/>
			)}

			<div className="relative z-10 flex items-start justify-between gap-2">
				{/* Lado izquierdo: Nombre y duración */}
				<div className="min-w-0 flex-1">
					<h3 className={cn('truncate font-bold text-foreground', compact ? 'text-sm' : 'text-base')}>
						{name || 'Video sin título'}
					</h3>

					{/* Duración y calidad */}
					<div className="mt-1 flex items-center gap-2">
						<div className="flex items-center gap-1 text-muted-foreground">
							<Clock className="h-3 w-3" />
							<span className="text-xs">{formattedDuration}</span>
						</div>

						{!compact && (
							<div
								className="rounded px-1.5 py-0.5 font-medium text-xs"
								style={{
									backgroundColor: `${primaryColor}20`,
									color: primaryColor,
								}}
							>
								{technicalGrade}
							</div>
						)}
					</div>
				</div>

				{/* Lado derecho: Indicadores */}
				<div className="flex items-center gap-1">
					{/* Indicador de favorito */}
					{isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}

					{/* Badge de calidad para TCG */}
					{tcgMode && !compact && (
						<div
							className="rounded-full border px-2 py-1 font-bold text-xs"
							style={{
								backgroundColor: `${primaryColor}10`,
								borderColor: `${primaryColor}40`,
								color: primaryColor,
							}}
						>
							{qualityLabel.split(' ')[0]} {/* Solo la primera parte */}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
