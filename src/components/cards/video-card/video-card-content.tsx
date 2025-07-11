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
	const { qualityScore, technicalGrade, autoTags, aspectRatio, bitrate, frameRate, hasSubtitles } = video;

	return (
		<div className="flex-1 p-3 space-y-3">
			{/* Descripción si existe */}
			{description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}

			{/* Estadísticas técnicas */}
			<div className="space-y-2">
				{/* Quality Score */}
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">Calidad</span>
					<div className="flex items-center gap-2">
						<div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full transition-all duration-300"
								style={{
									width: `${qualityScore}%`,
									backgroundColor: primaryColor,
								}}
							/>
						</div>
						<span className="text-sm font-bold" style={{ color: primaryColor }}>
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
					<span className="text-xs font-medium text-muted-foreground">Tags automáticos:</span>
					<div className="flex flex-wrap gap-1">
						{autoTags.slice(0, 4).map((tag: TagWithStats) => (
							<Badge
								key={tag.id}
								variant="secondary"
								className="text-xs px-1.5 py-0.5"
								style={{
									backgroundColor: `${primaryColor}15`,
									color: primaryColor,
									borderColor: `${primaryColor}30`,
								}}
							>
								{tag.name}
							</Badge>
						))}
						{autoTags.length > 4 && (
							<Badge variant="outline" className="text-xs px-1.5 py-0.5">
								+{autoTags.length - 4}
							</Badge>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
