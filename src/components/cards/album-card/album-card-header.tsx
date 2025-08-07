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
			className={cn('relative z-20 flex items-center gap-3 px-3 py-2', compact ? 'pb-1' : 'border-white/10 border-b')}
		>
			{/* Emoji o imagen del álbum */}
			{emoji && (
				<div
					className={cn(
						'flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-background/20',
						compact ? 'h-8 w-8' : 'h-10 w-10'
					)}
					style={{ backgroundColor: `${primaryColor}40` }}
				>
					<span className={cn('text-2xl', compact && 'text-xl')}>{emoji}</span>
				</div>
			)}

			{/* Texto y categoría */}
			<div className="flex-1 overflow-hidden">
				<h3 className={cn('truncate font-bold text-foreground', compact ? 'text-sm' : 'text-base')}>{name}</h3>
				{category && !compact && <p className="truncate text-muted-foreground text-xs">{category}</p>}
			</div>

			{/* Indicador de favorito */}
			{isFavorite && (
				<div className="flex-shrink-0">
					<Heart aria-label="Favorito" className="h-4 w-4 fill-destructive text-destructive" />
				</div>
			)}

			{/* Sello de rareza holográfico cuando es favorito */}
			{isFavorite && (
				<div className="pointer-events-none absolute top-0 right-0 z-30 h-24 w-24 overflow-hidden">
					<div
						className="-translate-y-8 absolute top-0 right-0 h-24 w-24 translate-x-12 rotate-45 opacity-70"
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
