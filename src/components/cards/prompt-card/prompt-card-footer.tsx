import { formatDate } from '@/lib/utils/date';
import { Calendar, Image, Tag, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptCardFooterProps {
	createdAt: Date;
	updatedAt: Date;
	imagesCount: number;
	videosCount: number;
	tagsCount: number;
	primaryColor: string;
	secondaryColor?: string;
	tcgMode?: boolean;
}

/**
 * Pie de carta para Prompt, con información de fechas y contadores
 */
export function PromptCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	videosCount,
	tagsCount,
	primaryColor,
	tcgMode = true,
}: PromptCardFooterProps) {
	const formattedDate = formatDate(new Date(updatedAt), 'dd/MM/yyyy');
	const daysSinceUpdate = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));

	const isRecent = daysSinceUpdate < 7;

	// Color estilizado para el footer
	const borderColor = `${primaryColor}40`;
	const bgColor = tcgMode ? `linear-gradient(to top, ${primaryColor}20, transparent)` : undefined;

	return (
		<div
			className={cn(
				'mt-auto flex items-center justify-between px-3 py-2 text-muted-foreground text-xs',
				tcgMode && 'rounded-b-lg'
			)}
			style={{
				borderTop: `1px solid ${borderColor}`,
				background: bgColor,
			}}
		>
			{/* Fecha de actualización */}
			<div className="flex items-center gap-1">
				<Calendar className="h-3.5 w-3.5" />
				<span>{formattedDate}</span>
				{isRecent && (
					<span
						className="rounded-full px-1 text-[0.65rem]"
						style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
					>
						{daysSinceUpdate === 0 ? 'Hoy' : `${daysSinceUpdate}d`}
					</span>
				)}
			</div>

			{/* Contadores de contenido */}
			<div className="flex items-center gap-2">
				{/* Contador de imágenes */}
				<div className="flex items-center gap-1">
					<Image className="h-3.5 w-3.5" />
					<span>{imagesCount}</span>
				</div>

				{/* Contador de vídeos */}
				{videosCount > 0 && (
					<div className="flex items-center gap-1">
						<Video className="h-3.5 w-3.5" />
						<span>{videosCount}</span>
					</div>
				)}

				{/* Contador de etiquetas */}
				{tagsCount > 0 && (
					<div className="flex items-center gap-1">
						<Tag className="h-3.5 w-3.5" />
						<span>{tagsCount}</span>
					</div>
				)}
			</div>

			{/* Sello TCG en la esquina inferior */}
			{tcgMode && (
				<div className="absolute right-1 bottom-1 font-mono text-[0.6rem] opacity-60" style={{ color: primaryColor }}>
					P{String(createdAt.getTime()).slice(-4)}
				</div>
			)}
		</div>
	);
}
