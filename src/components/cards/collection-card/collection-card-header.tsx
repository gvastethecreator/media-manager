import { cn } from '@/lib/utils';
import { BookOpen, Star } from 'lucide-react';

interface CollectionCardHeaderProps {
	name: string;
	emoji: string;
	color: string;
	category?: string | null;
	rarity?: string | null;
}

/**
 * Componente para el encabezado de la tarjeta de colección.
 * Similar al encabezado de una carta Magic con el nombre y coste.
 */
export function CollectionCardHeader({
	name,
	emoji,
	color,
	category,
	rarity,
}: CollectionCardHeaderProps) {
	return (
		<div className="relative p-3 border-b" style={{ borderColor: `${color}30` }}>
			{/* Fondo con gradiente */}
			<div
				className="absolute inset-0 opacity-30 -z-10"
				style={{
					background: `linear-gradient(135deg, ${color}40, transparent)`,
				}}
			/>

			{/* Nombre y emoji */}
			<div className="flex items-center justify-between">
				{/* Nombre de la colección */}
				<h3
					className={cn(
						'text-foreground font-bold text-base truncate max-w-[70%]',
						'hover:underline hover:underline-offset-4'
					)}
					style={{ textDecorationColor: color }}
				>
					{name}
				</h3>

				{/* Emoji */}
				<div
					className="w-8 h-8 flex items-center justify-center rounded-full text-lg"
					style={{
						background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
						boxShadow: `0 0 8px ${color}60`,
					}}
				>
					{emoji}
				</div>
			</div>

			{/* Info adicional - similar al tipo y rareza en Magic */}
			<div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
				{/* Categoría - similar al tipo en Magic */}
				{category && (
					<div className="flex items-center gap-1">
						<BookOpen className="w-3.5 h-3.5" />
						<span>{category}</span>
					</div>
				)}

				{/* Rareza - similar a la rareza en Magic */}
				{rarity && (
					<div className="flex items-center gap-1" style={{ color }}>
						<Star className="w-3.5 h-3.5" />
						<span className="font-medium">{rarity}</span>
					</div>
				)}
			</div>
		</div>
	);
}