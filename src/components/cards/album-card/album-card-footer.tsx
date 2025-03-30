'use client';

import { cn } from '@/lib/utils';
import type { Album } from '@/types/entities/album';

interface AlbumCardFooterProps {
	album: Album;
	totalEntities: number;
	cardId: string;
	rarityLevel: string;
	tcgMode?: boolean;
	primaryColor: string;
}

/**
 * Pie de la tarjeta de álbum con estadísticas e información adicional
 */
export function AlbumCardFooter({
	album,
	totalEntities,
	cardId,
	rarityLevel,
	tcgMode = false,
	primaryColor
}: AlbumCardFooterProps) {
	// Formatear el tamaño en MB
	const formatSize = (bytes?: number): string => {
		if (!bytes) return '0 MB';
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	return (
		<footer className="p-2 text-xs border-t border-white/10 relative">
			{/* Id de carta y contenido tipo TCG */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-1">
					<span className="text-muted-foreground">ID:</span>
					<span className="font-mono">{cardId}</span>
				</div>

				<div className="flex items-center gap-1">
					<span className="text-muted-foreground">Tamaño:</span>
					<span>{formatSize(album.totalSize)}</span>
				</div>
			</div>

			{/* Estadísticas adicionales */}
			<div className="flex justify-between items-center mt-1">
				<div className="flex items-center gap-1">
					<span className="text-muted-foreground">Entidades:</span>
					<span>{totalEntities}</span>
				</div>

				<div className="flex items-center gap-1">
					<span className="text-muted-foreground">Actualizado:</span>
					<span>{new Date(album.updatedAt).toLocaleDateString()}</span>
				</div>
			</div>

			{/* Rareza - solo visible en modo TCG */}
			{tcgMode && (
				<div
					className={cn(
						"absolute bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-medium z-20",
						rarityLevel === 'Mítica' && "bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500 text-white",
						rarityLevel === 'Rara' && "bg-gradient-to-r from-indigo-500 to-purple-600 text-white",
						rarityLevel === 'Poco común' && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
						rarityLevel === 'Común' && "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
					)}
				>
					{rarityLevel}
				</div>
			)}

			{/* Sello de rareza holográfico cuando es favorito - solo visible en modo TCG */}
			{tcgMode && album.isFavorite && (
				<div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
					<div className="absolute top-0 right-0 w-24 h-24 rotate-45 translate-x-12 -translate-y-8 opacity-70"
						style={{
							background: `linear-gradient(45deg, transparent 30%, ${primaryColor} 40%, gold 50%, ${primaryColor} 60%, transparent 70%)`,
							backgroundSize: '600% 600%',
							animation: 'shine 3s linear infinite'
						}}
					/>
				</div>
			)}
		</footer>
	);
}