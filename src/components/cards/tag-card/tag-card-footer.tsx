import { Calendar, Clock, Heart, Image, Video } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';
import { TagRarity } from '@/store/entities/tag/types';

// Componente para contador individual
function Counter({
	icon,
	count,
	tcgMode,
	primaryColor,
	secondaryColor,
	glow,
}: {
	icon: React.ReactNode;
	count: number;
	tcgMode: boolean;
	primaryColor: string;
	secondaryColor: string;
	glow: number;
}) {
	return (
		<div
			className={cn('flex items-center gap-1 rounded bg-muted/20 px-2 py-1 font-bold text-sm', tcgMode && 'border')}
			style={{
				borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
				background: tcgMode
					? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}30)`
					: 'var(--dt-shadow-color)',
				boxShadow: tcgMode && glow > 0 ? `0 0 ${glow}px ${primaryColor}60` : 'none',
			}}
		>
			{icon}
			<span className="text-foreground">{count}</span>
		</div>
	);
}

// Componente para favorito
function FavoriteIndicator({ isFavorite, tcgMode }: { isFavorite: boolean; tcgMode: boolean }) {
	if (!isFavorite) {
		return null;
	}

	return (
		<div
			className={cn('flex items-center gap-1 rounded-sm bg-muted/10 px-2 py-1', tcgMode && 'border border-red-900/20')}
			style={{
				color: 'var(--ui-error-text)',
				boxShadow: tcgMode ? '0 0 5px color-mix(in oklch, var(--ui-error-text), transparent 70%)' : 'none',
			}}
		>
			<Heart className="h-4 w-4 fill-current" />
			<span className="font-medium text-sm uppercase tracking-wide">Fav</span>
		</div>
	);
}

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
	compact = false,
}: TagCardFooterProps) {
	// Extraer configuración visual de rareza
	const raritySettings = (() => {
		const configMap = {
			[TagRarity.COMMON]: { glow: 0, text: 'Común' },
			[TagRarity.UNCOMMON]: { glow: 3, text: 'Poco común' },
			[TagRarity.RARE]: { glow: 5, text: 'Rara' },
			[TagRarity.VERY_RARE]: { glow: 7, text: 'Muy Rara' },
			[TagRarity.LEGENDARY]: { glow: 10, text: 'Legendaria' },
		};

		return configMap[rarity as keyof typeof configMap] || configMap[TagRarity.COMMON];
	})();

	// Formatear fechas
	const formattedCreated = formatDate(new Date(createdAt), 'dd/MM/yy');
	const formattedUpdated = formatDate(new Date(updatedAt), 'dd/MM/yy');

	const { glow } = raritySettings;

	return (
		<div className={cn('border-t', compact ? 'p-2' : 'p-3')} style={{ borderColor: `${primaryColor}30` }}>
			{/* Pie de la carta */}
			<div className="flex items-center justify-between">
				{/* Parte izquierda - Contador de imágenes */}
				<div className="flex items-center gap-1.5">
					<Counter
						count={imagesCount}
						glow={glow}
						icon={<Image className="h-4 w-4" />}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tcgMode={tcgMode}
					/>

					{/* Contador de videos */}
					{videosCount > 0 && (
						<Counter
							count={videosCount}
							glow={glow}
							icon={<Video className="h-4 w-4" />}
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							tcgMode={tcgMode}
						/>
					)}
				</div>

				{/* Parte derecha - Favorito */}
				<FavoriteIndicator isFavorite={isFavorite} tcgMode={tcgMode} />
			</div>

			{/* Información adicional - Similar a la línea de coleccionista en cartas TCG */}
			<div
				className={cn('flex items-center justify-between text-muted-foreground text-sm', compact ? 'mt-1.5' : 'mt-2')}
			>
				{/* Fecha de creación */}
				<div className="flex items-center gap-1">
					<Calendar className="h-4 w-4" />
					<span className="mr-1 opacity-70">Creado:</span>
					<span className="font-medium">{formattedCreated}</span>
				</div>

				{/* Fecha de actualización */}
				<div className="flex items-center gap-1">
					<Clock className="h-4 w-4" />
					<span className="mr-1 opacity-70">Act:</span>
					<span className="font-medium">{formattedUpdated}</span>
				</div>
			</div>

			{/* Línea de colección */}
			{tcgMode && (
				<div
					className={cn('text-center text-muted-foreground text-sm italic', compact ? 'mt-0.5' : 'mt-1')}
					style={{ opacity: 0.7 }}
				>
					♦ Colección personal ♦
				</div>
			)}
		</div>
	);
}
