import { formatDistanceToNow } from '@/lib/utils/date';
import { BarChart4, Calendar, Heart, Image, LinkIcon, ListChecks, RefreshCw, Star, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount: number;
	videosCount: number;
	relationsCount: number;
	isFavorite?: boolean;
	status?: string | null;
	priority?: number | null;
	primaryColor: string;
	secondaryColor: string;
	tcgMode?: boolean;
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
				return '#4b5563'; // Gris para normal
			case 1:
				return '#fbbf24'; // Amarillo para alta
			case 2:
				return '#ef4444'; // Rojo para urgente
			default:
				return '#9ca3af'; // Gris claro para baja
		}
	};

	// Estilos para modo TCG o normal
	const getFooterStyles = () => {
		if (tcgMode) {
			return {
				background: `linear-gradient(to bottom, ${primaryColor}25, ${secondaryColor}45)`,
				borderTop: `1px solid ${primaryColor}50`,
				borderImage: `linear-gradient(to right, transparent, ${primaryColor}60, transparent) 1`,
			};
		}

		return {
			background: `linear-gradient(to bottom, ${primaryColor}10, ${secondaryColor}30)`,
			borderTop: `1px solid ${primaryColor}30`,
		};
	};

	return (
		<div
			className={cn(
				'mt-auto flex flex-col gap-1 border-gray-400/30 border-t px-3 py-2',
				tcgMode && 'rounded-b-[4.75%] backdrop-blur-sm'
			)}
			style={getFooterStyles()}
		>
			{/* Fila superior con estado y prioridad */}
			{(status || priority !== undefined) && (
				<div className="flex items-center justify-between text-xs">
					{status && (
						<div className="flex items-center gap-1">
							<ListChecks className="h-3 w-3" style={{ color: primaryColor }} />
							<span className={cn('opacity-80', tcgMode && 'font-medium tracking-wide')}>
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</span>
						</div>
					)}
					{priority !== undefined && (
						<div className="flex items-center gap-1">
							<BarChart4 className="h-3 w-3" style={{ color: getPriorityColor() }} />
							<span className={cn('opacity-80', tcgMode && 'font-medium')} style={{ color: getPriorityColor() }}>
								P{priority}
							</span>
						</div>
					)}
				</div>
			)}

			{/* Fila de contadores con iconos */}
			<div className="flex items-center justify-between text-xs">
				<div className="flex items-center gap-3">
					{/* Contador de imágenes */}
					<div className="flex items-center gap-1">
						<Image className="h-3 w-3 text-muted-foreground" />
						<span className="opacity-80">{imagesCount}</span>
					</div>

					{/* Contador de videos */}
					{(videosCount > 0 || tcgMode) && (
						<div className="flex items-center gap-1">
							<Video className="h-3 w-3 text-muted-foreground" />
							<span className="opacity-80">{videosCount}</span>
						</div>
					)}

					{/* Contador de relaciones */}
					<div className="flex items-center gap-1">
						<LinkIcon className="h-3 w-3 text-muted-foreground" />
						<span className="opacity-80">{relationsCount}</span>
					</div>

					{/* Indicador de favorito */}
					{isFavorite &&
						(tcgMode ? (
							<Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
						) : (
							<Heart className="h-3 w-3 fill-current text-pink-500" />
						))}
				</div>

				{/* Fecha */}
				<div className="flex items-center gap-1">
					{wasUpdated ? (
						<RefreshCw className="h-3 w-3 text-muted-foreground" />
					) : (
						<Calendar className="h-3 w-3 text-muted-foreground" />
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
				<div className="mt-1 flex justify-center border-white/10 border-t pt-1">
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
