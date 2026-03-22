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

// Componente para renderizar la descripción principal
function DescriptionSection({
	description,
	tcgMode,
	primaryColor,
	rarityBrightness,
}: {
	description?: string;
	tcgMode: boolean;
	primaryColor: string;
	rarityBrightness: number;
}) {
	return (
		<div
			className={cn(
				'mb-3 text-sm',
				tcgMode ? 'rounded border border-border/20 bg-muted/10 p-2' : 'text-muted-foreground'
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
				<p className="text-center italic opacity-70">Sin descripción</p>
			)}
		</div>
	);
}

// Componente para el icono decorativo TCG
function DecorativeIcon({ tcgMode, primaryColor }: { tcgMode: boolean; primaryColor: string }) {
	if (!tcgMode) {
		return null;
	}

	return (
		<div className="mb-2 flex items-center gap-1">
			<TagIcon className="h-4 w-4 opacity-70" style={{ color: primaryColor }} />
			<div
				className="h-px flex-grow"
				style={{ background: `linear-gradient(to right, ${primaryColor}70, transparent)` }}
			/>
		</div>
	);
}

interface TagCardContentProps {
	albumsCount?: number;
	charactersCount?: number;
	collectionsCount?: number;
	conceptsCount?: number;
	description?: string | null;
	groupsCount?: number;
	imagesCount?: number;
	notesCount?: number;
	placesCount?: number;
	primaryColor: string;
	promptsCount?: number;
	propertiesCount?: number;
	rarity?: TagRarity;
	secondaryColor?: string;
	shortcut?: string | null;
	tcgMode?: boolean;
	videosCount?: number;
	wildcardsCount?: number;
	worldItemsCount?: number;
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
	// Extraer lógica de verificación de relaciones
	const hasRelationships = (() => {
		return (
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
			groupsCount > 0
		);
	})();

	// Calcular brillo basado en la rareza
	const rarityBrightness = (() => {
		const rarityBrightnessMap = {
			[TagRarity.COMMON]: 1,
			[TagRarity.UNCOMMON]: 1.2,
			[TagRarity.RARE]: 1.5,
			[TagRarity.VERY_RARE]: 1.8,
			[TagRarity.LEGENDARY]: 2.2,
		} as const;

		return rarityBrightnessMap[rarity as keyof typeof rarityBrightnessMap] || 1;
	})();

	// Renderizar una barra de stats para TCG mode
	const renderStatBar = (icon: React.ReactNode, count: number, label: string, color: string = primaryColor) => {
		if (!tcgMode || count === 0) {
			return null;
		}

		return (
			<div className="mb-1 flex items-center gap-1.5 text-sm last:mb-0">
				<div className="flex min-w-12 items-center gap-1">
					{icon}
					<span className="opacity-90">{label}</span>
				</div>
				<div className="h-1.5 flex-grow overflow-hidden rounded-full bg-muted/20">
					<div
						className="h-full rounded-full"
						style={{
							width: `${Math.min(100, (count / 10) * 100)}%`,
							background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
							boxShadow: `0 0 ${rarityBrightness * 5}px ${color}70`,
						}}
					/>
				</div>
				<span className="font-mono text-sm" style={{ color }}>
					{count}
				</span>
			</div>
		);
	};

	return (
		<div
			className={cn('scrollbar-thin flex-grow overflow-y-auto p-3', tcgMode && 'bg-black/5')}
			style={{
				scrollbarColor: `${primaryColor} transparent`,
				background: tcgMode ? 'rgba(0,0,0,0.03)' : 'transparent',
			}}
		>
			{/* Contenedor con borde estilizado similar a las reglas de TCG */}
			<div
				className="flex h-full flex-col"
				style={{
					borderLeft: tcgMode ? `1px solid ${primaryColor}20` : 'none',
					paddingLeft: tcgMode ? '0.5rem' : '0',
				}}
			>
				{/* Icono decorativo de etiqueta */}
				<DecorativeIcon primaryColor={primaryColor} tcgMode={tcgMode} />

				{/* Descripción principal */}
				<DescriptionSection
					description={description || undefined}
					primaryColor={primaryColor}
					rarityBrightness={rarityBrightness}
					tcgMode={tcgMode}
				/>

				{/* Contadores de relaciones en modo TCG */}
				{tcgMode && hasRelationships && (
					<div className="mb-3 flex flex-col">
						{renderStatBar(<Image className="h-4 w-4" />, imagesCount, 'Imágenes')}
						{renderStatBar(<Video className="h-4 w-4" />, videosCount, 'Videos')}
						{renderStatBar(<Album className="h-4 w-4" />, albumsCount, 'Álbumes')}
						{renderStatBar(<Folder className="h-4 w-4" />, collectionsCount, 'Colecciones')}
						{renderStatBar(<UserSquare className="h-4 w-4" />, charactersCount, 'Personajes')}
						{renderStatBar(<MapPin className="h-4 w-4" />, placesCount, 'Lugares')}
						{renderStatBar(<Package className="h-4 w-4" />, worldItemsCount, 'Objetos')}
						{renderStatBar(<BookOpen className="h-4 w-4" />, conceptsCount, 'Conceptos')}
						{renderStatBar(<MessageSquare className="h-4 w-4" />, promptsCount, 'Prompts')}
						{renderStatBar(<FileText className="h-4 w-4" />, notesCount, 'Notas')}
						{renderStatBar(<FileImage className="h-4 w-4" />, wildcardsCount, 'Wildcards')}
						{renderStatBar(<ListChecks className="h-4 w-4" />, propertiesCount, 'Propiedades')}
						{renderStatBar(<PanelTop className="h-4 w-4" />, groupsCount, 'Grupos')}
					</div>
				)}

				{/* Atajo de teclado */}
				{shortcut && (
					<div className={cn('mt-auto', !tcgMode && 'pt-2')}>
						<div className="flex items-center gap-1 text-sm">
							<Keyboard className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium text-muted-foreground">Atajo:</span>
							<code
								className="rounded px-1.5 py-0.5 font-mono text-sm"
								style={{
									background: `${primaryColor}15`,
									border: `1px solid ${primaryColor}30`,
									color: primaryColor,
								}}
							>
								{shortcut}
							</code>
						</div>
						<div className="mt-1 text-muted-foreground text-sm">
							<span className="opacity-70">Puedes usar este atajo para aplicar rápidamente esta etiqueta.</span>
						</div>
					</div>
				)}

				{/* Diseño decorativo para rellenar espacio vacío */}
				{!(shortcut || hasRelationships) && (
					<div className="mt-auto">
						<div
							className="mb-2 h-px w-full opacity-30"
							style={{ background: `linear-gradient(to right, ${primaryColor}, transparent 80%)` }}
						/>
						<div className="flex justify-center">
							<div
								className="h-8 w-8 rounded-full opacity-10"
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
