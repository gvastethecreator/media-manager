import { BarChart4, Calendar, Heart, Image, LinkIcon, ListChecks, RefreshCw, Star, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/utils/date';

interface NoteCardFooterProps {
	createdAt: Date | string;
	imagesCount: number;
	isFavorite?: boolean;
	primaryColor: string;
	priority?: number | null;
	relationsCount: number;
	secondaryColor: string;
	status?: string | null;
	tcgMode?: boolean;
	updatedAt: Date | string;
	videosCount: number;
}

/**
 * Componente para el pie de una tarjeta de nota.
 * Similar al cuadro de texto inferior de una carta TCG.
 */
export function NoteCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	videosCount,
	relationsCount,
	isFavorite = false,
	status,
	priority = 0,
	primaryColor,
	secondaryColor,
	tcgMode = true,
}: NoteCardFooterProps) {
	// Convertir fecha a objeto Date si es string
	const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
	const updatedAtDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;

	// Formatear fecha relativa
	const formattedDate = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
	});

	// Formatear fecha actualizada si es diferente a la creación
	const wasUpdated = updatedAtDate.getTime() - createdAtDate.getTime() > 60_000; // 1 minuto de diferencia
	const updatedFormattedDate = wasUpdated
		? formatDistanceToNow(updatedAtDate, {
				addSuffix: true,
			})
		: null;

	// Obtener color de prioridad
	const getPriorityColor = () => {
		switch (priority) {
			case 0:
				return 'var(--dt-neutral-600)'; // Gris para normal
			case 1:
				return 'var(--dt-warning-400)'; // Amarillo para alta
			case 2:
				return 'var(--dt-danger-500)'; // Rojo para urgente
			default:
				return 'var(--dt-neutral-400)'; // Gris claro para baja
		}
	};

	// Estilos para modo TCG o normal
	const getFooterStyles = () => {
		if (tcgMode) {
			return {
				background: `linear-gradient(to bottom, color-mix(in oklab, ${primaryColor}, transparent 75%), color-mix(in oklab, ${secondaryColor}, transparent 55%))`,
				borderTop: `1px solid color-mix(in oklab, ${primaryColor}, transparent 50%)`,
				borderImage: `linear-gradient(to right, transparent, color-mix(in oklab, ${primaryColor}, transparent 40%), transparent) 1`,
			};
		}

		return {
			background: `linear-gradient(to bottom, color-mix(in oklab, ${primaryColor}, transparent 90%), color-mix(in oklab, ${secondaryColor}, transparent 70%))`,
			borderTop: `1px solid color-mix(in oklab, ${primaryColor}, transparent 70%)`,
		};
	};

	return (
		<div
			className={cn(
				'mt-auto flex flex-col gap-1 border-muted-foreground/30/30 border-t px-3 py-2',
				tcgMode && 'rounded-b-[4.75%] backdrop-blur-sm'
			)}
			style={getFooterStyles()}
		>
			{/* Fila superior con estado y prioridad */}
			{(status || priority !== undefined) && (
				<div className="flex items-center justify-between text-sm">
					{status && (
						<div className="flex items-center gap-1">
							<ListChecks className="h-4 w-4" style={{ color: primaryColor }} />
							<span className={cn('opacity-80', tcgMode && 'font-medium tracking-wide')}>
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</span>
						</div>
					)}
					{priority !== undefined && (
						<div className="flex items-center gap-1">
							<BarChart4 className="h-4 w-4" style={{ color: getPriorityColor() }} />
							<span className={cn('opacity-80', tcgMode && 'font-medium')} style={{ color: getPriorityColor() }}>
								P{priority}
							</span>
						</div>
					)}
				</div>
			)}

			{/* Fila de contadores con iconos */}
			<div className="flex items-center justify-between text-sm">
				<div className="flex items-center gap-3">
					{/* Contador de imágenes */}
					<div className="flex items-center gap-1">
						<Image className="h-4 w-4 text-muted-foreground" />
						<span className="opacity-80">{imagesCount}</span>
					</div>

					{/* Contador de videos */}
					{(videosCount > 0 || tcgMode) && (
						<div className="flex items-center gap-1">
							<Video className="h-4 w-4 text-muted-foreground" />
							<span className="opacity-80">{videosCount}</span>
						</div>
					)}

					{/* Contador de relaciones */}
					<div className="flex items-center gap-1">
						<LinkIcon className="h-4 w-4 text-muted-foreground" />
						<span className="opacity-80">{relationsCount}</span>
					</div>

					{/* Indicador de favorito */}
					{isFavorite &&
						(tcgMode ? (
							<Star className="h-4 w-4 fill-current text-warning" />
						) : (
							<Heart className="h-4 w-4 fill-current text-pink-500" />
						))}
				</div>

				{/* Fecha */}
				<div className="flex items-center gap-1">
					{wasUpdated ? (
						<RefreshCw className="h-4 w-4 text-muted-foreground" />
					) : (
						<Calendar className="h-4 w-4 text-muted-foreground" />
					)}
					<span className={cn('text-[0.65rem] opacity-80', tcgMode && 'tracking-tight')}>
						{wasUpdated ? updatedFormattedDate : formattedDate}
					</span>
				</div>
			</div>

			{/* Fecha de actualización (solo en modo no-TCG) */}
			{wasUpdated && updatedFormattedDate && !tcgMode && (
				<div className="mt-0.5 flex items-center justify-end text-[0.65rem] opacity-60">
					<span>Actualizado {updatedFormattedDate}</span>
				</div>
			)}

			{/* Sello TCG en la parte inferior */}
			{tcgMode && (
				<div className="mt-1 flex justify-center border-border/40 border-t pt-1">
					<div
						className="font-medium text-[0.65rem] uppercase tracking-wide opacity-60"
						style={{ color: primaryColor }}
					>
						Image Manager • Note
					</div>
				</div>
			)}
		</div>
	);
}
