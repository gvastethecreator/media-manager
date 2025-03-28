import { ArrowUpDown, Globe, Tag } from 'lucide-react';

interface CollectionCardContentProps {
	description?: string | null;
	platform?: string | null;
	price?: number | null;
	editions?: string; // JSON string
	primaryColor: string;
}

/**
 * Componente para el contenido principal de la tarjeta de colección.
 * Similar al texto de reglas de una carta Magic.
 */
export function CollectionCardContent({
	description,
	platform,
	price,
	editions,
	primaryColor,
}: CollectionCardContentProps) {
	// Parsear las ediciones si están disponibles
	let parsedEditions: any[] = [];

	if (editions) {
		try {
			parsedEditions = JSON.parse(editions);
		} catch (error) {
			// Si hay un error de parsing, usar array vacío
			console.warn("Error parsing editions:", editions);
			parsedEditions = [];
		}
	}

	// Asegurar que parsedEditions sea un array
	if (!Array.isArray(parsedEditions)) {
		parsedEditions = [];
	}

	// Formatear precio
	const formattedPrice = price
		? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)
		: null;

	return (
		<div className="flex-grow p-3 overflow-y-auto scrollbar-thin" style={{ scrollbarColor: `${primaryColor} transparent` }}>
			{/* Contenedor con borde estilizado similar a las reglas de Magic */}
			<div
				className="h-full flex flex-col"
				style={{
					borderLeft: `1px solid ${primaryColor}20`,
					paddingLeft: '0.5rem',
				}}
			>
				{/* Descripción principal */}
				{description && (
					<div className="mb-2 text-xs leading-relaxed" style={{ color: `${primaryColor}DD` }}>
						<p className="italic">{description}</p>
					</div>
				)}

				{/* Plataforma */}
				{platform && (
					<div className="flex items-center gap-1 my-1 text-xs">
						<Globe className="w-3.5 h-3.5 text-muted-foreground" />
						<span className="font-medium">{platform}</span>
					</div>
				)}

				{/* Precio */}
				{formattedPrice && (
					<div className="flex items-center gap-1 my-1 text-xs">
						<Tag className="w-3.5 h-3.5 text-muted-foreground" />
						<span className="font-medium">{formattedPrice}</span>
					</div>
				)}

				{/* Ediciones disponibles */}
				{parsedEditions.length > 0 && (
					<div className="mt-2">
						<div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
							<ArrowUpDown className="w-3.5 h-3.5" />
							<span className="font-medium">Ediciones</span>
						</div>
						<ul className="text-xs pl-4 list-disc">
							{parsedEditions.slice(0, 3).map((edition: any, index: number) => (
								<li key={index} className="text-xs text-muted-foreground">
									<span className="font-medium">{edition.name}</span>
									{edition.date && (
										<span className="ml-1 text-muted-foreground">
											({new Date(edition.date).getFullYear()})
										</span>
									)}
								</li>
							))}
							{parsedEditions.length > 3 && (
								<li className="text-xs italic text-muted-foreground">
									...y {parsedEditions.length - 3} más
								</li>
							)}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}