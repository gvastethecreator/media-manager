import { BookOpen, Heart, Sparkles, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagCategory, TagRarity } from '@/store/entities/tag/types';

export interface TagCardHeaderProps {
	name: string;
	emoji: string;
	color: string;
	category?: string | null | TagCategory;
	rarity?: string | TagRarity;
	isFavorite?: boolean;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * Componente para el encabezado de la tarjeta de etiqueta.
 * Similar al encabezado de una carta TCG con el nombre y rareza.
 */
export function TagCardHeader({
	name,
	emoji,
	color,
	category,
	rarity = TagRarity.COMMON,
	isFavorite = false,
	tcgMode = true,
	compact = false,
}: TagCardHeaderProps) {
	// Mapeo de rareza a texto legible
	const rarityText = {
		[TagRarity.COMMON]: 'Común',
		[TagRarity.UNCOMMON]: 'Poco común',
		[TagRarity.RARE]: 'Rara',
		[TagRarity.VERY_RARE]: 'Muy Rara',
		[TagRarity.LEGENDARY]: 'Legendaria',
	};

	// Obtener el texto de rareza
	const rarityLabel = rarityText[rarity as keyof typeof rarityText] || 'Común';

	// Estilo especial para el encabezado de etiquetas, con un diseño más distintivo
	return (
		<div className="relative">
			{/* Encabezado distintivo de etiqueta */}
			<div
				className={cn('flex items-center justify-between', compact ? 'px-3 py-2' : 'px-3.5 py-2.5')}
				style={{
					background: tcgMode ? `linear-gradient(135deg, ${color}90, ${color}70)` : `${color}80`,
					borderBottom: `1px solid ${color}`,
				}}
			>
				{/* Parte izquierda: Emoji y nombre */}
				<div className="flex max-w-[75%] items-center gap-2">
					{/* Emoji con estilo de tag */}
					<div
						className={cn('flex items-center justify-center rounded-full text-lg', compact ? 'h-6 w-6' : 'h-7 w-7')}
						style={{
							background: 'rgba(var(--effect-highlight-rgb), 0.25)',
							boxShadow: `0 0 8px ${color}40`,
						}}
					>
						{emoji}
					</div>

					{/* Nombre de la etiqueta */}
					<h3 className={cn('truncate font-bold text-white', compact ? 'text-base' : 'text-lg', 'drop-shadow-sm')}>
						{name}
					</h3>
				</div>

				{/* Icono de etiqueta o favorito a la derecha */}
				<div
					className="flex shrink-0 items-center gap-1"
					style={{
						color: 'rgba(var(--effect-highlight-rgb), 0.7)',
					}}
				>
					{isFavorite && (
						<Heart
							className={cn('fill-destructive text-destructive drop-shadow-sm', compact ? 'h-4 w-4' : 'h-5 w-5')}
						/>
					)}
					<TagIcon
						className={cn('drop-shadow-sm', compact ? 'h-4 w-4' : 'h-5 w-5')}
						style={{
							filter: 'drop-shadow(0 0 2px rgba(var(--effect-shadow-rgb), 0.3))',
						}}
					/>
				</div>
			</div>

			{/* Barra secundaria con categoría y rareza */}
			<div
				className={cn('flex items-center justify-between text-white text-sm', compact ? 'px-3 py-1' : 'px-3.5 py-1.5')}
				style={{
					background: tcgMode ? 'rgba(var(--effect-shadow-rgb), 0.3)' : 'rgba(var(--effect-shadow-rgb), 0.2)',
					borderBottom: `1px solid ${color}50`,
				}}
			>
				{/* Categoría - similar al tipo en cartas TCG */}
				<div className="flex items-center gap-1">
					<span className="font-semibold tracking-wide">ETIQUETA</span>
					{category && (
						<>
							<span className="mx-0.5">•</span>
							<div className="flex items-center gap-1">
								<BookOpen className="h-4 w-4" />
								<span>{typeof category === 'string' ? category.toUpperCase() : 'GENERAL'}</span>
							</div>
						</>
					)}
				</div>

				{/* Indicador de rareza para modo TCG */}
				{tcgMode && (
					<div className="flex items-center gap-1">
						{rarity !== TagRarity.COMMON && <Sparkles className="h-4 w-4" />}
						<span className="font-medium">{rarityLabel}</span>
					</div>
				)}
			</div>
		</div>
	);
}
