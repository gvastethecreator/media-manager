
interface AlbumCardContentProps {
	description?: string | null;
	sortBy?: string;
	filters?: string;
	primaryColor: string;
}

/**
 * Componente para el contenido principal de la tarjeta de álbum.
 * Similar al cuadro de texto de una carta Magic.
 */
export function AlbumCardContent({
	description,
	sortBy,
	filters,
	primaryColor,
}: AlbumCardContentProps) {
	// Analizar filtros para mostrarlos de forma legible
	let parsedFilters: Record<string, any> = {};

	if (filters && filters !== 'empty_array') {
		try {
			parsedFilters = JSON.parse(filters);
		} catch (e) {
			// Si no se puede parsear, ignorarlo
			console.error('Error al parsear filtros:', e);
		}
	}

	// Determinar el método de ordenación para mostrar en texto
	const getSortByText = (sortBy?: string): string => {
		if (!sortBy) return 'Por defecto';

		switch (sortBy) {
			case 'name':
				return 'Nombre';
			case 'createdAt':
				return 'Fecha de creación';
			case 'updatedAt':
				return 'Última modificación';
			case 'size':
				return 'Tamaño';
			default:
				return sortBy;
		}
	};

	return (
		<div
			className="flex-grow p-3 text-card-foreground"
			style={{ backgroundColor: `${primaryColor}06` }}
		>
			{/* Descripción del álbum (como texto de flavor en Magic) */}
			{description ? (
				<div className="mb-3">
					<p className="text-sm italic line-clamp-3 min-h-[3em]" style={{ color: `${primaryColor}` }}>
						{description}
					</p>
				</div>
			) : (
				<div className="min-h-[3em]" />
			)}

			{/* Estadísticas del álbum (como caja de texto en Magic) */}
			<div className="pt-1 text-xs space-y-1.5 border-t" style={{ borderColor: `${primaryColor}30` }}>
				{/* Datos de ordenación y filtros */}
				<div className="flex justify-between items-center">
					<span className="text-muted-foreground">Ordenación:</span>
					<span className="font-medium">{getSortByText(sortBy)}</span>
				</div>

				{/* Mostrar algunos filtros si existen */}
				{Object.keys(parsedFilters).length > 0 && (
					<div className="flex flex-wrap gap-1 mt-1">
						{Object.keys(parsedFilters).slice(0, 3).map(key => (
							<span
								key={key}
								className="text-xs px-1.5 py-0.5 rounded-sm bg-muted/50"
								style={{ borderLeft: `2px solid ${primaryColor}` }}
							>
								{key}
							</span>
						))}
						{Object.keys(parsedFilters).length > 3 && (
							<span className="text-xs opacity-70">+{Object.keys(parsedFilters).length - 3} más</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}