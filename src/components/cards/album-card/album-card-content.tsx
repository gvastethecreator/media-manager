import { cn } from '@/lib/utils';
import type { Album } from '@/types/entities/album';

interface AlbumCardContentProps {
	album: Album;
	imagesCount: number;
	videosCount: number;
	primaryColor: string;
	tcgMode?: boolean;
}

/**
 * Contenido principal de la tarjeta de álbum
 */
export function AlbumCardContent({
	album,
	imagesCount,
	videosCount,
	primaryColor,
	tcgMode = false,
}: AlbumCardContentProps) {
	// Parsear los filtros si están almacenados como JSON string
	let filters: any[] = [];
	if (album.filters === 'empty_array') {
		filters = [];
	} else if (typeof album.filters === 'string') {
		try {
			filters = JSON.parse(album.filters) || [];
		} catch {
			filters = [];
		}
	} else if (Array.isArray(album.filters)) {
		filters = album.filters;
	}

	return (
		<div className="flex-shrink-0 px-3 py-2">
			{/* Descripción principal */}
			{album.description && (
				<p className={cn('mb-2 line-clamp-2 text-muted-foreground text-xs', tcgMode && 'italic')}>
					{album.description}
				</p>
			)}

			{/* Datos principales */}
			<div className="mb-2 grid grid-cols-2 gap-2">
				{/* Contadores */}
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs">Imágenes:</span>
						<span className="font-medium text-xs">{imagesCount}</span>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs">Videos:</span>
						<span className="font-medium text-xs">{videosCount}</span>
					</div>

					{album.shortcut && (
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-xs">Atajo:</span>
							<span className="rounded bg-muted px-1.5 font-mono text-xs">{album.shortcut}</span>
						</div>
					)}
				</div>

				{/* Barra de datos estilo TCG */}
				{tcgMode && (
					<div className="flex flex-col gap-1">
						{/* Barra de progreso estilo TCG - Porcentaje de imágenes */}
						<div className="flex flex-col">
							<div className="mb-1 flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Imágenes</span>
								<span className="font-medium text-xs">
									{imagesCount}/{imagesCount + videosCount}
								</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-background/30">
								<div
									className="h-full rounded-full"
									style={{
										width: `${imagesCount === 0 ? 0 : (imagesCount / (imagesCount + videosCount)) * 100}%`,
										background: `linear-gradient(to right, ${primaryColor}60, ${primaryColor})`,
									}}
								/>
							</div>
						</div>

						{/* Barra de progreso estilo TCG - Porcentaje de videos */}
						<div className="flex flex-col">
							<div className="mb-1 flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Videos</span>
								<span className="font-medium text-xs">
									{videosCount}/{imagesCount + videosCount}
								</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-background/30">
								<div
									className="h-full rounded-full"
									style={{
										width: `${videosCount === 0 ? 0 : (videosCount / (imagesCount + videosCount)) * 100}%`,
										background: `linear-gradient(to right, ${primaryColor}60, ${primaryColor})`,
									}}
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Filtros si existen */}
			{filters.length > 0 && (
				<div className="mb-2">
					<p className="mb-1 font-medium text-xs">Filtros activos:</p>
					<div className="flex flex-wrap gap-1">
						{filters.slice(0, 3).map((filter: any) => (
							<span
								className="rounded bg-background/40 px-1.5 py-0.5 text-[10px]"
								key={`filter-${filter.field || filter.type || 'unknown'}-${filter.value || ''}`}
							>
								{filter.field || filter.type}
							</span>
						))}
						{filters.length > 3 && (
							<span className="rounded bg-background/40 px-1.5 py-0.5 text-[10px]">+{filters.length - 3} más</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
