import { Calendar, Image, Tag, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';

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
	// Manejar fechas que pueden venir como string o Date
	const createdAtDate = createdAt ? (typeof createdAt === 'string' ? new Date(createdAt) : createdAt) : new Date();
	const updatedAtDate = updatedAt ? (typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt) : new Date();

	const formattedDate = formatDate(updatedAtDate, 'dd/MM/yyyy');
	const daysSinceUpdate = Math.floor((Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24));

	const isRecent = daysSinceUpdate < 7;

	// Color estilizado para el footer
	const borderColor = `color-mix(in oklab, ${primaryColor}, transparent 60%)`;
	const bgColor = tcgMode
		? `linear-gradient(to top, color-mix(in oklab, ${primaryColor}, transparent 80%), transparent)`
		: undefined;

	return (
		<div
			className={cn(
				'mt-auto flex items-center justify-between px-4 py-3 text-muted-foreground text-sm',
				tcgMode && 'rounded-b-lg'
			)}
			style={{
				borderTop: `1px solid ${borderColor}`,
				background: bgColor,
			}}
		>
			{/* Fecha de actualización */}
			<div className="flex items-center gap-1">
				<Calendar className="h-4 w-4" />
				<span>{formattedDate}</span>
				{isRecent && (
					<span
						className="rounded-full px-1 text-[0.65rem]"
						style={{ backgroundColor: `color-mix(in oklab, ${primaryColor}, transparent 80%)`, color: primaryColor }}
					>
						{daysSinceUpdate === 0 ? 'Hoy' : `${daysSinceUpdate}d`}
					</span>
				)}
			</div>

			{/* Contadores de contenido */}
			<div className="flex items-center gap-2">
				{/* Contador de imágenes */}
				<div className="flex items-center gap-1">
					<Image className="h-4 w-4" />
					<span>{imagesCount}</span>
				</div>

				{/* Contador de vídeos */}
				{videosCount > 0 && (
					<div className="flex items-center gap-1">
						<Video className="h-4 w-4" />
						<span>{videosCount}</span>
					</div>
				)}

				{/* Contador de etiquetas */}
				{tagsCount > 0 && (
					<div className="flex items-center gap-1">
						<Tag className="h-4 w-4" />
						<span>{tagsCount}</span>
					</div>
				)}
			</div>

			{/* Sello TCG en la esquina inferior */}
			{tcgMode && (
				<div className="absolute right-1 bottom-1 font-mono text-[0.6rem] opacity-60" style={{ color: primaryColor }}>
					P{String(createdAtDate.getTime()).slice(-4)}
				</div>
			)}
		</div>
	);
}
