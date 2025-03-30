import { cn } from '@/lib/utils';
import { FolderOutputIcon, HardDriveIcon, TimerResetIcon } from 'lucide-react';

interface FolderCardContentProps {
	description?: string | null;
	totalFiles: number;
	totalSize: number;
	lastIndexed?: Date | null;
	autoReindex?: boolean;
	childrenCount?: number;
	primaryColor: string;
	featuredImage?: string | null;
	tcgMode?: boolean;
}

/**
 * Componente para el contenido principal de la tarjeta de carpeta.
 * Diseñado con estilo de cuadro de texto de carta TCG.
 */
export function FolderCardContent({
	description,
	totalFiles,
	totalSize,
	lastIndexed,
	autoReindex = false,
	childrenCount = 0,
	primaryColor,
	featuredImage,
	tcgMode = true
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

	// Calcular puntaje de "poder" para la carpeta (estilo TCG)
	const powerScore = Math.min(99, Math.max(1,
		Math.floor((totalFiles * 0.3) + (childrenCount * 2) + (totalSize / 1000000))
	));

	return (
		<div
			className={cn(
				"flex-grow p-3 text-card-foreground relative overflow-hidden",
				tcgMode ? "bg-black/20" : "bg-card/90"
			)}
			style={{
				backgroundImage: featuredImage ? `url(${featuredImage})` : undefined,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundBlendMode: 'overlay'
			}}
		>
			{/* Overlay para mantener legibilidad sobre imagen */}
			{featuredImage && (
				<div className="absolute inset-0 bg-black/50 z-0" />
			)}

			{/* Contenido con posición relativa para estar sobre el overlay */}
			<div className="relative z-10 flex flex-col h-full">
				{/* Descripción de la carpeta (como texto de flavor en TCG) */}
				<div className="mb-3 flex-grow">
					{description ? (
						<div
							className={cn(
								"italic min-h-[3em]",
								tcgMode ?
									"text-white/90 bg-black/40 p-2 rounded-sm border border-white/10 shadow-inner text-sm" :
									"text-muted-foreground text-sm"
							)}
							style={tcgMode ? {} : { color: primaryColor }}
						>
							<p className="line-clamp-3">{description}</p>
						</div>
					) : (
						<div className={cn(
							"min-h-[3em] italic text-center flex items-center justify-center",
							tcgMode ? "text-white/50 bg-black/20 rounded-sm p-2" : "text-muted-foreground/50"
						)}>
							Sin descripción
						</div>
					)}
				</div>

				{/* Estadísticas de la carpeta (como caja de texto en TCG) */}
				<div
					className={cn(
						"pt-1 text-xs rounded-sm",
						tcgMode ?
							"border p-2 bg-black/30 shadow-inner border-white/10" :
							"border-t p-1",
					)}
					style={!tcgMode ? {
						borderColor: `${primaryColor}30`,
						backgroundColor: `${primaryColor}15`
					} : {}}
				>
					{/* Stats especiales para modo TCG */}
					{tcgMode && (
						<div className="flex justify-between items-center mb-2">
							<div className="flex flex-col">
								<span className="text-white/70 uppercase tracking-wide text-[0.65rem] mb-0.5">Poder</span>
								<div className="flex items-center">
									<div
										className="w-full bg-black/50 h-1.5 rounded-sm overflow-hidden"
										style={{ width: '60px' }}
									>
										<div
											className="h-full"
											style={{
												width: `${Math.min(100, powerScore)}%`,
												background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}cc)`
											}}
										/>
									</div>
									<span className="ml-1 font-bold text-white">{powerScore}</span>
								</div>
							</div>

							<div className="flex items-center">
								{autoReindex ? (
									<div
										className="py-0.5 px-1.5 rounded-sm bg-green-600/30 text-green-400 font-semibold text-[0.65rem] border border-green-500/20"
										title="Auto-reindexación activada"
									>
										AUTO
									</div>
								) : (
									<div
										className="py-0.5 px-1.5 rounded-sm bg-yellow-600/20 text-yellow-400 font-semibold text-[0.65rem] border border-yellow-500/20"
										title="Auto-reindexación desactivada"
									>
										MANUAL
									</div>
								)}
							</div>
						</div>
					)}

					{/* Datos principales en estilo de atributos de carta TCG */}
					<div className="grid grid-cols-2 gap-2">
						<div className="flex justify-between items-center">
							<span className={tcgMode ? "text-white/70 font-medium" : "text-muted-foreground"}>
								<FolderOutputIcon className="inline w-3 h-3 mr-1" />
								Archivos:
							</span>
							<span className={tcgMode ? "font-bold text-white" : "font-medium"}>
								{totalFiles}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className={tcgMode ? "text-white/70 font-medium" : "text-muted-foreground"}>
								<HardDriveIcon className="inline w-3 h-3 mr-1" />
								Tamaño:
							</span>
							<span className={tcgMode ? "font-bold text-white" : "font-medium"}>
								{formattedSize}
							</span>
						</div>
					</div>

					{/* Segunda fila de atributos */}
					<div className="grid grid-cols-2 gap-2 mt-1">
						<div className="flex justify-between items-center">
							<span className={tcgMode ? "text-white/70 font-medium" : "text-muted-foreground"}>
								Subcarpetas:
							</span>
							<span className={tcgMode ? "font-bold text-white" : "font-medium"}>
								{childrenCount}
							</span>
						</div>

						{!tcgMode && (
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Auto-Reindex:</span>
								<span className="font-medium">{autoReindex ? '✓' : '✗'}</span>
							</div>
						)}
					</div>

					{/* Última indexación */}
					<div
						className={cn(
							"flex justify-between items-center mt-1 pt-1",
							tcgMode ? "border-t border-white/10" : "border-t border-dashed"
						)}
						style={!tcgMode ? { borderColor: `${primaryColor}20` } : {}}
					>
						<span className={tcgMode ? "text-white/70 font-medium" : "text-muted-foreground"}>
							<TimerResetIcon className="inline w-3 h-3 mr-1" />
							Última indexación:
						</span>
						<span className={tcgMode ? "font-bold text-white" : "font-medium"}>
							{formattedLastIndexed}
						</span>
					</div>
				</div>
			</div>

			{/* Decoración de esquina estilo TCG */}
			{tcgMode && (
				<div
					className="absolute bottom-1 right-1 w-4 h-4 opacity-70"
					style={{ color: primaryColor }}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
						<path d="M22 8L16 2H8L2 8v8l6 6h8l6-6V8z" />
					</svg>
				</div>
			)}
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

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}