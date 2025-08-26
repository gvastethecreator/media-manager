import { Badge } from '@/components/ui/badge';

import type { TagWithStats } from '@/types/entities/tag';
import type { VideoWithStats } from '@/types/entities/video';

interface VideoCardContentProps {
	video: VideoWithStats;
	primaryColor: string;
	secondaryColor: string;
	tcgMode?: boolean;
}

/**
 * 🎬 Contenido principal del VideoCard con estadísticas y metadatos
 */
export function VideoCardContent({ video, primaryColor, tcgMode = true }: VideoCardContentProps) {
	const { description } = video;
	const qualityScore = video.stats?.qualityScore ?? 0;
	const technicalGrade = video.stats?.technicalGrade ?? 'D';
	const aspectRatio = video.stats?.aspectRatio ?? 'unknown';
	const bitrate = video.stats?.bitrate ?? null;
	const frameRate = video.stats?.frameRate ?? null;
	const hasSubtitles = video.stats?.hasSubtitles ?? false;
	// autoTags no está definido en VideoStatistics, usar un array vacío por ahora
	const autoTags: TagWithStats[] = [];

	return (
		<div className="flex-1 space-y-3 p-3">
			{/* Descripción si existe */}
			{description && <p className="line-clamp-2 text-muted-foreground text-sm">{description}</p>}

			{/* Estadísticas técnicas */}
			<div className="space-y-2">
				{/* Quality Score */}
				<div className="flex items-center justify-between">
					<span className="font-medium text-sm">Calidad</span>
					<div className="flex items-center gap-2">
						<div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
							<div
								className="h-full transition-all duration-300"
								style={{
									width: `${qualityScore}%`,
									backgroundColor: primaryColor,
								}}
							/>
						</div>
						<span className="font-bold text-sm" style={{ color: primaryColor }}>
							{qualityScore}
						</span>
					</div>
				</div>

				{/* Aspectos técnicos */}
				{tcgMode && (
					<div className="grid grid-cols-2 gap-2 text-xs">
						{aspectRatio !== 'unknown' && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Aspecto:</span>
								<span className="font-medium">{aspectRatio}</span>
							</div>
						)}

						{bitrate && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Bitrate:</span>
								<span className="font-medium">{Math.round(bitrate / 1000)}k</span>
							</div>
						)}

						{frameRate && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">FPS:</span>
								<span className="font-medium">{frameRate}</span>
							</div>
						)}

						{hasSubtitles && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Subtítulos:</span>
								<span className="font-medium text-green-600">Sí</span>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Auto-tags */}
			{autoTags.length > 0 && (
				<div className="space-y-1">
					<span className="font-medium text-muted-foreground text-xs">Tags automáticos:</span>
					<div className="flex flex-wrap gap-1">
						{autoTags.slice(0, 4).map((tag: TagWithStats) => (
							<Badge
								className="px-1.5 py-0.5 text-xs"
								key={tag.id}
								style={{
									backgroundColor: `${primaryColor}15`,
									color: primaryColor,
									borderColor: `${primaryColor}30`,
								}}
								variant="secondary"
							>
								{tag.name}
							</Badge>
						))}
						{autoTags.length > 4 && (
							<Badge className="px-1.5 py-0.5 text-xs" variant="outline">
								+{autoTags.length - 4}
							</Badge>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
