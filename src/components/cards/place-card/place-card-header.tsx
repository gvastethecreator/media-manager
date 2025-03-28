'use client';

import { Cloud, Globe, Heart, MapPin } from 'lucide-react';

interface PlaceCardHeaderProps {
	name: string;
	emoji: string;
	region: string;
	type: string;
	climate: string;
	primaryColor: string;
	secondaryColor: string;
	isFavorite?: boolean;
}

/**
 * Componente de encabezado para la tarjeta de lugar
 * Muestra el nombre, emoji, región, tipo y clima del lugar
 */
export function PlaceCardHeader({
	name,
	emoji,
	region,
	type,
	climate,
	primaryColor,
	secondaryColor,
	isFavorite = false,
}: PlaceCardHeaderProps) {
	// Formatear el clima para mostrar
	const getClimateDisplay = (climate: string) => {
		if (!climate || climate === 'unknown') return 'Desconocido';

		// Si es una palabra simple, la capitalizamos
		if (!climate.includes(' ')) {
			return climate.charAt(0).toUpperCase() + climate.slice(1).toLowerCase();
		}

		// Si tiene varias palabras, devolvemos como está
		return climate;
	};

	return (
		<div
			className="flex flex-col w-full px-2.5 pt-1.5 pb-1.5 border-b"
			style={{
				borderColor: `${primaryColor}60`,
				background: `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}40)`,
			}}
		>
			<div className="flex items-center justify-between">
				{/* Nombre del lugar */}
				<h3
					className="text-lg font-bold truncate flex-1"
					style={{ color: `${primaryColor}` }}
				>
					{name}
				</h3>

				{/* Tipo de lugar a la derecha */}
				<div
					className="text-xs font-semibold px-1.5 rounded-sm"
					style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
				>
					{type}
				</div>
			</div>

			{/* Segunda línea: emoji y región/clima */}
			<div className="flex items-center justify-between mt-1.5">
				{/* Emoji del lugar */}
				<div className="flex-shrink-0 mr-1.5 text-xl">{emoji}</div>

				{/* Información de región y clima con iconos */}
				<div className="flex flex-1 justify-between text-xs">
					<div className="flex items-center">
						<MapPin size={12} className="mr-1" />
						<span className="text-muted-foreground">{region}</span>
					</div>

					<div className="flex items-center ml-2">
						<Cloud size={12} className="mr-1" />
						<span className="text-muted-foreground">{getClimateDisplay(climate)}</span>
					</div>

					{/* Región/continente */}
					<div className="flex items-center ml-2">
						<Globe
							size={12}
							className="mr-1"
						/>
						<span className="text-muted-foreground truncate max-w-[60px]">
							{region}
						</span>
					</div>
				</div>

				{/* Indicador de favorito */}
				{isFavorite && (
					<Heart
						size={16}
						className="ml-1.5 fill-current"
						style={{ color: '#ef4444' }}
					/>
				)}
			</div>
		</div>
	);
}