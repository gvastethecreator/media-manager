import { cn } from '@/lib/utils';
import { BookOpen, Star } from 'lucide-react';

interface AlbumCardHeaderProps {
	name: string;
	emoji: string;
	color: string;
	category?: string | null;
	rarity?: string | null;
}

/**
 * Componente para el encabezado de la tarjeta de álbum.
 * Similar a la parte superior de una carta Magic con el nombre y tipo de carta.
 */
export function AlbumCardHeader({
	name,
	emoji,
	color,
	category,
	rarity
}: AlbumCardHeaderProps) {
	return (
		<div className="relative">
			{/* Fondo del título con gradiente de color */}
			<div
				className="h-14 pt-2.5 px-3.5 flex items-center"
				style={{
					background: `linear-gradient(90deg, ${color}90, ${color}60)`,
					borderBottom: `1px solid ${color}`
				}}
			>
				{/* Parte izquierda: Emoji y nombre */}
				<div className="flex items-center space-x-2 flex-1">
					{/* Emoji (como símbolo de maná en Magic) */}
					<span className="text-xl flex-shrink-0 bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
						{emoji}
					</span>

					{/* Nombre del álbum (como título de la carta) */}
					<h3
						className={cn(
							"font-bold text-lg tracking-tight truncate",
							"text-white drop-shadow-sm"
						)}
					>
						{name}
					</h3>
				</div>

				{/* Parte derecha: Rareza (similar a coste de maná en Magic) */}
				{rarity && (
					<div className="flex-shrink-0 flex items-center">
						<span
							className="px-2 py-0.5 text-xs uppercase tracking-wide rounded flex items-center gap-1"
							style={{
								background: getRarityColor(rarity),
								boxShadow: `0 0 5px ${getRarityColor(rarity)}`
							}}
						>
							<Star className="w-3 h-3 stroke-[2.5px]" />
							{rarity}
						</span>
					</div>
				)}
			</div>

			{/* Tipo de la carta - similar a la línea de tipo en Magic */}
			<div
				className="text-xs text-white px-3.5 py-1.5 bg-black/40 border-y border-y-white/20 flex justify-between items-center"
				style={{
					borderBottom: `1px solid ${color}50`
				}}
			>
				<span className="font-semibold tracking-wide flex items-center gap-1">
					ÁLBUM {category && (
						<>
							<span className="mx-0.5">•</span>
							<BookOpen className="w-3 h-3 inline mr-0.5" />
							{category.toUpperCase()}
						</>
					)}
				</span>
				<span className="opacity-80 text-xs">ID: {name.substring(0, 5).toUpperCase()}</span>
			</div>
		</div>
	);
}

/**
 * Función auxiliar para obtener un color basado en la rareza
 */
function getRarityColor(rarity: string): string {
	switch (rarity.toLowerCase()) {
		case 'common':
			return 'rgba(169, 169, 169, 0.7)'; // Gris
		case 'uncommon':
			return 'rgba(88, 186, 124, 0.7)'; // Verde
		case 'rare':
			return 'rgba(71, 119, 194, 0.7)'; // Azul
		case 'mythic':
			return 'rgba(207, 111, 36, 0.7)'; // Naranja
		case 'legendary':
			return 'rgba(165, 66, 153, 0.7)'; // Púrpura
		case 'exclusive':
			return 'rgba(212, 175, 55, 0.7)'; // Dorado
		default:
			return 'rgba(169, 169, 169, 0.7)'; // Gris por defecto
	}
}