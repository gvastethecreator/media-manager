import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart4, Calendar, Heart, Image, Link, ListChecks } from 'lucide-react';

interface NoteCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount: number;
	relationsCount: number;
	isFavorite?: boolean;
	status?: string | null;
	priority?: number | null;
	primaryColor: string;
	secondaryColor: string;
}

/**
 * Componente para el pie de una tarjeta de nota.
 * Similar al cuadro de texto inferior de una carta Magic.
 */
export function NoteCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	relationsCount,
	isFavorite = false,
	status,
	priority = 0,
	primaryColor,
	secondaryColor,
}: NoteCardFooterProps) {
	// Convertir fecha a objeto Date si es string
	const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
	const updatedAtDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;

	// Formatear fecha relativa
	const formattedDate = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
		locale: es,
	});

	// Formatear fecha actualizada si es diferente a la creación
	const wasUpdated = updatedAtDate.getTime() - createdAtDate.getTime() > 60000; // 1 minuto de diferencia
	const updatedFormattedDate = wasUpdated
		? formatDistanceToNow(updatedAtDate, {
			addSuffix: true,
			locale: es,
		})
		: null;

	// Obtener color de prioridad
	const getPriorityColor = () => {
		switch (priority) {
			case 0:
				return "#4b5563"; // Gris para normal
			case 1:
				return "#fbbf24"; // Amarillo para alta
			case 2:
				return "#ef4444"; // Rojo para urgente
			default:
				return "#9ca3af"; // Gris claro para baja
		}
	};

	return (
		<div
			className="px-3 py-2 mt-auto border-t border-gray-400/30 flex flex-col gap-1"
			style={{
				background: `linear-gradient(to bottom, ${primaryColor}10, ${secondaryColor}30)`,
				borderTop: `1px solid ${primaryColor}30`,
			}}
		>
			{/* Fila superior con estado y prioridad */}
			{(status || priority !== undefined) && (
				<div className="flex justify-between items-center text-xs">
					{status && (
						<div className="flex items-center gap-1">
							<ListChecks className="h-3 w-3" style={{ color: primaryColor }} />
							<span className="opacity-80">
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</span>
						</div>
					)}
					{priority !== undefined && (
						<div className="flex items-center gap-1">
							<BarChart4
								className="h-3 w-3"
								style={{ color: getPriorityColor() }}
							/>
							<span
								className="opacity-80"
								style={{ color: getPriorityColor() }}
							>
								P{priority}
							</span>
						</div>
					)}
				</div>
			)}

			{/* Fila de contadores con iconos */}
			<div className="flex justify-between items-center text-xs">
				<div className="flex items-center gap-3">
					{/* Contador de imágenes */}
					<div className="flex items-center gap-1">
						<Image className="h-3 w-3 text-muted-foreground" />
						<span className="opacity-80">{imagesCount}</span>
					</div>

					{/* Contador de relaciones */}
					<div className="flex items-center gap-1">
						<Link className="h-3 w-3 text-muted-foreground" />
						<span className="opacity-80">{relationsCount}</span>
					</div>

					{/* Indicador de favorito */}
					{isFavorite && (
						<Heart className="h-3 w-3 fill-current text-pink-500" />
					)}
				</div>

				{/* Fecha */}
				<div className="flex items-center gap-1">
					<Calendar className="h-3 w-3 text-muted-foreground" />
					<span className="opacity-80 text-[0.65rem]">{formattedDate}</span>
				</div>
			</div>

			{/* Fecha de actualización si es diferente */}
			{wasUpdated && updatedFormattedDate && (
				<div className="flex justify-end items-center text-[0.65rem] opacity-60 mt-0.5">
					<span>Actualizado {updatedFormattedDate}</span>
				</div>
			)}
		</div>
	);
}