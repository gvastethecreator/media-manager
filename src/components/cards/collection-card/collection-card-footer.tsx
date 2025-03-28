import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Heart, Image, Layers } from 'lucide-react';

interface CollectionCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount: number;
	texture?: string | null;
	primaryColor: string;
	secondaryColor: string;
	isFavorite?: boolean;
}

/**
 * Componente para el pie de la tarjeta de colección.
 * Similar a la parte inferior de una carta Magic con la fuerza/resistencia y el artista.
 */
export function CollectionCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	texture,
	primaryColor,
	secondaryColor,
	isFavorite,
}: CollectionCardFooterProps) {
	// Formatear fechas
	const formattedCreated = format(new Date(createdAt), 'dd/MM/yy', { locale: es });
	const formattedUpdated = format(new Date(updatedAt), 'dd/MM/yy', { locale: es });

	return (
		<div className="p-3 border-t" style={{ borderColor: `${primaryColor}30` }}>
			{/* Pie de la carta */}
			<div className="flex items-center justify-between">
				{/* Parte izquierda - Contador de imágenes (como fuerza/resistencia en Magic) */}
				<div
					className="text-sm font-bold bg-black/20 rounded px-2 py-1 flex items-center gap-1"
					style={{
						border: `1px solid ${primaryColor}40`,
						background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`
					}}
				>
					{/* El contador de imágenes como valor de fuerza/resistencia en Magic */}
					<Image className="w-3.5 h-3.5" />
					<span className="text-foreground">{imagesCount}</span>
				</div>

				{/* Parte derecha - Combina textura y favorito si existen */}
				<div className="flex items-center gap-2">
					{/* Textura (similar a tipo de expansión en Magic) */}
					{texture && (
						<div
							className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-sm"
							style={{ color: `${primaryColor}` }}
						>
							<Layers className="w-3.5 h-3.5" />
							<span className="text-xs font-medium uppercase tracking-wide">{texture}</span>
						</div>
					)}

					{/* Favorito */}
					{isFavorite && (
						<div
							className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-sm"
							style={{ color: 'rgb(239, 68, 68)' }}
						>
							<Heart className="w-3.5 h-3.5 fill-current" />
							<span className="text-xs font-medium uppercase tracking-wide">Fav</span>
						</div>
					)}
				</div>
			</div>

			{/* Información adicional - Similar a la línea de coleccionista en Magic */}
			<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
				{/* Fecha de creación */}
				<div className="flex items-center gap-1">
					<Calendar className="w-3 h-3" />
					<span className="opacity-70 mr-1">Creado:</span>
					<span className="font-medium">{formattedCreated}</span>
				</div>

				{/* Fecha de actualización */}
				<div className="flex items-center gap-1">
					<Clock className="w-3 h-3" />
					<span className="opacity-70 mr-1">Act:</span>
					<span className="font-medium">{formattedUpdated}</span>
				</div>
			</div>

			{/* Línea de ilustrador - similar a Magic */}
			<div className="mt-1 text-xs text-center text-muted-foreground italic" style={{ opacity: 0.7 }}>
				♦ Colección personal ♦
			</div>
		</div>
	);
}