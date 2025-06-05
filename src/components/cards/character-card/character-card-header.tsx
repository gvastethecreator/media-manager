'use client';

import { cn } from '@/lib/utils';
import { Heart, Shield, Sparkles, Sword, Wand } from 'lucide-react';

interface CharacterCardHeaderProps {
	/** Nombre del personaje */
	name: string;
	/** Emoji que representa el personaje */
	emoji: string;
	/** Color principal para el tema */
	color: string;
	/** Si el personaje está marcado como favorito */
	isFavorite?: boolean;
	/** Clase del personaje (Warrior, Mage, etc.) */
	class?: string;
	/** Nivel del personaje */
	level?: number;
	/** Raza del personaje */
	race?: string;
	/** Si está en modo TCG con efectos especiales */
	tcgMode?: boolean;
	/** Si está en modo compacto */
	compact?: boolean;
}

/**
 * Componente para el encabezado de la tarjeta de personaje.
 * Diseñado como la parte superior de una carta TCG con el nombre,
 * clase, nivel y decoración especial, inspirado en juegos como
 * Magic, Yu-Gi-Oh y Pokémon.
 */
export function CharacterCardHeader({
	name,
	emoji,
	color,
	isFavorite = false,
	class: characterClass = 'Unknown',
	level = 1,
	race = 'Unknown',
	tcgMode = true,
	compact = false,
}: CharacterCardHeaderProps) {
	// Determinar icono según la clase
	const classIcon = () => {
		if (characterClass.toLowerCase().includes('warrior')) return <Sword className="w-3.5 h-3.5" />;
		if (characterClass.toLowerCase().includes('mage')) return <Wand className="w-3.5 h-3.5" />;
		if (characterClass.toLowerCase().includes('tank')) return <Shield className="w-3.5 h-3.5" />;
		return null;
	};

	return (
		<div className="relative">
			{/* Fondo del título con gradiente de color */}
			<div
				className="h-16 pt-2.5 px-3.5 flex items-center relative overflow-hidden"
				style={{
					background: `linear-gradient(90deg, ${color}95, ${color}70)`,
					borderBottom: `2px solid ${color}`,
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
						backgroundSize: '20px 20px, 20px 20px, 30px 30px',
					}}
				/>

				{/* Efecto holográfico de líneas */}
				<div
					className="absolute inset-0 opacity-15 pointer-events-none"
					style={{
						backgroundImage: `repeating-linear-gradient(90deg, ${color}, transparent 2px, transparent 4px)`,
						backgroundSize: '8px 100%',
						mixBlendMode: 'overlay',
					}}
				/>

				{/* Parte izquierda: Emoji y nombre */}
				<div className="flex items-center space-x-2 flex-1 relative z-10">
					{/* Emoji (como símbolo de energía/maná en TCG) */}
					<div
						className={cn(
							'text-xl flex-shrink-0 rounded-full flex items-center justify-center relative',
							tcgMode ? 'w-10 h-10' : 'w-8 h-8'
						)}
						style={{
							background: `radial-gradient(circle, ${color}30 0%, ${color}60 100%)`,
							boxShadow: `0 0 8px rgba(0,0,0,0.4), inset 0 0 5px ${color}`,
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

					{/* Nombre del personaje (como título de la carta) */}
					<div className="flex flex-col">
						<h3 className={cn('font-bold text-lg tracking-tight truncate', 'text-white drop-shadow-md')}>
							{name}
							{isFavorite && <Sparkles className="w-4 h-4 inline ml-1 -mt-1 text-yellow-200" />}
						</h3>

						{/* Subtítulo con clase y raza */}
						<div className="text-xs text-white/80 flex items-center gap-1">
							{classIcon()}
							<span className="truncate">
								{characterClass}
								{race && ` • ${race}`}
							</span>
						</div>
					</div>
				</div>

				{/* Parte derecha: Nivel y favorito */}
				<div className="flex-shrink-0 flex items-center gap-1 relative z-10">
					{isFavorite && (
						<span
							className="px-2 py-0.5 rounded-full flex items-center justify-center"
							style={{
								background: 'rgba(255, 255, 255, 0.3)',
								boxShadow: '0 0 10px rgba(255, 255, 255, 0.5), inset 0 0 3px rgba(255, 255, 255, 0.5)',
							}}
						>
							<Heart className="w-4 h-4 text-white fill-white" />
						</span>
					)}

					{/* Nivel del personaje en estilo TCG */}
					<div
						className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
						style={{
							background: `radial-gradient(circle, ${color} 0%, ${color}90 100%)`,
							boxShadow: `0 0 8px rgba(0,0,0,0.4), inset 0 0 5px ${color}60`,
						}}
					>
						{level}
					</div>
				</div>

				{/* Elementos decorativos de esquina estilo TCG */}
				<div
					className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-br-sm"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>
				<div
					className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-bl-sm"
					style={{ borderColor: 'rgba(255,255,255,0.3)' }}
				/>
			</div>

			{/* Tipo de la carta - similar a la línea de tipo en TCG */}
			<div
				className="text-xs text-white px-3.5 py-1.5 flex justify-between items-center relative"
				style={{
					borderBottom: `2px solid ${color}70`,
					background: 'linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.5))',
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
					{characterClass.toUpperCase()} • {race.toUpperCase()}
				</span>

				{/* Puntos de nivel como estrellas en estilo TCG */}
				<div className="flex items-center gap-0.5 mr-1">
					{Array.from({ length: Math.min(5, Math.ceil(level / 10)) }).map((_, i) => {
						const starValue = `${name}-star-${i + 1}`;
						return (
							<div
								key={starValue}
								className="w-3 h-3 rounded-full bg-yellow-300"
								style={{ boxShadow: '0 0 3px rgba(255, 255, 255, 0.7)' }}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}
