import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Database, Heart, Image } from 'lucide-react';

interface CollectionCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount: number;
	entitiesCount: number;
	primaryColor: string;
	secondaryColor: string;
	isFavorite?: boolean;
	compact?: boolean;
}

/**
 * Componente para el pie de la tarjeta de colección.
 * Diseñado como la parte inferior de una carta TCG con estadísticas y detalles.
 */
export function CollectionCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	entitiesCount,
	primaryColor,
	secondaryColor,
	isFavorite,
	compact = false,
}: CollectionCardFooterProps) {
	// Formatear fechas
	const formattedCreated = format(new Date(createdAt), 'dd/MM/yy', { locale: es });
	const formattedUpdated = format(new Date(updatedAt), 'dd/MM/yy', { locale: es });

	return (
		<div
			className={`p-3 border-t ${compact ? 'mt-auto' : ''}`}
			style={{
				borderColor: `${primaryColor}40`,
				background: compact ? `linear-gradient(to top, ${primaryColor}25, transparent)` : 'transparent',
			}}
		>
			{/* Pie de la carta */}
			<div className="flex items-center justify-between">
				{/* Parte izquierda - Estadísticas tipo TCG */}
				<div className="flex items-center gap-2">
					{/* Contador de imágenes */}
					<div
						className="text-sm font-bold rounded px-2 py-1 flex items-center gap-1"
						style={{
							border: `1px solid ${primaryColor}40`,
							background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`,
							boxShadow: `0 1px 3px ${primaryColor}20`,
						}}
					>
						<Image className="w-3.5 h-3.5" />
						<span className="text-foreground">{imagesCount}</span>
					</div>

					{/* Contador de entidades relacionadas */}
					<div
						className="text-sm font-bold rounded px-2 py-1 flex items-center gap-1"
						style={{
							border: `1px solid ${primaryColor}40`,
							background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`,
							boxShadow: `0 1px 3px ${primaryColor}20`,
						}}
					>
						<Database className="w-3.5 h-3.5" />
						<span className="text-foreground">{entitiesCount}</span>
					</div>
				</div>

				{/* Parte derecha - Favorito con estilo TCG */}
				{isFavorite && (
					<div
						className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-sm"
						style={{
							color: 'rgb(239, 68, 68)',
							boxShadow: '0 0 5px rgba(239, 68, 68, 0.3)',
						}}
					>
						<Heart className="w-3.5 h-3.5 fill-current" />
						<span className="text-xs font-medium uppercase tracking-wide">Favorito</span>
					</div>
				)}
			</div>

			{/* Si está en modo compacto, mostrar información mínima */}
			{!compact && (
				<>
					{/* Información adicional - Similar a la línea de coleccionista en TCG */}
					<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
						{/* Fecha de creación */}
						<div className="flex items-center gap-1">
							<Calendar className="w-3 h-3" />
							<span className="opacity-70 mr-1">Creado:</span>
							<span className="font-medium">{formattedCreated}</span>
						</div>

						{/* Fecha de actualización (reducida en espacio si es necesario) */}
						<div className="flex items-center gap-1">
							<Calendar className="w-3 h-3" />
							<span className="opacity-70 mr-1">Act:</span>
							<span className="font-medium">{formattedUpdated}</span>
						</div>
					</div>

					{/* Línea de ilustrador - estilo TCG */}
					<div
						className="mt-1 text-xs text-center text-muted-foreground italic"
						style={{
							opacity: 0.7,
							textShadow: `0 0 5px ${primaryColor}30`,
						}}
					>
						♦ Colección digital ♦ {imagesCount > 0 ? `${imagesCount} items` : 'Sin items'}
					</div>
				</>
			)}
		</div>
	);
}
