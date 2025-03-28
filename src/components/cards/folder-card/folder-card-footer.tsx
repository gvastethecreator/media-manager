import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Folder, Heart, Image } from 'lucide-react';

interface FolderCardFooterProps {
	createdAt: Date;
	updatedAt: Date;
	imagesCount: number;
	isFavorite: boolean;
	path: string;
	primaryColor: string;
	secondaryColor: string;
}

/**
 * Componente para el pie de la tarjeta de carpeta.
 * Similar a la parte inferior de una carta Magic con la fuerza/resistencia y el artista.
 */
export function FolderCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	isFavorite,
	path,
	primaryColor,
	secondaryColor,
}: FolderCardFooterProps) {
	// Formatear fechas
	const formattedCreated = format(new Date(createdAt), 'dd/MM/yy', { locale: es });
	const formattedUpdated = format(new Date(updatedAt), 'dd/MM/yy', { locale: es });

	// Obtener solo la parte final de la ruta para mayor claridad
	const shortPath = path.split('\\').pop() || path.split('/').pop() || path;

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

				{/* Parte derecha - Favorito */}
				{isFavorite && (
					<div
						className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-sm"
						style={{ color: 'rgb(239, 68, 68)' }}
					>
						<Heart className="w-3.5 h-3.5 fill-current" />
						<span className="text-xs font-medium uppercase tracking-wide">Favorito</span>
					</div>
				)}
			</div>

			{/* Información adicional - Similar a la línea de coleccionista en Magic */}
			<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
				{/* Carpeta y ruta */}
				<div className="flex items-center gap-1 max-w-[60%]">
					<Folder className="w-3 h-3" />
					<span
						className="truncate bg-black/10 px-1.5 py-0.5 rounded"
						style={{ borderLeft: `2px solid ${primaryColor}` }}
					>
						{shortPath}
					</span>
				</div>

				{/* Fecha de creación */}
				<div className="flex items-center gap-1">
					<Calendar className="w-3 h-3" />
					<span className="opacity-70 mr-1">Creado:</span>
					<span className="font-medium">{formattedCreated}</span>
				</div>
			</div>

			{/* Línea de ilustrador - similar a Magic */}
			<div className="mt-1 text-xs text-center text-muted-foreground italic" style={{ opacity: 0.7 }}>
				♦ Colección personal ♦
			</div>
		</div>
	);
}
