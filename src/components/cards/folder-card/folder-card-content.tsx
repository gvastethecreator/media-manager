import { FolderOutputIcon, HardDriveIcon, TimerResetIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface FolderCardContentProps {
	description?: string | null;
	totalFiles: number;
	totalSize: number;
	lastIndexed?: Date | null;
	childrenCount?: number;
	primaryColor: string;
	featuredImage?: string | null;
	tcgMode?: boolean;
}

/**
 * Componente para el contenido principal de la tarjeta de carpeta.
 * Diseñado con estilo de cuadro de texto de carta TCG.
 */
export const FolderCardContent = memo(function FolderCardContent({
	description,
	totalFiles,
	totalSize,
	lastIndexed,
	childrenCount = 0,
	primaryColor,
	featuredImage,
	tcgMode = true,
}: FolderCardContentProps) {
	// Memoize computed values to prevent unnecessary recalculations
	const computedStats = useMemo(() => {
		const formatBytes = (bytes: number) => {
			if (bytes === 0) return '0 B';
			const k = 1024;
			const sizes = ['B', 'KB', 'MB', 'GB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
		};

		return {
			formattedSize: formatBytes(totalSize),
			formattedDate: lastIndexed
				? new Date(lastIndexed).toLocaleDateString('es-ES', {
						day: '2-digit',
						month: '2-digit',
						year: '2-digit',
					})
				: null,
			hasContent: totalFiles > 0 || (description && description.length > 0),
		};
	}, [totalFiles, totalSize, lastIndexed, description]);

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
	const powerScore = useMemo(() => {
		return Math.min(99, Math.max(1, Math.floor(totalFiles * 0.3 + childrenCount * 2 + totalSize / 1_000_000)));
	}, [totalFiles, childrenCount, totalSize]);

	return (
		<div
			className={cn(
				'relative flex-grow overflow-hidden p-3 text-card-foreground',
				tcgMode ? 'bg-black/20' : 'bg-card/90'
			)}
			style={{
				backgroundImage: featuredImage ? `url(${featuredImage})` : undefined,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundBlendMode: 'overlay',
			}}
		>
			{/* Overlay para mantener legibilidad sobre imagen */}
			{featuredImage && <div className="absolute inset-0 z-0 bg-black/50" />}

			{/* Contenido con posición relativa para estar sobre el overlay */}
			<div className="relative z-10 flex h-full flex-col">
				{/* Descripción de la carpeta (como texto de flavor en TCG) */}
				<div className="mb-3 flex-grow">
					{description ? (
						<div
							className={cn(
								'min-h-[3em] italic',
								tcgMode
									? 'rounded-sm border border-white/10 bg-black/40 p-2 text-sm text-white/90 shadow-inner'
									: 'text-muted-foreground text-sm'
							)}
							style={tcgMode ? {} : { color: primaryColor }}
						>
							<p className="line-clamp-3">{description}</p>
						</div>
					) : (
						<div
							className={cn(
								'flex min-h-[3em] items-center justify-center text-center italic',
								tcgMode ? 'rounded-sm bg-black/20 p-2 text-white/50' : 'text-muted-foreground/50'
							)}
						>
							Sin descripción
						</div>
					)}
				</div>

				{/* Estadísticas de la carpeta (como caja de texto en TCG) */}
				<div
					className={cn(
						'rounded-sm pt-1 text-xs',
						tcgMode ? 'border border-white/10 bg-black/30 p-2 shadow-inner' : 'border-t p-1'
					)}
					style={
						tcgMode
							? {}
							: {
									borderColor: `${primaryColor}30`,
									backgroundColor: `${primaryColor}15`,
								}
					}
				>
					{/* Stats especiales para modo TCG */}
					{tcgMode && (
						<div className="mb-2 flex items-center justify-between">
							<div className="flex flex-col">
								<span className="mb-0.5 text-[0.65rem] text-white/70 uppercase tracking-wide">Poder</span>
								<div className="flex items-center">
									<div className="h-1.5 w-full overflow-hidden rounded-sm bg-black/50" style={{ width: '60px' }}>
										<div
											className="h-full"
											style={{
												width: `${Math.min(100, powerScore)}%`,
												background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}cc)`,
											}}
										/>
									</div>
									<span className="ml-1 font-bold text-white">{powerScore}</span>
								</div>
							</div>

							{/* Indicador AUTO/MANUAL eliminado por remoción de autoReindex */}
							<div className="flex items-center" />
						</div>
					)}

					{/* Datos principales en estilo de atributos de carta TCG */}
					<div className="grid grid-cols-2 gap-2">
						<div className="flex items-center justify-between">
							<span className={tcgMode ? 'font-medium text-white/70' : 'text-muted-foreground'}>
								<FolderOutputIcon className="mr-1 inline h-3 w-3" />
								Archivos:
							</span>
							<span className={tcgMode ? 'font-bold text-white' : 'font-medium'}>{totalFiles}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className={tcgMode ? 'font-medium text-white/70' : 'text-muted-foreground'}>
								<HardDriveIcon className="mr-1 inline h-3 w-3" />
								Tamaño:
							</span>
							<span className={tcgMode ? 'font-bold text-white' : 'font-medium'}>{computedStats.formattedSize}</span>
						</div>
					</div>

					{/* Segunda fila de atributos */}
					<div className="mt-1 grid grid-cols-2 gap-2">
						<div className="flex items-center justify-between">
							<span className={tcgMode ? 'font-medium text-white/70' : 'text-muted-foreground'}>Subcarpetas:</span>
							<span className={tcgMode ? 'font-bold text-white' : 'font-medium'}>{childrenCount}</span>
						</div>

						{/* Indicador Auto-Reindex eliminado */}
					</div>

					{/* Última indexación */}
					<div
						className={cn(
							'mt-1 flex items-center justify-between pt-1',
							tcgMode ? 'border-white/10 border-t' : 'border-t border-dashed'
						)}
						style={tcgMode ? {} : { borderColor: `${primaryColor}20` }}
					>
						<span className={tcgMode ? 'font-medium text-white/70' : 'text-muted-foreground'}>
							<TimerResetIcon className="mr-1 inline h-3 w-3" />
							Última indexación:
						</span>
						<span className={tcgMode ? 'font-bold text-white' : 'font-medium'}>{formattedLastIndexed}</span>
					</div>
				</div>
			</div>

			{/* Decoración de esquina estilo TCG */}
			{tcgMode && (
				<div className="absolute right-1 bottom-1 h-4 w-4 opacity-70" style={{ color: primaryColor }}>
					<svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
						<path d="M22 8L16 2H8L2 8v8l6 6h8l6-6V8z" />
					</svg>
				</div>
			)}
		</div>
	);
});
