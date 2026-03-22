import { Calendar, Database, Heart, Image } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface CollectionCardFooterProps {
	compact?: boolean;
	createdAt: Date | string;
	entitiesCount?: number;
	imagesCount?: number;
	isFavorite?: boolean;
	primaryColor: string;
	secondaryColor: string;
	updatedAt: Date | string;
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
						<Image className="h-4 w-4" />
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
						<Database className="h-4 w-4" />
						<span className="text-foreground">{entitiesCount}</span>
					</div>
				</div>

				{/* Parte derecha - Favorito con estilo TCG */}
				{isFavorite && (
					<div
						className="flex items-center gap-1 rounded-sm bg-destructive/10 px-2 py-1"
						style={{
							color: 'var(--ui-error-text)',
							boxShadow: '0 0 5px color-mix(in oklch, var(--ui-error-text), transparent 70%)',
						}}
					>
						<Heart className="h-4 w-4 fill-current" />
						<span className="font-medium text-sm uppercase tracking-wide">Favorito</span>
					</div>
				)}
			</div>

			{/* Si está en modo compacto, mostrar información mínima */}
			{!compact && (
				<>
					{/* Información adicional - Similar a la línea de coleccionista en TCG */}
					<div className="mt-2 flex items-center justify-between text-muted-foreground text-sm">
						{/* Fecha de creación */}
						<div className="flex items-center gap-1">
							<Calendar className="h-4 w-4" />
							<span className="mr-1 opacity-70">Creado:</span>
							<span className="font-medium">{formattedCreated}</span>
						</div>

						{/* Fecha de actualización (reducida en espacio si es necesario) */}
						<div className="flex items-center gap-1">
							<Calendar className="h-4 w-4" />
							<span className="mr-1 opacity-70">Act:</span>
							<span className="font-medium">{formattedUpdated}</span>
						</div>
					</div>

					{/* Línea de ilustrador - estilo TCG */}
					<div
						className="mt-1 text-center text-muted-foreground text-sm italic"
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
