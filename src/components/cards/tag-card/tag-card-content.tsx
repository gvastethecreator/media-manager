import {
	Album,
	BookOpen,
	FileImage,
	FileText,
	Folder,
	Image,
	Keyboard,
	ListChecks,
	MapPin,
	MessageSquare,
	Package,
	PanelTop,
	Tag as TagIcon,
	UserSquare,
	Video,
} from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { TagRarity } from '@/store/entities/tag/types';

interface TagCardContentProps {
	description?: string | null;
	shortcut?: string | null;
	primaryColor: string;
	secondaryColor?: string;
	tcgMode?: boolean;
	rarity?: TagRarity;
	imagesCount?: number;
	videosCount?: number;
	albumsCount?: number;
	collectionsCount?: number;
	charactersCount?: number;
	placesCount?: number;
	worldItemsCount?: number;
	conceptsCount?: number;
	promptsCount?: number;
	notesCount?: number;
	wildcardsCount?: number;
	propertiesCount?: number;
	groupsCount?: number;
}

/**
 * Componente para el contenido principal de la tarjeta de etiqueta.
 * Similar al texto de reglas de una carta TCG.
 */
export function TagCardContent({
	description,
	shortcut,
	primaryColor,
	secondaryColor = primaryColor,
	tcgMode = true,
	rarity = TagRarity.COMMON,
	imagesCount = 0,
	videosCount = 0,
	albumsCount = 0,
	collectionsCount = 0,
	charactersCount = 0,
	placesCount = 0,
	worldItemsCount = 0,
	conceptsCount = 0,
	promptsCount = 0,
	notesCount = 0,
	wildcardsCount = 0,
	propertiesCount = 0,
	groupsCount = 0,
}: TagCardContentProps) {
	// Determinar si mostrar los contadores de relaciones (solo si hay al menos uno con valor)
	const hasRelationships =
		albumsCount > 0 ||
		collectionsCount > 0 ||
		charactersCount > 0 ||
		placesCount > 0 ||
		worldItemsCount > 0 ||
		conceptsCount > 0 ||
		promptsCount > 0 ||
		notesCount > 0 ||
		wildcardsCount > 0 ||
		propertiesCount > 0 ||
		groupsCount > 0;

	// Conseguir un factor de brillo basado en la rareza para efectos visuales
	const rarityBrightnessMap = {
		[TagRarity.COMMON]: 1,
		[TagRarity.UNCOMMON]: 1.2,
		[TagRarity.RARE]: 1.5,
		[TagRarity.VERY_RARE]: 1.8,
		[TagRarity.LEGENDARY]: 2.2,
	} as const;

	const rarityBrightness: number = rarityBrightnessMap[rarity as keyof typeof rarityBrightnessMap] || 1;

	// Renderizar una barra de stats para TCG mode
	const renderStatBar = (icon: React.ReactNode, count: number, label: string, color: string = primaryColor) => {
		if (!tcgMode || count === 0) return null;

		return (
			<div className="flex items-center gap-1.5 text-xs mb-1 last:mb-0">
				<div className="flex items-center gap-1 min-w-12">
					{icon}
					<span className="opacity-90">{label}</span>
				</div>
				<div className="flex-grow h-1.5 rounded-full bg-black/20 overflow-hidden">
					<div
						className="h-full rounded-full"
						style={{
							width: `${Math.min(100, (count / 10) * 100)}%`,
							background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
							boxShadow: `0 0 ${rarityBrightness * 5}px ${color}70`,
						}}
					/>
				</div>
				<span className="font-mono text-xs" style={{ color }}>
					{count}
				</span>
			</div>
		);
	};

	return (
		<div
			className={cn('flex-grow p-3 overflow-y-auto scrollbar-thin', tcgMode && 'bg-black/5')}
			style={{
				scrollbarColor: `${primaryColor} transparent`,
				background: tcgMode ? 'rgba(0,0,0,0.03)' : 'transparent',
			}}
		>
			{/* Contenedor con borde estilizado similar a las reglas de TCG */}
			<div
				className="h-full flex flex-col"
				style={{
					borderLeft: tcgMode ? `1px solid ${primaryColor}20` : 'none',
					paddingLeft: tcgMode ? '0.5rem' : '0',
				}}
			>
				{/* Icono decorativo de etiqueta */}
				{tcgMode && (
					<div className="flex items-center gap-1 mb-2">
						<TagIcon className="w-4 h-4 opacity-70" style={{ color: primaryColor }} />
						<div
							className="flex-grow h-px"
							style={{ background: `linear-gradient(to right, ${primaryColor}70, transparent)` }}
						/>
					</div>
				)}

				{/* Descripción principal */}
				<div
					className={cn(
						'mb-3 text-xs',
						tcgMode ? 'bg-black/10 p-2 rounded border border-white/5' : 'text-muted-foreground'
					)}
					style={{
						lineHeight: '1.25rem',
						color: tcgMode ? 'white' : `${primaryColor}DD`,
						boxShadow: tcgMode ? `inset 0 0 ${rarityBrightness * 5}px ${primaryColor}20` : 'none',
					}}
				>
					{description ? (
						<p className={tcgMode ? '' : 'italic'}>{description}</p>
					) : (
						<p className="italic text-center opacity-70">Sin descripción</p>
					)}
				</div>

				{/* Contadores de relaciones en modo TCG */}
				{tcgMode && hasRelationships && (
					<div className="mb-3 flex flex-col">
						{renderStatBar(<Image className="w-3.5 h-3.5" />, imagesCount, 'Imágenes')}
						{renderStatBar(<Video className="w-3.5 h-3.5" />, videosCount, 'Videos')}
						{renderStatBar(<Album className="w-3.5 h-3.5" />, albumsCount, 'Álbumes')}
						{renderStatBar(<Folder className="w-3.5 h-3.5" />, collectionsCount, 'Colecciones')}
						{renderStatBar(<UserSquare className="w-3.5 h-3.5" />, charactersCount, 'Personajes')}
						{renderStatBar(<MapPin className="w-3.5 h-3.5" />, placesCount, 'Lugares')}
						{renderStatBar(<Package className="w-3.5 h-3.5" />, worldItemsCount, 'Objetos')}
						{renderStatBar(<BookOpen className="w-3.5 h-3.5" />, conceptsCount, 'Conceptos')}
						{renderStatBar(<MessageSquare className="w-3.5 h-3.5" />, promptsCount, 'Prompts')}
						{renderStatBar(<FileText className="w-3.5 h-3.5" />, notesCount, 'Notas')}
						{renderStatBar(<FileImage className="w-3.5 h-3.5" />, wildcardsCount, 'Wildcards')}
						{renderStatBar(<ListChecks className="w-3.5 h-3.5" />, propertiesCount, 'Propiedades')}
						{renderStatBar(<PanelTop className="w-3.5 h-3.5" />, groupsCount, 'Grupos')}
					</div>
				)}

				{/* Atajo de teclado */}
				{shortcut && (
					<div className={cn('mt-auto', !tcgMode && 'pt-2')}>
						<div className="flex items-center gap-1 text-xs">
							<Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
							<span className="font-medium text-muted-foreground">Atajo:</span>
							<code
								className="px-1.5 py-0.5 rounded text-xs font-mono"
								style={{
									background: `${primaryColor}15`,
									border: `1px solid ${primaryColor}30`,
									color: primaryColor,
								}}
							>
								{shortcut}
							</code>
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							<span className="opacity-70">Puedes usar este atajo para aplicar rápidamente esta etiqueta.</span>
						</div>
					</div>
				)}

				{/* Diseño decorativo para rellenar espacio vacío */}
				{!shortcut && !hasRelationships && (
					<div className="mt-auto">
						<div
							className="w-full h-px mb-2 opacity-30"
							style={{ background: `linear-gradient(to right, ${primaryColor}, transparent 80%)` }}
						/>
						<div className="flex justify-center">
							<div
								className="w-8 h-8 rounded-full opacity-10"
								style={{
									background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
								}}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
