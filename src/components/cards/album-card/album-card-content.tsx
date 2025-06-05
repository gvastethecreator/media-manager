'use client';

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
	const filters =
		typeof album.filters === 'string' && album.filters !== 'empty_array'
			? JSON.parse(album.filters)
			: album.filters || [];

	return (
		<div className="px-3 py-2 flex-shrink-0">
			{/* Descripción principal */}
			{album.description && (
				<p className={cn('text-xs text-muted-foreground line-clamp-2 mb-2', tcgMode && 'italic')}>
					{album.description}
				</p>
			)}

			{/* Datos principales */}
			<div className="grid grid-cols-2 gap-2 mb-2">
				{/* Contadores */}
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">Imágenes:</span>
						<span className="text-xs font-medium">{imagesCount}</span>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">Videos:</span>
						<span className="text-xs font-medium">{videosCount}</span>
					</div>

					{album.shortcut && (
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">Atajo:</span>
							<span className="text-xs font-mono bg-muted px-1.5 rounded">{album.shortcut}</span>
						</div>
					)}
				</div>

				{/* Barra de datos estilo TCG */}
				{tcgMode && (
					<div className="flex flex-col gap-1">
						{/* Barra de progreso estilo TCG - Porcentaje de imágenes */}
						<div className="flex flex-col">
							<div className="flex justify-between items-center mb-1">
								<span className="text-xs text-muted-foreground">Imágenes</span>
								<span className="text-xs font-medium">
									{imagesCount}/{imagesCount + videosCount}
								</span>
							</div>
							<div className="h-2 bg-background/30 rounded-full overflow-hidden">
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
							<div className="flex justify-between items-center mb-1">
								<span className="text-xs text-muted-foreground">Videos</span>
								<span className="text-xs font-medium">
									{videosCount}/{imagesCount + videosCount}
								</span>
							</div>
							<div className="h-2 bg-background/30 rounded-full overflow-hidden">
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
					<p className="text-xs font-medium mb-1">Filtros activos:</p>
					<div className="flex flex-wrap gap-1">
						{filters.slice(0, 3).map((filter: any) => (
							<span
								key={`filter-${filter.field || filter.type || 'unknown'}-${filter.value || ''}`}
								className="text-[10px] bg-background/40 px-1.5 py-0.5 rounded"
							>
								{filter.field || filter.type}
							</span>
						))}
						{filters.length > 3 && (
							<span className="text-[10px] bg-background/40 px-1.5 py-0.5 rounded">+{filters.length - 3} más</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
