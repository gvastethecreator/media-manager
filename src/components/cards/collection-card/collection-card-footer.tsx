import { Calendar, Database, Heart, Image } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface CollectionCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount?: number;
	entitiesCount?: number;
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
	// Helper function para mostrar el conteo de items
	const getItemsText = (): string => {
		const count = imagesCount ?? 0;
		return count > 0 ? `${count} items` : 'Sin items';
	};

	// Formatear fechas
	const formattedCreated = formatDate(new Date(createdAt), 'dd/MM/yy');
	const formattedUpdated = formatDate(new Date(updatedAt), 'dd/MM/yy');

	return (
		<div
			className={`border-t p-3 ${compact ? 'mt-auto' : ''}`}
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
						className="flex items-center gap-1 rounded px-2 py-1 font-bold text-sm"
						style={{
							border: `1px solid ${primaryColor}40`,
							background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`,
							boxShadow: `0 1px 3px ${primaryColor}20`,
						}}
					>
						<Image className="h-3.5 w-3.5" />
						<span className="text-foreground">{imagesCount}</span>
					</div>

					{/* Contador de entidades relacionadas */}
					<div
						className="flex items-center gap-1 rounded px-2 py-1 font-bold text-sm"
						style={{
							border: `1px solid ${primaryColor}40`,
							background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`,
							boxShadow: `0 1px 3px ${primaryColor}20`,
						}}
					>
						<Database className="h-3.5 w-3.5" />
						<span className="text-foreground">{entitiesCount}</span>
					</div>
				</div>

				{/* Parte derecha - Favorito con estilo TCG */}
				{isFavorite && (
					<div
						className="flex items-center gap-1 rounded-sm bg-red-500/10 px-2 py-1"
						style={{
							color: 'rgb(239, 68, 68)',
							boxShadow: '0 0 5px rgba(239, 68, 68, 0.3)',
						}}
					>
						<Heart className="h-3.5 w-3.5 fill-current" />
						<span className="font-medium text-xs uppercase tracking-wide">Favorito</span>
					</div>
				)}
			</div>

			{/* Si está en modo compacto, mostrar información mínima */}
			{!compact && (
				<>
					{/* Información adicional - Similar a la línea de coleccionista en TCG */}
					<div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
						{/* Fecha de creación */}
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span className="mr-1 opacity-70">Creado:</span>
							<span className="font-medium">{formattedCreated}</span>
						</div>

						{/* Fecha de actualización (reducida en espacio si es necesario) */}
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span className="mr-1 opacity-70">Act:</span>
							<span className="font-medium">{formattedUpdated}</span>
						</div>
					</div>

					{/* Línea de ilustrador - estilo TCG */}
					<div
						className="mt-1 text-center text-muted-foreground text-xs italic"
						style={{
							opacity: 0.7,
							textShadow: `0 0 5px ${primaryColor}30`,
						}}
					>
						♦ Colección digital ♦ {getItemsText()}
					</div>
				</>
			)}
		</div>
	);
}
