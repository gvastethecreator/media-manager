import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { HeartIcon, ImageIcon, Star, VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceCardFooterProps {
	createdAt?: Date;
	imagesCount?: number;
	videosCount?: number;
	primaryColor?: string;
	secondaryColor?: string;
	power?: number;
	healthPoints?: number;
	cardId?: string;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * Componente para mostrar el pie de una tarjeta de lugar con estilo TCG
 * Muestra contadores, fecha de creación y valores TCG como poder y salud
 */
export function PlaceCardFooter({
	createdAt,
	imagesCount = 0,
	videosCount = 0,
	primaryColor = '#10b981',
	power = 1,
	healthPoints = 100,
	cardId = '',
	tcgMode = true,
	compact = false,
}: PlaceCardFooterProps) {
	// Determinar estrellas de poder a mostrar (escala 1-5)
	const _powerStars = Math.max(1, Math.min(5, Math.ceil(power / 2)));

	// Formatear fecha de creación
	const formattedDate = createdAt ? format(createdAt, 'MMM yyyy', { locale: es }) : '';

	return (
		<div
			className={cn('px-3 py-2', tcgMode ? 'border-white/10 border-t' : '')}
			style={{
				background: tcgMode ? `linear-gradient(to top, ${primaryColor}20, transparent)` : undefined,
			}}
		>
			{tcgMode ? (
				<div className="flex flex-col space-y-1.5">
					{/* Primera fila: HP y fecha */}
					<div className="flex items-center justify-between">
						{/* HP */}
						<div className="flex items-center">
							<HeartIcon className="mr-1 h-3.5 w-3.5" style={{ color: primaryColor }} />
							<span className="font-semibold text-xs">{healthPoints}</span>
						</div>

						{/* Fecha de creación */}
						{createdAt && !compact && <div className="text-xs opacity-70">{formattedDate}</div>}
					</div>

					{/* Segunda fila: contadores de medios */}
					{(imagesCount > 0 || videosCount > 0) && !compact && (
						<div className="flex items-center gap-2">
							{imagesCount > 0 && (
								<div className="flex items-center text-xs">
									<ImageIcon className="mr-1 h-3 w-3 opacity-70" />
									<span>{imagesCount}</span>
								</div>
							)}
							{videosCount > 0 && (
								<div className="flex items-center text-xs">
									<VideoIcon className="mr-1 h-3 w-3 opacity-70" />
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
								{power >= 1 && <Star className="h-3 w-3 fill-current" style={{ color: primaryColor }} />}
								{power >= 3 && <Star className="h-3 w-3 fill-current" style={{ color: primaryColor }} />}
								{power >= 5 && <Star className="h-3 w-3 fill-current" style={{ color: primaryColor }} />}
								{power >= 7 && <Star className="h-3 w-3 fill-current" style={{ color: primaryColor }} />}
								{power >= 9 && <Star className="h-3 w-3 fill-current" style={{ color: primaryColor }} />}
							</div>
						</div>

						{/* ID de carta */}
						<div className="font-mono text-[10px] opacity-60">{cardId}</div>
					</div>
				</div>
			) : (
				// Versión no-TCG simplificada
				<div className="flex items-center justify-between">
					<div className="flex items-center text-muted-foreground text-xs">
						{createdAt && <span>{formattedDate}</span>}
					</div>

					<div className="flex items-center space-x-2 text-muted-foreground text-xs">
						{imagesCount > 0 && (
							<div className="flex items-center">
								<ImageIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
								<span>{imagesCount}</span>
							</div>
						)}
						{videosCount > 0 && (
							<div className="flex items-center">
								<VideoIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
								<span>{videosCount}</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
