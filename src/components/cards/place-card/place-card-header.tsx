import { Building2, Cloud, Compass, Droplets, Mountain, Palmtree, Sparkles, Sprout, Star, Trees } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceCardHeaderProps {
	/** Clima del lugar */
	climate?: string;
	/** Color primario para el tema */
	color: string;
	/** Si está en modo compacto */
	compact?: boolean;
	/** Emoji que representa el lugar */
	emoji: string;
	/** Si el lugar está marcado como favorito */
	isFavorite?: boolean;
	/** Nombre del lugar */
	name: string;
	/** Región donde se encuentra el lugar */
	region?: string;
	/** Si está en modo TCG con efectos especiales */
	tcgMode?: boolean;
	/** Tipo de lugar (ciudad, bosque, etc.) */
	type?: string;
}

/**
 * Componente para el encabezado de la tarjeta de lugar.
 * Diseñado como la parte superior de una carta TCG con el nombre,
 * región, tipo y decoración especial.
 */
export function PlaceCardHeader({
	name,
	emoji,
	color,
	region = 'Unknown',
	type = 'Unknown',
	climate = 'Templado',
	isFavorite = false,
	tcgMode = true,
}: PlaceCardHeaderProps) {
	// Determinar icono según el tipo de lugar
	const getTypeIcon = () => {
		const typeLC = type.toLowerCase();
		if (typeLC.includes('city') || typeLC.includes('ciudad')) {
			return <Building2 className="h-4 w-4" />;
		}
		if (typeLC.includes('forest') || typeLC.includes('bosque')) {
			return <Trees className="h-4 w-4" />;
		}
		if (typeLC.includes('mountain') || typeLC.includes('montaña')) {
			return <Mountain className="h-4 w-4" />;
		}
		if (typeLC.includes('desert') || typeLC.includes('desierto')) {
			return <Palmtree className="h-4 w-4" />;
		}
		return <Compass className="h-4 w-4" />;
	};

	// Determinar icono según el clima
	const getClimateIcon = () => {
		const climateLC = climate.toLowerCase();
		if (climateLC.includes('tropical')) {
			return <Palmtree className="h-4 w-4" />;
		}
		if (climateLC.includes('desert') || climateLC.includes('desierto')) {
			return <Palmtree className="h-4 w-4" />;
		}
		if (climateLC.includes('cold') || climateLC.includes('frío')) {
			return <Cloud className="h-4 w-4" />;
		}
		if (climateLC.includes('rain') || climateLC.includes('lluvia')) {
			return <Droplets className="h-4 w-4" />;
		}
		if (climateLC.includes('forest') || climateLC.includes('bosque')) {
			return <Sprout className="h-4 w-4" />;
		}
		return <Cloud className="h-4 w-4" />;
	};

	return (
		<div className="relative">
			{/* Fondo del título con gradiente de color */}
			<div
				className="relative flex h-16 items-center overflow-hidden px-3.5 pt-2.5"
				style={{
					background: `linear-gradient(90deg, color-mix(in oklab, ${color}, transparent 5%), color-mix(in oklab, ${color}, transparent 30%))`,
					borderBottom: `2px solid ${color}`,
				}}
			>
				{/* Patrones decorativos de fondo (estilo TCG) */}
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage:
							'radial-gradient(circle at 20% 50%, rgba(var(--effect-highlight-rgb), 1) 1px, transparent 1px), ' +
							'radial-gradient(circle at 80% 50%, rgba(var(--effect-highlight-rgb), 1) 1px, transparent 1px), ' +
							'radial-gradient(circle at 50% 20%, rgba(var(--effect-highlight-rgb), 1) 1px, transparent 1px)',
						backgroundSize: '20px 20px, 20px 20px, 30px 30px',
					}}
				/>

				{/* Efecto holográfico de líneas */}
				<div
					className="pointer-events-none absolute inset-0 opacity-15"
					style={{
						backgroundImage: `repeating-linear-gradient(90deg, ${color}, transparent 2px, transparent 4px)`,
						backgroundSize: '8px 100%',
						mixBlendMode: 'overlay',
					}}
				/>

				{/* Parte izquierda: Emoji y nombre */}
				<div className="relative z-10 flex flex-1 items-center space-x-2">
					{/* Emoji (como símbolo de la tarjeta en TCG) */}
					<div
						className={cn(
							'relative flex shrink-0 items-center justify-center rounded-full text-xl',
							tcgMode ? 'h-10 w-10' : 'h-8 w-8'
						)}
						style={{
							background: `radial-gradient(circle, color-mix(in oklab, ${color}, transparent 70%) 0%, color-mix(in oklab, ${color}, transparent 40%) 100%)`,
							boxShadow: `0 0 8px rgba(var(--effect-shadow-rgb), 0.4), inset 0 0 5px ${color}`,
						}}
					>
						{/* Efecto de brillo en el emoji */}
						<div className="absolute inset-0 overflow-hidden rounded-full">
							<div
								className="absolute top-0 left-1/4 h-1/3 w-1/2 blur-[1px]"
								style={{
									background: 'linear-gradient(to bottom, rgba(var(--effect-highlight-rgb), 0.7), transparent)',
								}}
							/>
						</div>

						{/* Anillo brillante alrededor del emoji */}
						<div className="absolute inset-0 rounded-full border-2 border-border/60" />

						<span className="relative z-10 drop-shadow-sm">{emoji}</span>
					</div>

					{/* Nombre del lugar (como título de la carta) */}
					<div className="flex flex-col">
						<h3 className={cn('truncate font-bold text-lg tracking-tight', 'text-white drop-shadow-md')}>
							{name}
							{isFavorite && <Star className="-mt-1 ml-1 inline h-4 w-4 fill-yellow-200 text-yellow-200" />}
						</h3>

						{/* Subtítulo con región */}
						<div className="flex items-center gap-1 text-sm text-white/80">
							<Compass className="h-4 w-4" />
							<span className="truncate">{region}</span>
						</div>
					</div>
				</div>

				{/* Parte derecha: Clima y Favorito */}
				<div className="relative z-10 flex shrink-0 items-center gap-1">
					{isFavorite && (
						<span
							className="flex items-center justify-center rounded-full px-2 py-0.5"
							style={{
								background: 'rgba(var(--effect-highlight-rgb), 0.3)',
								boxShadow:
									'0 0 10px rgba(var(--effect-highlight-rgb), 0.5), inset 0 0 3px rgba(var(--effect-highlight-rgb), 0.5)',
							}}
						>
							<Sparkles className="h-4 w-4 text-white" />
						</span>
					)}

					{/* Clima del lugar en estilo TCG */}
					<div
						className="flex h-8 w-8 items-center justify-center rounded-full text-white"
						style={{
							background: `radial-gradient(circle, ${color} 0%, color-mix(in oklab, ${color}, transparent 10%) 100%)`,
							boxShadow: `0 0 8px rgba(var(--effect-shadow-rgb), 0.4), inset 0 0 5px color-mix(in oklab, ${color}, transparent 40%)`,
						}}
					>
						{getClimateIcon()}
					</div>
				</div>

				{/* Elementos decorativos de esquina estilo TCG */}
				<div
					className="absolute top-0 left-0 h-5 w-5 rounded-br-sm border-t-2 border-l-2"
					style={{ borderColor: 'rgba(var(--effect-highlight-rgb), 0.3)' }}
				/>
				<div
					className="absolute top-0 right-0 h-5 w-5 rounded-bl-sm border-t-2 border-r-2"
					style={{ borderColor: 'rgba(var(--effect-highlight-rgb), 0.3)' }}
				/>
			</div>

			{/* Tipo de lugar - similar a la línea de tipo en TCG */}
			<div
				className="relative flex items-center justify-between px-3.5 py-1.5 text-sm text-white"
				style={{
					borderBottom: `2px solid color-mix(in oklab, ${color}, transparent 30%)`,
					background:
						'linear-gradient(to right, rgba(var(--effect-shadow-rgb), 0.6), rgba(var(--effect-shadow-rgb), 0.5))',
				}}
			>
				{/* Decoración de esquina de TCG */}
				<div
					className="absolute top-0 left-0 h-4 w-4 border-t border-l"
					style={{ borderColor: 'rgba(var(--effect-highlight-rgb), 0.3)' }}
				/>
				<div
					className="absolute top-0 right-0 h-4 w-4 border-t border-r"
					style={{ borderColor: 'rgba(var(--effect-highlight-rgb), 0.3)' }}
				/>

				<span className="ml-1 flex items-center gap-1 font-semibold tracking-wide">
					{getTypeIcon()}
					<span className="uppercase">{type}</span> • <span className="uppercase">{climate}</span>
				</span>

				{/* Decoración TCG con puntos estáticos en lugar de iterar */}
				<div className="mr-1 flex items-center gap-0.5">
					<div
						className="h-1.5 w-1.5 rounded-full"
						style={{
							backgroundColor: color,
							boxShadow: '0 0 2px rgba(var(--effect-highlight-rgb), 0.7)',
						}}
					/>
					<div
						className="h-1.5 w-1.5 rounded-full"
						style={{
							backgroundColor: color,
							boxShadow: '0 0 2px rgba(var(--effect-highlight-rgb), 0.7)',
						}}
					/>
					<div
						className="h-1.5 w-1.5 rounded-full"
						style={{
							backgroundColor: color,
							boxShadow: '0 0 2px rgba(var(--effect-highlight-rgb), 0.7)',
						}}
					/>
				</div>
			</div>
		</div>
	);
}
