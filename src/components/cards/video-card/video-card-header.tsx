'use client';

import { cn } from '@/lib/utils';
import type { VideoWithStats } from '@/types/entities/video';
import { Clock, Star } from 'lucide-react';

interface VideoCardHeaderProps {
	video: VideoWithStats;
	primaryColor: string;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * 🎬 Header del VideoCard con nombre, duración y indicadores
 */
export function VideoCardHeader({
	video,
	primaryColor,
	tcgMode = true,
	compact = false,
}: VideoCardHeaderProps) {
	const { name, statistics, isFavorite } = video;
	const { formattedDuration, qualityLabel, technicalGrade } = statistics;

	return (
		<div
			className={cn(
				'border-b relative z-10',
				compact ? 'p-2' : 'p-3'
			)}
			style={{ borderColor: `${primaryColor}30` }}
		>
			{/* Fondo decorativo TCG */}
			{tcgMode && (
				<div
					className="absolute inset-0 opacity-20"
					style={{
						background: `linear-gradient(135deg, ${primaryColor}40, transparent 70%)`
					}}
				/>
			)}

			<div className="relative z-10 flex items-start justify-between gap-2">
				{/* Lado izquierdo: Nombre y duración */}
				<div className="flex-1 min-w-0">
					<h3 className={cn(
						'font-bold text-foreground truncate',
						compact ? 'text-sm' : 'text-base'
					)}>
						{name || 'Video sin título'}
					</h3>

					{/* Duración y calidad */}
					<div className="flex items-center gap-2 mt-1">
						<div className="flex items-center gap-1 text-muted-foreground">
							<Clock className="w-3 h-3" />
							<span className="text-xs">{formattedDuration}</span>
						</div>

						{!compact && (
							<div
								className="text-xs px-1.5 py-0.5 rounded font-medium"
								style={{
									backgroundColor: `${primaryColor}20`,
									color: primaryColor
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
					{isFavorite && (
						<Star
							className="w-4 h-4 fill-yellow-400 text-yellow-400"
						/>
					)}

					{/* Badge de calidad para TCG */}
					{tcgMode && !compact && (
						<div
							className="text-xs px-2 py-1 rounded-full font-bold border"
							style={{
								backgroundColor: `${primaryColor}10`,
								borderColor: `${primaryColor}40`,
								color: primaryColor
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