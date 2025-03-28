import { cn } from '@/lib/utils';

interface CharacterCardHeaderProps {
	name: string;
	emoji?: string | null;
	color: string;
	level?: number | null;
	class?: string | null;
	race?: string | null;
}

/**
 * Componente para el encabezado de la tarjeta de personaje.
 * Similar a la parte superior de una carta Magic con el nombre y tipo de carta.
 */
export function CharacterCardHeader({
	name,
	emoji = '👤',
	color,
	level = 1,
	class: characterClass = 'desconocido',
	race = 'desconocido'
}: CharacterCardHeaderProps) {
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
						{emoji || '👤'}
					</span>

					{/* Nombre del personaje (como título de la carta) */}
					<h3
						className={cn(
							"font-bold text-lg tracking-tight truncate",
							"text-white drop-shadow-sm"
						)}
					>
						{name}
					</h3>
				</div>

				{/* Parte derecha: Nivel (como coste de maná) */}
				<div className="flex-shrink-0 flex items-center">
					<span
						className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
						style={{
							backgroundColor: `${color}90`,
							border: '1px solid rgba(255,255,255,0.3)',
							boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
						}}
					>
						{level}
					</span>
				</div>
			</div>

			{/* Tipo de la carta - similar a la línea de tipo en Magic */}
			<div
				className="text-xs text-white px-3.5 py-1.5 bg-black/40 border-y border-y-white/20 flex justify-between items-center"
				style={{
					borderBottom: `1px solid ${color}50`
				}}
			>
				<span className="font-semibold tracking-wide uppercase">{race}</span>
				<span className="font-semibold tracking-wide uppercase">{characterClass}</span>
			</div>
		</div>
	);
}