import { Dices, Gem, Globe, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionCardHeaderProps {
	category?: string | null;
	color: string;
	emoji: string;
	isFavorite?: boolean;
	name: string;
	platform?: string | null;
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
				className="absolute top-0 right-0 left-0 z-10 h-0.5"
				style={{
					background: `linear-gradient(to right, transparent, ${color}, transparent)`,
					boxShadow: `0 0 5px ${color}`,
				}}
			/>

			{/* Fondo del título con gradiente de color TCG */}
			<div
				className="relative flex h-16 items-center overflow-hidden px-3.5 pt-2.5"
				style={{
					background: `linear-gradient(90deg, ${color}90, ${color}60)`,
					borderBottom: `1px solid ${color}`,
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
				<div className="flex flex-1 items-center space-x-2">
					{/* Emoji (como emblema en carta TCG) */}
					<span
						className="z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xl"
						style={{
							background: `linear-gradient(135deg, white, ${color}20)`,
							border: `1px solid ${color}`,
							boxShadow: `0 0 5px ${color}80, inset 0 0 3px ${color}80`,
						}}
					>
						{emoji}
					</span>

					{/* Nombre de la colección (como título de la carta) */}
					<h3
						className={cn('truncate font-bold text-lg tracking-tight', 'z-10 text-white')}
						style={{ textShadow: `0 0 3px ${color}, 0 0 5px rgba(0,0,0,0.5)` }}
					>
						{name}
					</h3>

					{/* Indicador de favorito */}
					{isFavorite && (
						<Star
							className="z-10 ml-auto h-4 w-4 flex-shrink-0 fill-warning text-warning"
							style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}
						/>
					)}
				</div>

				{/* Parte derecha: Brillo holográfico decorativo */}
				<div
					className="absolute top-0 right-0 z-0 h-full w-24 rotate-15 transform opacity-10"
					style={{
						background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
					}}
				/>
			</div>

			{/* Tipo de la carta - estilo TCG */}
			<div
				className="flex items-center justify-between border-y bg-muted/40 px-3.5 py-1.5 text-sm text-white"
				style={{
					borderBottom: `1px solid ${color}50`,
					borderTop: `1px solid ${color}30`,
					boxShadow: 'inset 0 0 10px var(--dt-shadow-color-strong)',
				}}
			>
				{/* Categoría (como tipo de carta TCG) */}
				<div className="flex items-center gap-1">
					{category?.toUpperCase() === 'NFT' ? (
						<Gem className="h-4 w-4 opacity-80" />
					) : (
						<Dices className="h-4 w-4 opacity-80" />
					)}
					<span className="font-semibold uppercase tracking-wide">{category || 'COLLECTION'}</span>
				</div>

				{/* Plataforma (como subtipo en cartas TCG) */}
				{platform && (
					<div className="flex items-center gap-1">
						<Globe className="h-4 w-4 opacity-80" />
						<span
							className="rounded-sm bg-muted/30 px-1.5 py-0.5 text-xs opacity-90"
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
