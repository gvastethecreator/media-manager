import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Album } from '@/types/entities/album';

interface AlbumCardHeaderProps {
	album: Album;
	primaryColor: string;
	compact?: boolean;
}

/**
 * Cabecera para la tarjeta de álbum con nombre, emoji y categoría
 */
export function AlbumCardHeader({ album, primaryColor, compact = false }: AlbumCardHeaderProps) {
	const { name, emoji, category, isFavorite } = album;

	return (
		<header
			className={cn('relative px-3 py-2 flex items-center gap-3 z-20', compact ? 'pb-1' : 'border-b border-white/10')}
		>
			{/* Emoji o imagen del álbum */}
			{emoji && (
				<div
					className={cn(
						'flex-shrink-0 flex items-center justify-center bg-background/20 rounded-full overflow-hidden',
						compact ? 'w-8 h-8' : 'w-10 h-10'
					)}
					style={{ backgroundColor: `${primaryColor}40` }}
				>
					<span className={cn('text-2xl', compact && 'text-xl')}>{emoji}</span>
				</div>
			)}

			{/* Texto y categoría */}
			<div className="flex-1 overflow-hidden">
				<h3 className={cn('font-bold text-foreground truncate', compact ? 'text-sm' : 'text-base')}>{name}</h3>
				{category && !compact && <p className="text-xs text-muted-foreground truncate">{category}</p>}
			</div>

			{/* Indicador de favorito */}
			{isFavorite && (
				<div className="flex-shrink-0">
					<Heart className="h-4 w-4 text-destructive fill-destructive" aria-label="Favorito" />
				</div>
			)}

			{/* Sello de rareza holográfico cuando es favorito */}
			{isFavorite && (
				<div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
					<div
						className="absolute top-0 right-0 w-24 h-24 rotate-45 translate-x-12 -translate-y-8 opacity-70"
						style={{
							background: `linear-gradient(45deg, transparent 30%, ${primaryColor} 40%, gold 50%, ${primaryColor} 60%, transparent 70%)`,
							backgroundSize: '600% 600%',
							animation: 'shine 3s linear infinite',
						}}
					/>
				</div>
			)}
		</header>
	);
}
