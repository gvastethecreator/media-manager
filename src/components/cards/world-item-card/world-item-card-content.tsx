import { Info, Sparkles, Star } from 'lucide-react';

interface WorldItemCardContentProps {
	description?: string | null;
	properties?: string | null;
	requirements?: string | null;
	origin?: string | null;
	rarity?: string | null;
	primaryColor: string;
}

/**
 * Componente para el contenido principal de una tarjeta de objeto del mundo.
 * Similar al cuadro de texto de una carta Magic.
 */
export function WorldItemCardContent({
	description,
	properties = '[]',
	requirements = '{}',
	origin,
	rarity = 'común',
	primaryColor
}: WorldItemCardContentProps) {
	// Parsear propiedades si es un string, con manejo seguro de JSON inválido
	const parsedProperties = (() => {
		if (typeof properties !== 'string') {
			return properties || [];
		}

		if (!properties || properties === 'empty_array') {
			return [];
		}

		try {
			return JSON.parse(properties);
		} catch (error) {
			console.error('Error al parsear propiedades:', error);
			return [];
		}
	})();

	return (
		<div className="p-3 bg-card/80 flex-1 overflow-hidden flex flex-col">
			{/* Sección de información básica */}
			<div className="mb-2 flex justify-between items-center">
				<div className="text-xs uppercase tracking-wider font-medium" style={{ color: primaryColor }}>
					Información
				</div>
				{rarity && (
					<div className="flex items-center text-xs opacity-70">
						<Star className="h-3 w-3 mr-1" />
						<span className="capitalize">{rarity}</span>
					</div>
				)}
			</div>

			{/* Descripción del objeto */}
			<div className="mb-2 text-muted-foreground" style={{ fontSize: '0.8rem', lineHeight: '1.25rem' }}>
				{description ? (
					<div className="overflow-hidden line-clamp-4">
						{description}
					</div>
				) : (
					<div className="italic opacity-70 text-center py-1">
						Sin descripción
					</div>
				)}
			</div>

			{/* Propiedades del objeto (si hay) */}
			{Array.isArray(parsedProperties) && parsedProperties.length > 0 && (
				<div className="mt-1">
					<div className="flex items-center gap-1 text-xs opacity-70 mb-1">
						<Sparkles className="h-3.5 w-3.5" />
						<span>Propiedades</span>
					</div>
					<div className="flex flex-wrap gap-1">
						{parsedProperties.map((prop: string, index: number) => (
							<span
								key={index}
								className="text-xs px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary"
								style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
							>
								{prop}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Origen (si hay) */}
			{origin && (
				<div className="mt-2 text-xs flex items-center">
					<Info className="h-3.5 w-3.5 mr-1 opacity-70" />
					<span className="opacity-80">Origen: <span className="font-medium">{origin}</span></span>
				</div>
			)}
		</div>
	);
}