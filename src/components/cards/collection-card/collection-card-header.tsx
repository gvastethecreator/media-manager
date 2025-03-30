import { cn } from '@/lib/utils';
import { Dices, Gem, Globe, Star } from 'lucide-react';

interface CollectionCardHeaderProps {
	name: string;
	emoji: string;
	color: string;
	category?: string | null;
	platform?: string | null;
	isFavorite?: boolean;
}

/**
 * Componente para el encabezado de la tarjeta de colección.
 * Diseñado como el encabezado de una carta TCG con nombre, emblema y tipo.
 */
export function CollectionCardHeader({
	name,
	emoji,
	color,
	category,
	platform,
	isFavorite = false,
}: CollectionCardHeaderProps) {
	return (
		<div className="relative">
			{/* Borde decorativo superior tipo TCG */}
			<div
				className="absolute top-0 left-0 right-0 h-0.5 z-10"
				style={{
					background: `linear-gradient(to right, transparent, ${color}, transparent)`,
					boxShadow: `0 0 5px ${color}`
				}}
			/>

			{/* Fondo del título con gradiente de color TCG */}
			<div
				className="h-16 pt-2.5 px-3.5 flex items-center relative overflow-hidden"
				style={{
					background: `linear-gradient(90deg, ${color}90, ${color}60)`,
					borderBottom: `1px solid ${color}`
				}}
			>
				{/* Patrón de fondo estilo TCG */}
				<div
					className="absolute inset-0 opacity-20 mix-blend-overlay"
					style={{
						backgroundImage: `radial-gradient(circle at 15% 50%, ${color}99, transparent 25%), radial-gradient(circle at 85% 30%, ${color}99, transparent 25%)`,
					}}
				/>

				{/* Parte izquierda: Emoji y nombre */}
				<div className="flex items-center space-x-2 flex-1">
					{/* Emoji (como emblema en carta TCG) */}
					<span
						className="text-xl flex-shrink-0 rounded-full w-9 h-9 flex items-center justify-center z-10"
						style={{
							background: `linear-gradient(135deg, white, ${color}20)`,
							border: `1px solid ${color}`,
							boxShadow: `0 0 5px ${color}80, inset 0 0 3px ${color}80`
						}}
					>
						{emoji}
					</span>

					{/* Nombre de la colección (como título de la carta) */}
					<h3
						className={cn(
							"font-bold text-lg tracking-tight truncate",
							"text-white z-10"
						)}
						style={{ textShadow: `0 0 3px ${color}, 0 0 5px rgba(0,0,0,0.5)` }}
					>
						{name}
					</h3>

					{/* Indicador de favorito */}
					{isFavorite && (
						<Star
							className="w-4 h-4 text-yellow-400 fill-yellow-400 z-10 ml-auto flex-shrink-0"
							style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))" }}
						/>
					)}
				</div>

				{/* Parte derecha: Brillo holográfico decorativo */}
				<div
					className="absolute top-0 right-0 w-24 h-full opacity-10 z-0 rotate-15 transform"
					style={{
						background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
					}}
				/>
			</div>

			{/* Tipo de la carta - estilo TCG */}
			<div
				className="text-xs text-white px-3.5 py-1.5 bg-black/40 border-y flex justify-between items-center"
				style={{
					borderBottom: `1px solid ${color}50`,
					borderTop: `1px solid ${color}30`,
					boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
				}}
			>
				{/* Categoría (como tipo de carta TCG) */}
				<div className="flex items-center gap-1">
					{category?.toUpperCase() === 'NFT' ? (
						<Gem className="w-3.5 h-3.5 opacity-80" />
					) : (
						<Dices className="w-3.5 h-3.5 opacity-80" />
					)}
					<span className="font-semibold tracking-wide uppercase">{category || 'COLECCIÓN'}</span>
				</div>

				{/* Plataforma (como subtipo en cartas TCG) */}
				{platform && (
					<div className="flex items-center gap-1">
						<Globe className="w-3.5 h-3.5 opacity-80" />
						<span
							className="opacity-90 text-[10px] bg-black/30 px-1.5 py-0.5 rounded-sm"
							style={{ border: `1px solid ${color}40` }}
						>
							{platform}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}