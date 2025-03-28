import { cn } from '@/lib/utils';
import { BookOpen, Star, Tag as TagIcon } from 'lucide-react';

interface TagCardHeaderProps {
	name: string;
	emoji: string;
	color: string;
	category?: string | null;
	rarity?: string | null;
}

/**
 * Componente para el encabezado de la tarjeta de etiqueta.
 * Similar al encabezado de una carta Magic con el nombre y coste.
 */
export function TagCardHeader({
	name,
	emoji,
	color,
	category,
	rarity,
}: TagCardHeaderProps) {
	// Estilo especial para el encabezado de etiquetas, con un diseño más distintivo
	return (
		<div className="relative">
			{/* Encabezado distintivo de etiqueta */}
			<div
				className="flex items-center justify-between py-2.5 px-3.5"
				style={{
					background: `linear-gradient(135deg, ${color}90, ${color}70)`,
					borderBottom: `1px solid ${color}`,
				}}
			>
				{/* Parte izquierda: Emoji y nombre */}
				<div className="flex items-center gap-2 max-w-[75%]">
					{/* Emoji con estilo de tag */}
					<div
						className="w-7 h-7 rounded-full flex items-center justify-center text-lg"
						style={{
							background: 'rgba(255, 255, 255, 0.25)',
							boxShadow: `0 0 8px ${color}40`,
						}}
					>
						{emoji}
					</div>

					{/* Nombre de la etiqueta */}
					<h3
						className={cn(
							"font-bold text-lg text-white truncate",
							"drop-shadow-sm",
						)}
					>
						{name}
					</h3>
				</div>

				{/* Icono de etiqueta a la derecha */}
				<div
					className="flex-shrink-0 flex items-center"
					style={{
						color: 'rgba(255, 255, 255, 0.7)'
					}}
				>
					<TagIcon
						className="w-5 h-5 drop-shadow-sm"
						style={{
							filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))'
						}}
					/>
				</div>
			</div>

			{/* Barra secundaria con categoría y rareza */}
			<div
				className="flex items-center justify-between py-1.5 px-3.5 text-xs text-white"
				style={{
					background: 'rgba(0, 0, 0, 0.3)',
					borderBottom: `1px solid ${color}50`,
				}}
			>
				{/* Categoría - similar al tipo en Magic */}
				<div className="flex items-center gap-1">
					<span className="font-semibold tracking-wide">
						ETIQUETA
					</span>
					{category && (
						<>
							<span className="mx-0.5">•</span>
							<div className="flex items-center gap-1">
								<BookOpen className="w-3 h-3" />
								<span>{category.toUpperCase()}</span>
							</div>
						</>
					)}
				</div>

				{/* Rareza - similar a la rareza en Magic */}
				{rarity && (
					<div className="flex items-center gap-1">
						<Star className="w-3.5 h-3.5" />
						<span className="font-medium">{rarity}</span>
					</div>
				)}
			</div>
		</div>
	);
}