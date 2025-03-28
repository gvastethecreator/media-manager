
interface FolderCardContentProps {
	description?: string | null;
	totalFiles: number;
	totalSize: number;
	lastIndexed?: Date | null;
	primaryColor: string;
}

/**
 * Componente para el contenido principal de la tarjeta de carpeta.
 * Similar al cuadro de texto de una carta Magic.
 */
export function FolderCardContent({
	description,
	totalFiles,
	totalSize,
	lastIndexed,
	primaryColor,
}: FolderCardContentProps) {
	// Formatear el tamaño en bytes a una unidad más legible
	const formattedSize = formatBytes(totalSize);

	// Formatear la fecha de última indexación
	const formattedLastIndexed = lastIndexed
		? new Intl.DateTimeFormat('es', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		}).format(new Date(lastIndexed))
		: 'Nunca';

	return (
		<div
			className="flex-grow p-3 text-card-foreground"
			style={{ backgroundColor: `${primaryColor}06` }}
		>
			{/* Descripción de la carpeta (como texto de flavor en Magic) */}
			{description ? (
				<div className="mb-3">
					<p className="text-sm italic line-clamp-3 min-h-[3em]" style={{ color: `${primaryColor}` }}>
						{description}
					</p>
				</div>
			) : (
				<div className="min-h-[3em]" />
			)}

			{/* Estadísticas de la carpeta (como caja de texto en Magic) */}
			<div className="pt-1 text-xs space-y-1.5 border-t" style={{ borderColor: `${primaryColor}30` }}>
				{/* Datos principales */}
				<div className="grid grid-cols-2 gap-2">
					<div className="flex justify-between items-center">
						<span className="text-muted-foreground">Archivos:</span>
						<span className="font-medium">{totalFiles}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-muted-foreground">Tamaño:</span>
						<span className="font-medium">{formattedSize}</span>
					</div>
				</div>

				{/* Última indexación */}
				<div className="flex justify-between items-center">
					<span className="text-muted-foreground">Última indexación:</span>
					<span className="font-medium">{formattedLastIndexed}</span>
				</div>
			</div>
		</div>
	);
}

/**
 * Función auxiliar para formatear bytes en un formato más legible
 */
function formatBytes(bytes: number, decimals = 1): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}