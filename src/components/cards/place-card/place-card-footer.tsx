import { HeartIcon, ImageIcon, Star, VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';

interface PlaceCardFooterProps {
	cardId?: string;
	compact?: boolean;
	createdAt?: Date;
	healthPoints?: number;
	imagesCount?: number;
	power?: number;
	primaryColor?: string;
	secondaryColor?: string;
	tcgMode?: boolean;
	videosCount?: number;
}

/**
 * Componente para mostrar el pie de una tarjeta de lugar con estilo TCG
 * Muestra contadores, fecha de creación y valores TCG como poder y salud
 */
export function PlaceCardFooter({
	createdAt,
	imagesCount = 0,
	videosCount = 0,
	primaryColor = 'var(--dt-success-500)',
	power = 1,
	healthPoints = 100,
	cardId = '',
	tcgMode = true,
	compact = false,
}: PlaceCardFooterProps) {
	// Determinar estrellas de poder a mostrar (escala 1-5)
	const _powerStars = Math.max(1, Math.min(5, Math.ceil(power / 2)));

	// Formatear fecha de creación
	const formattedDate = createdAt ? formatDate(createdAt, 'MMM yyyy') : '';

	return (
		<div
			className={cn('px-3 py-2', tcgMode ? 'border-border/40 border-t' : '')}
			style={{
				background: tcgMode
					? `linear-gradient(to top, color-mix(in oklab, ${primaryColor}, transparent 80%), transparent)`
					: undefined,
			}}
		>
			{tcgMode ? (
				<div className="flex flex-col space-y-1.5">
					{/* Primera fila: HP y fecha */}
					<div className="flex items-center justify-between">
						{/* HP */}
						<div className="flex items-center">
							<HeartIcon className="mr-1 h-4 w-4" style={{ color: primaryColor }} />
							<span className="font-semibold text-sm">{healthPoints}</span>
						</div>

						{/* Fecha de creación */}
						{createdAt && !compact && <div className="text-sm opacity-70">{formattedDate}</div>}
					</div>

					{/* Segunda fila: contadores de medios */}
					{(imagesCount > 0 || videosCount > 0) && !compact && (
						<div className="flex items-center gap-2">
							{imagesCount > 0 && (
								<div className="flex items-center text-sm">
									<ImageIcon className="mr-1 h-4 w-4 opacity-70" />
									<span>{imagesCount}</span>
								</div>
							)}
							{videosCount > 0 && (
								<div className="flex items-center text-sm">
									<VideoIcon className="mr-1 h-4 w-4 opacity-70" />
									<span>{videosCount}</span>
								</div>
							)}
						</div>
					)}

					{/* Tercera fila: estrellas de poder e ID de carta */}
					<div className="flex items-center justify-between">
						{/* Estrellas de poder */}
						<div className="flex items-center">
							{/* Renderizar estrellas sin usar índices como keys */}
							<div className="flex">
								{power >= 1 && <Star className="h-4 w-4 fill-current" style={{ color: primaryColor }} />}
								{power >= 3 && <Star className="h-4 w-4 fill-current" style={{ color: primaryColor }} />}
								{power >= 5 && <Star className="h-4 w-4 fill-current" style={{ color: primaryColor }} />}
								{power >= 7 && <Star className="h-4 w-4 fill-current" style={{ color: primaryColor }} />}
								{power >= 9 && <Star className="h-4 w-4 fill-current" style={{ color: primaryColor }} />}
							</div>
						</div>

						{/* ID de carta */}
						<div className="font-mono text-xs opacity-60">{cardId}</div>
					</div>
				</div>
			) : (
				// Versión no-TCG simplificada
				<div className="flex items-center justify-between">
					<div className="flex items-center text-muted-foreground text-sm">
						{createdAt && <span>{formattedDate}</span>}
					</div>

					<div className="flex items-center space-x-2 text-muted-foreground text-sm">
						{imagesCount > 0 && (
							<div className="flex items-center">
								<ImageIcon className="mr-1 h-4 w-4 opacity-70" />
								<span>{imagesCount}</span>
							</div>
						)}
						{videosCount > 0 && (
							<div className="flex items-center">
								<VideoIcon className="mr-1 h-4 w-4 opacity-70" />
								<span>{videosCount}</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
