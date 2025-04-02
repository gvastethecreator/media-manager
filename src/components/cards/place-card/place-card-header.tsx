'use client';

import { cn } from '@/lib/utils';
import { Building2, Cloud, Compass, Droplets, Mountain, Palmtree, Sparkles, Sprout, Star, Trees } from 'lucide-react';

interface PlaceCardHeaderProps {
	/** Nombre del lugar */
	name: string;
	/** Emoji que representa el lugar */
	emoji: string;
	/** Color primario para el tema */
	color: string;
	/** Región donde se encuentra el lugar */
	region?: string;
	/** Tipo de lugar (ciudad, bosque, etc.) */
	type?: string;
	/** Clima del lugar */
	climate?: string;
	/** Si el lugar está marcado como favorito */
	isFavorite?: boolean;
	/** Si está en modo TCG con efectos especiales */
	tcgMode?: boolean;
	/** Si está en modo compacto */
	compact?: boolean;
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
	region = 'Desconocido',
	type = 'Desconocido',
	climate = 'Templado',
	isFavorite = false,
	tcgMode = true,
	compact = false
}: PlaceCardHeaderProps) {
	// Determinar icono según el tipo de lugar
	const getTypeIcon = () => {
		const typeLC = type.toLowerCase();
		if (typeLC.includes('city') || typeLC.includes('ciudad')) return <Building2 className="w-3.5 h-3.5" />;
		if (typeLC.includes('forest') || typeLC.includes('bosque')) return <Trees className="w-3.5 h-3.5" />;
		if (typeLC.includes('mountain') || typeLC.includes('montaña')) return <Mountain className="w-3.5 h-3.5" />;
		if (typeLC.includes('desert') || typeLC.includes('desierto')) return <Palmtree className="w-3.5 h-3.5" />;
		return <Compass className="w-3.5 h-3.5" />;
	};

	// Determinar icono según el clima
	const getClimateIcon = () => {
		const climateLC = climate.toLowerCase();
		if (climateLC.includes('tropical')) return <Palmtree className="w-3.5 h-3.5" />;
		if (climateLC.includes('desert') || climateLC.includes('desierto')) return <Palmtree className="w-3.5 h-3.5" />;
		if (climateLC.includes('cold') || climateLC.includes('frío')) return <Cloud className="w-3.5 h-3.5" />;
		if (climateLC.includes('rain') || climateLC.includes('lluvia')) return <Droplets className="w-3.5 h-3.5" />;
		if (climateLC.includes('forest') || climateLC.includes('bosque')) return <Sprout className="w-3.5 h-3.5" />;
		return <Cloud className="w-3.5 h-3.5" />;
	};

	return (
		<div className="relative">
			{/* Fondo del título con gradiente de color */}
			<div
				className="h-16 pt-2.5 px-3.5 flex items-center relative overflow-hidden"
				style={{
					background: `linear-gradient(90deg, ${color}95, ${color}70)`,
					borderBottom: `2px solid ${color}`
				}}
			>
				{/* Patrones decorativos de fondo (estilo TCG) */}
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage:
							'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), ' +
							'radial-gradient(circle at 80% 50%, white 1px, transparent 1px), ' +
							'radial-gradient(circle at 50% 20%, white 1px, transparent 1px)',
						backgroundSize: '20px 20px, 20px 20px, 30px 30px'
					}}
				/>

				{/* Efecto holográfico de líneas */}
				<div
					className="absolute inset-0 opacity-15 pointer-events-none"
					style={{
						backgroundImage: `repeating-linear-gradient(90deg, ${color}, transparent 2px, transparent 4px)`,
						backgroundSize: '8px 100%',
						mixBlendMode: 'overlay'
					}}
				/>

				{/* Parte izquierda: Emoji y nombre */}
				<div className="flex items-center space-x-2 flex-1 relative z-10">
					{/* Emoji (como símbolo de la tarjeta en TCG) */}
					<div
						className={cn(
							"text-xl flex-shrink-0 rounded-full flex items-center justify-center relative",
							tcgMode ? "w-10 h-10" : "w-8 h-8"
						)}
						style={{
							background: `radial-gradient(circle, ${color}30 0%, ${color}60 100%)`,
							boxShadow: `0 0 8px rgba(0,0,0,0.4), inset 0 0 5px ${color}`
						}}
					>
						{/* Efecto de brillo en el emoji */}
						<div className="absolute inset-0 rounded-full overflow-hidden">
							<div
								className="absolute top-0 left-1/4 w-1/2 h-1/3 blur-[1px]"
								style={{
									background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), transparent)',
								}}
							/>
						</div>

						{/* Anillo brillante alrededor del emoji */}
						<div className="absolute inset-0 rounded-full border-2 border-white/20" />

						<span className="relative z-10 drop-shadow-sm">{emoji}</span>
					</div>

					{/* Nombre del lugar (como título de la carta) */}
					<div className="flex flex-col">
						<h3
							className={cn(
								"font-bold text-lg tracking-tight truncate",
								"text-white drop-shadow-md"
							)}
						>
							{name}
							{isFavorite && (
								<Star className="w-4 h-4 inline ml-1 -mt-1 text-yellow-200 fill-yellow-200" />
							)}
						</h3>

						{/* Subtítulo con región */}
						<div className="text-xs text-white/80 flex items-center gap-1">
							<Compass className="w-3.5 h-3.5" />
							<span className="truncate">
								{region}
							</span>
						</div>
					</div>
				</div>

				{/* Parte derecha: Clima y Favorito */}
				<div className="flex-shrink-0 flex items-center gap-1 relative z-10">
					{isFavorite && (
						<span
							className="px-2 py-0.5 rounded-full flex items-center justify-center"
							style={{
								background: 'rgba(255, 255, 255, 0.3)',
								boxShadow: '0 0 10px rgba(255, 255, 255, 0.5), inset 0 0 3px rgba(255, 255, 255, 0.5)'
							}}
						>
							<Sparkles className="w-4 h-4 text-white" />
						</span>
					)}

					{/* Clima del lugar en estilo TCG */}
					<div
						className="w-8 h-8 rounded-full flex items-center justify-center text-white"
						style={{
							background: `radial-gradient(circle, ${color} 0%, ${color}90 100%)`,
							boxShadow: `0 0 8px rgba(0,0,0,0.4), inset 0 0 5px ${color}60`
						}}
					>
						{getClimateIcon()}
					</div>
				</div>

				{/* Elementos decorativos de esquina estilo TCG */}
				<div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-br-sm"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
				<div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-bl-sm"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
			</div>

			{/* Tipo de lugar - similar a la línea de tipo en TCG */}
			<div
				className="text-xs text-white px-3.5 py-1.5 flex justify-between items-center relative"
				style={{
					borderBottom: `2px solid ${color}70`,
					background: 'linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.5))'
				}}
			>
				{/* Decoración de esquina de TCG */}
				<div
					className="absolute left-0 top-0 w-4 h-4 border-l border-t"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>
				<div
					className="absolute right-0 top-0 w-4 h-4 border-r border-t"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>

				<span className="font-semibold tracking-wide flex items-center gap-1 ml-1">
					{getTypeIcon()}
					<span className="uppercase">{type}</span> • <span className="uppercase">{climate}</span>
				</span>

				{/* Decoración TCG con puntos estáticos en lugar de iterar */}
				<div className="flex items-center gap-0.5 mr-1">
					<div
						className="w-1.5 h-1.5 rounded-full"
						style={{
							backgroundColor: color,
							boxShadow: '0 0 2px rgba(255, 255, 255, 0.7)'
						}}
					/>
					<div
						className="w-1.5 h-1.5 rounded-full"
						style={{
							backgroundColor: color,
							boxShadow: '0 0 2px rgba(255, 255, 255, 0.7)'
						}}
					/>
					<div
						className="w-1.5 h-1.5 rounded-full"
						style={{
							backgroundColor: color,
							boxShadow: '0 0 2px rgba(255, 255, 255, 0.7)'
						}}
					/>
				</div>
			</div>
		</div>
	);
}