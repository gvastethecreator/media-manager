import { BrainIcon, HeartIcon, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GroupCardFooterProps {
	cardId?: string;
	category?: string;
	compact?: boolean;
	hp?: number;
	id: string;
	imagesCount?: number;
	isFavorite?: boolean;
	mp?: number;
	name: string;
	organizationType?: string;
	power?: number;
	primaryColor?: string;
	rarityLevel?: number;
	tcgMode?: boolean;
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
							<HeartIcon className="mr-1 h-4 w-4" style={{ color: primaryColor }} />
							<span className="font-semibold text-sm">{hp}</span>
						</div>

						{/* MP */}
						<div className="flex items-center">
							<BrainIcon className="mr-1 h-4 w-4" style={{ color: primaryColor }} />
							<span className="font-semibold text-sm">{mp}</span>
						</div>

						{/* Poder */}
						<div className="flex items-center rounded bg-muted/10 px-1">
							<span className="font-medium text-sm">{power}</span>
						</div>
					</div>

					{/* Segunda fila: metadatos (solo en modo completo) */}
					{!compact && (
						<div className="flex items-center justify-between">
							<div className="text-sm opacity-80">{organizationType}</div>
							<div className="text-sm opacity-80">{category}</div>
						</div>
					)}

					{/* Tercera fila: estrellas de rareza e info */}
					<div className="flex items-center justify-between">
						{/* Estrellas de rareza */}
						<div className="flex items-center">
							{Array.from({ length: rarity }).map((_, i) => (
								<Star
									className="h-4 w-4 fill-current"
									key={`rarity-${id}-${name}-${rarity}-${i + 1}`}
									style={{ color: primaryColor }}
								/>
							))}
						</div>

						{/* ID de carta y contadores */}
						<div className="flex items-center text-sm opacity-70">
							<span className="mr-2">{cardId}</span>

							{/* Contador de archivos multimedia */}
							{(imagesCount > 0 || videosCount > 0) && (
								<span className="flex items-center text-xs">🖼️ {imagesCount + videosCount}</span>
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
								<span className="text-sm">{organizationType}</span>
							</Badge>
						)}
						{category && category !== 'General' && (
							<Badge className="h-5 px-1" variant="outline">
								<span className="text-sm">{category}</span>
							</Badge>
						)}
					</div>

					{/* Información de archivos */}
					<div className="flex items-center space-x-2 text-muted-foreground text-sm">
						{isFavorite && <HeartIcon className="h-4 w-4 fill-rose-500 text-destructive" />}
						{imagesCount > 0 && <span>🖼️ {imagesCount}</span>}
						{videosCount > 0 && <span>🎬 {videosCount}</span>}
					</div>
				</div>
			)}
		</div>
	);
}
