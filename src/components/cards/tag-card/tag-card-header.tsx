import type { type TagCategory } from '@/types/entities/tag';
import { TagRarity } from '@/types/entities/tag';
import { BookOpen, Heart, Sparkles, TagBase as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
;

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
		[TagRarity.EPIC]: 'Épica',
		[TagRarity.LEGENDARY]: 'Legendaria',
	};

	// Obtener el texto de rareza
	const rarityLabel = rarityText[rarity as keyof typeof rarityText] || 'Común';

	// Estilo especial para el encabezado de etiquetas, con un diseño más distintivo
	return (
		<div className="relative">
			{/* Encabezado distintivo de etiqueta */}
			<div
				className={cn('flex items-center justify-between', compact ? 'py-2 px-3' : 'py-2.5 px-3.5')}
				style={{
					background: tcgMode ? `linear-gradient(135deg, ${color}90, ${color}70)` : `${color}80`,
					borderBottom: `1px solid ${color}`,
				}}
			>
				{/* Parte izquierda: Emoji y nombre */}
				<div className="flex items-center gap-2 max-w-[75%]">
					{/* Emoji con estilo de tag */}
					<div
						className={cn('rounded-full flex items-center justify-center text-lg', compact ? 'w-6 h-6' : 'w-7 h-7')}
						style={{
							background: 'rgba(255, 255, 255, 0.25)',
							boxShadow: `0 0 8px ${color}40`,
						}}
					>
						{emoji}
					</div>

					{/* Nombre de la etiqueta */}
					<h3 className={cn('font-bold text-white truncate', compact ? 'text-base' : 'text-lg', 'drop-shadow-sm')}>
						{name}
					</h3>
				</div>

				{/* Icono de etiqueta o favorito a la derecha */}
				<div
					className="flex-shrink-0 flex items-center gap-1"
					style={{
						color: 'rgba(255, 255, 255, 0.7)',
					}}
				>
					{isFavorite && (
						<Heart
							className={cn('drop-shadow-sm', compact ? 'w-4 h-4' : 'w-5 h-5')}
							style={{
								color: 'rgb(239, 68, 68)',
								fill: 'rgb(239, 68, 68)',
							}}
						/>
					)}
					<TagIcon
						className={cn('drop-shadow-sm', compact ? 'w-4 h-4' : 'w-5 h-5')}
						style={{
							filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
						}}
					/>
				</div>
			</div>

			{/* Barra secundaria con categoría y rareza */}
			<div
				className={cn('flex items-center justify-between text-xs text-white', compact ? 'py-1 px-3' : 'py-1.5 px-3.5')}
				style={{
					background: tcgMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
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
								<BookOpen className="w-3 h-3" />
								<span>{typeof category === 'string' ? category.toUpperCase() : 'GENERAL'}</span>
							</div>
						</>
					)}
				</div>

				{/* Indicador de rareza para modo TCG */}
				{tcgMode && (
					<div className="flex items-center gap-1">
						{rarity !== TagRarity.COMMON && <Sparkles className="w-3 h-3" />}
						<span className="font-medium">{rarityLabel}</span>
					</div>
				)}
			</div>
		</div>
	);
}
