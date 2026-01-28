import { BrainIcon, HeartIcon, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GroupCardFooterProps {
	id: string;
	name: string;
	isFavorite?: boolean;
	category?: string;
	organizationType?: string;
	power?: number;
	rarityLevel?: number;
	hp?: number;
	mp?: number;
	primaryColor?: string;
	cardId?: string;
	tcgMode?: boolean;
	compact?: boolean;
	imagesCount?: number;
	videosCount?: number;
}

/**
 * Componente para mostrar el pie de una tarjeta de grupo con estilo TCG
 */
export function GroupCardFooter({
	id,
	name,
	isFavorite = false,
	category = 'General',
	organizationType = 'Mixto',
	power = 0,
	rarityLevel = 1,
	hp = 100,
	mp = 60,
	primaryColor = 'var(--dt-primary-500)',
	cardId = '',
	tcgMode = true,
	compact = false,
	imagesCount = 0,
	videosCount = 0,
}: GroupCardFooterProps) {
	// Determinar estrellas de rareza a mostrar (1-5)
	const rarity = Math.max(1, Math.min(5, Math.ceil(rarityLevel / 2)));

	return (
		<div
			className={cn('px-3 py-2', tcgMode ? 'border-border/40 border-t' : '')}
			style={{
				background: tcgMode ? `linear-gradient(to top, ${primaryColor}20, transparent)` : undefined,
			}}
		>
			{tcgMode ? (
				<div className="flex flex-col space-y-2">
					{/* Primera fila: HP, MP y Poder */}
					<div className="flex items-center justify-between">
						{/* HP */}
						<div className="flex items-center">
							<HeartIcon className="mr-1 h-3.5 w-3.5" style={{ color: primaryColor }} />
							<span className="font-semibold text-xs">{hp}</span>
						</div>

						{/* MP */}
						<div className="flex items-center">
							<BrainIcon className="mr-1 h-3.5 w-3.5" style={{ color: primaryColor }} />
							<span className="font-semibold text-xs">{mp}</span>
						</div>

						{/* Poder */}
						<div className="flex items-center rounded bg-muted/10 px-1">
							<span className="font-medium text-xs">{power}</span>
						</div>
					</div>

					{/* Segunda fila: metadatos (solo en modo completo) */}
					{!compact && (
						<div className="flex items-center justify-between">
							<div className="text-xs opacity-80">{organizationType}</div>
							<div className="text-xs opacity-80">{category}</div>
						</div>
					)}

					{/* Tercera fila: estrellas de rareza e info */}
					<div className="flex items-center justify-between">
						{/* Estrellas de rareza */}
						<div className="flex items-center">
							{Array.from({ length: rarity }).map((_, i) => (
								<Star
									className="h-3 w-3 fill-current"
									key={`rarity-${id}-${name}-${rarity}-${i + 1}`}
									style={{ color: primaryColor }}
								/>
							))}
						</div>

						{/* ID de carta y contadores */}
						<div className="flex items-center text-xs opacity-70">
							<span className="mr-2">{cardId}</span>

							{/* Contador de archivos multimedia */}
							{(imagesCount > 0 || videosCount > 0) && (
								<span className="flex items-center text-[10px]">🖼️ {imagesCount + videosCount}</span>
							)}
						</div>
					</div>
				</div>
			) : (
				// Versión no-TCG simplificada
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						{organizationType && (
							<Badge className="mr-1 h-5 px-1" variant="outline">
								<span className="text-xs">{organizationType}</span>
							</Badge>
						)}
						{category && category !== 'General' && (
							<Badge className="h-5 px-1" variant="outline">
								<span className="text-xs">{category}</span>
							</Badge>
						)}
					</div>

					{/* Información de archivos */}
					<div className="flex items-center space-x-2 text-muted-foreground text-xs">
						{isFavorite && <HeartIcon className="h-3.5 w-3.5 fill-rose-500 text-destructive" />}
						{imagesCount > 0 && <span>🖼️ {imagesCount}</span>}
						{videosCount > 0 && <span>🎬 {videosCount}</span>}
					</div>
				</div>
			)}
		</div>
	);
}
