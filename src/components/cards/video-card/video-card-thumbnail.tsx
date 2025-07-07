import { Play, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { VideoWithStats } from '@/types/entities/video';

interface VideoCardThumbnailProps {
	video: VideoWithStats;
	primaryColor: string;
	rarityLevel: number;
	isHovered: boolean;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * 🎬 Thumbnail del VideoCard con efectos holográficos
 */
export function VideoCardThumbnail({
	video,
	primaryColor,
	rarityLevel,
	isHovered,
	tcgMode = true,
	compact = false,
}: VideoCardThumbnailProps) {
	const { thumbnailUrl, resolution, hasAudio, formattedSize } = video.stats;

	// Placeholder si no hay thumbnail
	const placeholderGradient = `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}80)`;

	return (
		<div className={cn('relative overflow-hidden bg-black/10', compact ? 'h-20' : 'h-32')}>
			{/* Fondo decorativo para TCG */}
			{tcgMode && <div className="absolute inset-0 opacity-30" style={{ background: placeholderGradient }} />}

			{/* Thumbnail o placeholder */}
			{thumbnailUrl ? (
				<img src={thumbnailUrl} alt={`Thumbnail de ${video.name}`} className="object-cover w-full h-full" />
			) : (
				<div className="w-full h-full flex items-center justify-center" style={{ background: placeholderGradient }}>
					<Play className="w-8 h-8 text-white/80" />
				</div>
			)}

			{/* Overlay con información técnica */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
				{/* Información técnica en la esquina inferior */}
				<div className="absolute bottom-1 left-1 flex flex-col gap-1">
					{/* Resolución */}
					<div className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">{resolution}</div>

					{/* Tamaño del archivo */}
					{!compact && <div className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">{formattedSize}</div>}
				</div>

				{/* Indicadores en la esquina superior derecha */}
				<div className="absolute top-1 right-1 flex gap-1">
					{/* Indicador de audio */}
					{hasAudio ? <Volume2 className="w-4 h-4 text-white/80" /> : <VolumeX className="w-4 h-4 text-white/60" />}
				</div>

				{/* Botón de play centrado */}
				<div className="absolute inset-0 flex items-center justify-center">
					<motion.div
						className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm"
						initial={{ scale: 0.8, opacity: 0.6 }}
						animate={{
							scale: isHovered ? 1.1 : 0.8,
							opacity: isHovered ? 1 : 0.6,
						}}
						transition={{ duration: 0.2 }}
					>
						<Play className="w-6 h-6 text-white ml-0.5" />
					</motion.div>
				</div>
			</div>

			{/* Efectos holográficos para rareza alta */}
			{tcgMode && rarityLevel >= 7 && isHovered && (
				<motion.div
					className="absolute inset-0 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.3 }}
					exit={{ opacity: 0 }}
				>
					<div
						className="absolute inset-0"
						style={{
							background: `linear-gradient(45deg, transparent, ${primaryColor}60, transparent)`,
							animation: 'shimmer 2s infinite',
						}}
					/>
				</motion.div>
			)}

			{/* Marco decorativo para rareza mítica */}
			{tcgMode && rarityLevel >= 9 && (
				<div
					className="absolute inset-0 border-2 border-dashed opacity-40 pointer-events-none animate-pulse"
					style={{ borderColor: primaryColor }}
				/>
			)}
		</div>
	);
}
