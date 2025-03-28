import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Lightbulb, Paperclip, Star } from 'lucide-react';

interface ConceptCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount?: number;
	prompts?: number;
	isFavorite?: boolean;
	category?: string | null;
	primaryColor: string;
	secondaryColor: string;
}

/**
 * Componente para el pie de una tarjeta de concepto.
 * Similar a la parte inferior de una carta Magic con el tipo, artista y copyright.
 */
export function ConceptCardFooter({
	createdAt,
	updatedAt,
	imagesCount = 0,
	prompts = 0,
	isFavorite = false,
	category = 'Concepto',
	primaryColor,
	secondaryColor
}: ConceptCardFooterProps) {
	// Convertir fechas a objetos Date si son strings
	const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
	const updatedAtDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;

	// Calcular tiempo relativo
	const createdTimeAgo = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
		locale: es
	});
	const updatedTimeAgo = formatDistanceToNow(updatedAtDate, {
		addSuffix: true,
		locale: es
	});

	return (
		<div
			className="px-3 py-2 text-xs text-white/80"
			style={{
				background: `linear-gradient(to top, ${secondaryColor}90, ${secondaryColor}60)`,
				borderTop: `1px solid ${primaryColor}40`
			}}
		>
			<div className="flex justify-between items-center mb-1.5">
				{/* Categoría del concepto */}
				<div className="flex items-center">
					<Lightbulb size={14} className="mr-1.5 opacity-80" />
					<span className="uppercase tracking-wide font-medium">
						{category}
					</span>
				</div>

				{/* Contador de prompts y favorito */}
				<div className="flex items-center space-x-2">
					{/* Indicador de favorito */}
					{isFavorite && (
						<Star
							size={14}
							className="fill-yellow-400 text-yellow-400"
							aria-label="Favorito"
						/>
					)}

					{/* Contador de prompts */}
					<div className="flex items-center">
						<Paperclip size={14} className="mr-1 opacity-80" />
						<span>{prompts}</span>
					</div>
				</div>
			</div>

			{/* Fechas de creación y modificación */}
			<div className="flex justify-between text-[0.65rem] text-white/60">
				<div className="flex items-center">
					<Calendar size={12} className="mr-1" />
					<span title={`Creado: ${createdAtDate.toLocaleString()}`}>
						{createdTimeAgo}
					</span>
				</div>
				<div className="flex items-center">
					<Clock size={12} className="mr-1" />
					<span title={`Actualizado: ${updatedAtDate.toLocaleString()}`}>
						{updatedTimeAgo}
					</span>
				</div>
			</div>
		</div>
	);
}