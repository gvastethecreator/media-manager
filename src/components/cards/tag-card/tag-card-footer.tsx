import { cn } from '@/lib/utils';
import { TagRarity } from '@/types/entities/tag/enums';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Heart, Image, Video } from 'lucide-react';

interface TagCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount: number;
	videosCount?: number;
	primaryColor: string;
	secondaryColor: string;
	rarity?: TagRarity;
	isFavorite?: boolean;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * Componente para el pie de la tarjeta de etiqueta.
 * Similar a la parte inferior de una carta TCG con estadísticas.
 */
export function TagCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	videosCount = 0,
	primaryColor,
	secondaryColor,
	rarity = TagRarity.COMMON,
	isFavorite = false,
	tcgMode = true,
	compact = false
}: TagCardFooterProps) {
	// Formatear fechas
	const formattedCreated = format(new Date(createdAt), 'dd/MM/yy', { locale: es });
	const formattedUpdated = format(new Date(updatedAt), 'dd/MM/yy', { locale: es });

	// Configuración visual basada en rareza
	const rarityConfig = {
		[TagRarity.COMMON]: { glow: 0, text: 'Común' },
		[TagRarity.UNCOMMON]: { glow: 3, text: 'Poco común' },
		[TagRarity.RARE]: { glow: 5, text: 'Rara' },
		[TagRarity.EPIC]: { glow: 7, text: 'Épica' },
		[TagRarity.LEGENDARY]: { glow: 10, text: 'Legendaria' }
	};

	const { glow } = rarityConfig[rarity as keyof typeof rarityConfig] || rarityConfig[TagRarity.COMMON];

	return (
		<div
			className={cn(
				"border-t",
				compact ? "p-2" : "p-3"
			)}
			style={{ borderColor: `${primaryColor}30` }}
		>
			{/* Pie de la carta */}
			<div className="flex items-center justify-between">
				{/* Parte izquierda - Contador de imágenes */}
				<div className="flex items-center gap-1.5">
					<div
						className={cn(
							"text-sm font-bold bg-black/20 rounded px-2 py-1 flex items-center gap-1",
							tcgMode && "border"
						)}
						style={{
							borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
							background: tcgMode
								? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`
								: 'rgba(0,0,0,0.1)',
							boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}60` : 'none'
						}}
					>
						{/* El contador de imágenes */}
						<Image className="w-3.5 h-3.5" />
						<span className="text-foreground">{imagesCount}</span>
					</div>

					{/* Contador de videos */}
					{videosCount > 0 && (
						<div
							className={cn(
								"text-sm font-bold bg-black/20 rounded px-2 py-1 flex items-center gap-1",
								tcgMode && "border"
							)}
							style={{
								borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
								background: tcgMode
									? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`
									: 'rgba(0,0,0,0.1)',
								boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}60` : 'none'
							}}
						>
							<Video className="w-3.5 h-3.5" />
							<span className="text-foreground">{videosCount}</span>
						</div>
					)}
				</div>

				{/* Parte derecha - Favorito */}
				{isFavorite && (
					<div
						className={cn(
							"flex items-center gap-1 bg-black/10 px-2 py-1 rounded-sm",
							tcgMode && "border border-red-900/20"
						)}
						style={{
							color: 'rgb(239, 68, 68)',
							boxShadow: tcgMode ? '0 0 5px rgba(239, 68, 68, 0.3)' : 'none'
						}}
					>
						<Heart className="w-3.5 h-3.5 fill-current" />
						<span className="text-xs font-medium uppercase tracking-wide">Fav</span>
					</div>
				)}
			</div>

			{/* Información adicional - Similar a la línea de coleccionista en cartas TCG */}
			<div className={cn(
				"flex items-center justify-between text-xs text-muted-foreground",
				compact ? "mt-1.5" : "mt-2"
			)}>
				{/* Fecha de creación */}
				<div className="flex items-center gap-1">
					<Calendar className="w-3 h-3" />
					<span className="opacity-70 mr-1">Creado:</span>
					<span className="font-medium">{formattedCreated}</span>
				</div>

				{/* Fecha de actualización */}
				<div className="flex items-center gap-1">
					<Clock className="w-3 h-3" />
					<span className="opacity-70 mr-1">Act:</span>
					<span className="font-medium">{formattedUpdated}</span>
				</div>
			</div>

			{/* Línea de colección */}
			{tcgMode && (
				<div className={cn(
					"text-xs text-center text-muted-foreground italic",
					compact ? "mt-0.5" : "mt-1"
				)} style={{ opacity: 0.7 }}>
					♦ Colección personal ♦
				</div>
			)}
		</div>
	);
}