'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/prisma';
import {
	BookMarked,
	Calendar,
	FileText,
	Newspaper,
	PencilIcon,
	Pin,
	Star,
	Timer,
	Trash2
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardImageSection,
	CardMetadataSection
} from '../../../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../../../entity-card-wrapper';
import { usePreset } from '../../../hooks/use-preset';
import { adaptCardOptions } from '../../../types';
import type { CardOptions } from '../../../types/unified-card-types';

import '../styles/note-card.css';

// TIPOS DE DATOS
// ==============================

// Extender el tipo Note con propiedades adicionales
interface ExtendedNote extends Note {
	type?: string;
	isPinned?: boolean;
	image?: string;
}

// Props para NoteCard (componente público)
export interface NoteCardProps {
	note: ExtendedNote;
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
	onEdit?: (note: ExtendedNote) => void;
	onDelete?: (id: string) => void;
}

// SISTEMA DE RAREZA
// ==============================

// Define niveles de rareza para notas con estilo TCG
interface NoteRarity {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
	stars: number;
	textureType: string;
	glowIntensity: number;
	textureOpacity: number;
	holographic?: boolean;
	borderAnimation?: string;
}

const NOTE_RARITY: Record<string, NoteRarity> = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.8)',
		glowColor: 'rgba(156, 163, 175, 0.6)',
		label: 'Estándar',
		rarity: 'common' as const,
		stars: 1,
		textureType: 'noise',
		glowIntensity: 0.4,
		textureOpacity: 0.15
	},
	uncommon: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.8)',
		glowColor: 'rgba(34, 197, 94, 0.6)',
		label: 'Inusual',
		rarity: 'uncommon' as const,
		stars: 2,
		textureType: 'dots',
		glowIntensity: 0.5,
		textureOpacity: 0.2
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.8)',
		glowColor: 'rgba(59, 130, 246, 0.6)',
		label: 'Relevante',
		rarity: 'rare' as const,
		stars: 3,
		textureType: 'grid',
		glowIntensity: 0.65,
		textureOpacity: 0.25,
		borderAnimation: 'pulse'
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.8)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Histórica',
		rarity: 'legendary' as const,
		stars: 4,
		holographic: true,
		textureType: 'sparkle',
		glowIntensity: 0.8,
		textureOpacity: 0.3,
		borderAnimation: 'flow'
	},
	mythic: {
		color: '#d946ef',
		borderColor: 'rgba(217, 70, 239, 0.8)',
		glowColor: 'rgba(217, 70, 239, 0.7)',
		label: 'Esencial',
		rarity: 'mythic' as const,
		stars: 5,
		holographic: true,
		textureType: 'rainbow',
		glowIntensity: 1,
		textureOpacity: 0.4,
		borderAnimation: 'rainbow'
	}
};

// Configuración visual por defecto para notas en estilo TCG
const DEFAULT_NOTE_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño inspirado en cartas coleccionables
	designSystem: {
		preset: 'note',
		variant: 'tcg',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos holográficos y de brillo
	holographicOptions: {
		patternType: 'geometric',
		intensity: 0.6,
		animationSpeed: 1.5,
		visibleOnHover: true,
	},

	// Efectos de brillo
	glowOptions: {
		intensity: 0.7,
		size: 25,
		blurAmount: 18,
		animationType: 'pulse',
		pulseSpeed: 2,
		color: 'auto',
		visibleOnHover: true,
	},

	// Bordes animados
	borderOptions: {
		width: 2.5,
		pattern: 'gradient',
		animationType: 'flow',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.8,
	},

	// Textura de fondo
	textureConfig: {
		type: 'noise',
		intensity: 0.15,
		scale: 1.2,
		blendMode: 'overlay',
	},

	// Rotación máxima
	maxRotation: 15,

	// Colores base
	primaryColor: '#3b82f6',
	secondaryColor: '#1e40af',
	accentColor: '#60a5fa',
	backgroundColor: '#1e293b',
};

// UTILIDADES Y COMPONENTES AUXILIARES
// ==============================

// Componente para mostrar estrellas de rareza
function RarityStars({ count }: { count: number }) {
	return (
		<div className="flex items-center justify-center mt-1">
			{Array.from({ length: count }).map((_, i) => (
				<Star
					key={`star-${i}-${count}`}
					className={cn(
						"h-3 w-3 mx-0.5",
						count >= 4 ? "text-yellow-400" :
							count >= 3 ? "text-blue-400" :
								count >= 2 ? "text-green-400" : "text-gray-400"
					)}
					fill="currentColor"
				/>
			))}
		</div>
	);
}

// Calcula la rareza de una nota basado en varios factores
function calculateNoteRarity(note: ExtendedNote): keyof typeof NOTE_RARITY {
	// Si no hay nota válida
	if (!note || !note.id) {
		return 'common';
	}

	// Los factores que influyen en la rareza
	const hasImage = !!note.image;
	const isLong = (note.content?.length || 0) > 500;
	const isPinned = !!note.isPinned;
	const hasType = !!note.type;
	const contentScore = (note.content?.length || 0) / 200; // 1 punto por cada 200 caracteres

	// Calcular puntuación total (valores arbitrarios para demostración)
	let score = 0;
	if (hasImage) score += 2;
	if (isLong) score += 1;
	if (isPinned) score += 1.5;
	if (hasType) score += 0.5;
	score += Math.min(contentScore, 3); // Máximo 3 puntos por longitud

	// Determinar rareza basada en la puntuación
	if (score >= 6) return 'mythic';
	if (score >= 4.5) return 'legendary';
	if (score >= 3) return 'rare';
	if (score >= 1.5) return 'uncommon';
	return 'common';
}

// Genera la configuración de rareza para una nota
function generateNoteRarityConfig(note: ExtendedNote) {
	const rarityKey = calculateNoteRarity(note);
	const rarity = NOTE_RARITY[rarityKey];

	return {
		enabled: true,
		rarity: rarityKey,
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		borderStyle: 'solid',
		borderWidth: 2,
		frameType: 'standard',
		label: rarity.label,
	};
}

// Obtiene el icono adecuado para el tipo de nota
function getNoteTypeIcon(type = '') {
	switch (type?.toLowerCase()) {
		case 'journal': return <Newspaper className="h-4 w-4" />;
		case 'documentation': return <FileText className="h-4 w-4" />;
		case 'log': return <BookMarked className="h-4 w-4" />;
		default: return <FileText className="h-4 w-4" />;
	}
}

// COMPONENTE PRINCIPAL
// ==============================
export function NoteCardLayout({
	note: initialNote,
	options = {},
	onClick,
	showVisualConfig = false,
	onVisualConfigClick,
	enableExplode = false,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
	className,
	onEdit,
	onDelete,
}: NoteCardProps) {
	// Garantizar que nunca procesamos una nota undefined
	const note = initialNote || {
		id: 'placeholder',
		title: 'Nota sin título',
		content: 'Sin contenido',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'note',
		entityId: note.id as string,
		presetId: 'presetId' in note && note.presetId ? note.presetId : null,
		baseOptions: options,
	});

	// Obtener la rareza de la nota
	const rarityKey = calculateNoteRarity(note);
	const rarityInfo = NOTE_RARITY[rarityKey];
	const rarityConfig = generateNoteRarityConfig(note);
	const rarityClass = `note-card-rarity-${rarityKey}`;

	// Generar opciones de tarjeta mejoradas basadas en rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_NOTE_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityInfo.glowIntensity || 0.5;

		// Habilitar efectos especiales para notas legendarias y míticas
		const isSpecial = rarityKey === 'legendary' || rarityKey === 'mythic';

		// Crear opciones combinadas con valores específicos de rareza
		return {
			...defaults,
			enableHolographicEffect: isSpecial,
			enableScanlinesEffect: isSpecial,

			// Configurar glows basados en rareza
			glowOptions: {
				...(defaults.glowOptions || {}),
				intensity: intensity,
				color: rarityInfo.glowColor,
				size: 20 + (rarityInfo.stars * 2),
				visibleOnIdle: rarityKey === 'mythic',
				animationType: isSpecial ? 'pulse' : 'static',
			},

			// Configurar bordes animados
			borderOptions: {
				...(defaults.borderOptions || {}),
				width: rarityInfo.stars * 0.5,
				color: rarityInfo.borderColor,
				pattern: isSpecial ? 'gradient' : 'solid',
				animationType: rarityInfo.borderAnimation || 'none',
				glowIntensity: intensity,
			},

			// Configurar texturas específicas
			textureConfig: {
				type: rarityInfo.textureType || 'noise',
				intensity: rarityInfo.textureOpacity || 0.15,
				scale: 1 + (rarityInfo.stars * 0.1),
				blendMode: 'overlay',
			},

			// Configuración de rareza
			rarityConfig,

			// Efectos adicionales
			effects: {
				...(defaults.effects || {}),
				chromaticAberration: {
					enabled: isSpecial,
					visibleOnHover: true,
					intensity: rarityKey === 'mythic' ? 0.4 : 0.2,
				},
				noiseTexture: {
					enabled: true,
					visibleOnHover: !isSpecial,
					intensity: rarityInfo.textureOpacity || 0.15,
				},
				glitchEffect: {
					enabled: rarityKey === 'mythic',
					visibleOnHover: true,
					intensity: 0.3,
					frequency: 0.1,
				},
			},
		};
	}, [rarityKey, rarityInfo, rarityConfig]);

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Star className="h-4 w-4" /> },
		{ id: 'frame', label: 'Marco', icon: <FileText className="h-4 w-4" /> },
		{ id: 'content', label: 'Contenido', icon: <BookMarked className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Star className="h-4 w-4" /> },
	];

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && note) {
			onEdit(note);
		}
	}, [onEdit, note]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && note?.id) {
			onDelete(note.id);
		}
	}, [onDelete, note?.id]);

	// Calcular fecha formateada
	const formattedDate = useMemo(() => {
		if (!note.createdAt) return '';

		const date = typeof note.createdAt === 'string'
			? new Date(note.createdAt)
			: note.createdAt;

		return date.toLocaleDateString();
	}, [note.createdAt]);

	// Corregir la generación de metadataItems utilizando un enfoque que evite elementos undefined
	const metadataItems = useMemo(() => {
		const items: Array<{
			label: string;
			value: string;
			icon: React.ReactNode;
		}> = [];

		if (note.type) {
			items.push({
				label: 'Tipo',
				value: note.type,
				icon: getNoteTypeIcon(note.type)
			});
		}

		items.push({
			label: 'Creado',
			value: formattedDate,
			icon: <Calendar className="h-3.5 w-3.5 opacity-70" />
		});

		if (note.updatedAt) {
			items.push({
				label: 'Actualizado',
				value: typeof note.updatedAt === 'string'
					? new Date(note.updatedAt).toLocaleDateString()
					: note.updatedAt.toLocaleDateString(),
				icon: <Timer className="h-3.5 w-3.5 opacity-70" />
			});
		}

		return items;
	}, [note.type, formattedDate, note.updatedAt]);

	return (
		<div className={cn(
			'note-card-container relative w-full h-full group',
			rarityClass,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={note.title || 'Nota'}
				description={note.content || ''}
				entityId={note.id}
				entityType="note"
				className={cn('note-card-wrapper relative w-full h-full', rarityClass)}
				options={adaptCardOptions(enhancedCardOptions)}
				showVisualConfig={showVisualConfig}
				onVisualConfigClick={onVisualConfigClick}
				enableExplode={enableExplode}
				isExploded={isExploded}
				activeLayer={activeLayer}
				onExplodedChange={onExplodedChange}
				onActiveLayerChange={onActiveLayerChange}
				explodeLayers={explodeLayers}
				onClick={onClick}
			>
				<div className="note-card-content flex flex-col h-full w-full relative">
					{/* Cabecera de la tarjeta con indicador de pin si está destacada */}
					<CardHeader
						title={note.title || 'Nota sin título'}
						entityType="note"
						showIcon={true}
						className={cn(
							"mb-2 relative z-10",
							note.isPinned && "border-r-[16px] border-r-amber-400/40"
						)}
						rightContent={
							<>
								{note.isPinned && (
									<Pin className="h-4 w-4 absolute top-2 right-2 text-amber-400" />
								)}
								{(onEdit || onDelete) && (
									<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
										{onEdit && (
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 p-0 bg-background/80"
												onClick={handleEdit}
											>
												<PencilIcon className="h-3.5 w-3.5" />
											</Button>
										)}
										{onDelete && (
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 p-0 bg-background/80 hover:bg-destructive/20"
												onClick={handleDelete}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										)}
									</div>
								)}
							</>
						}
					/>

					{/* Indicador de rareza */}
					<RarityStars count={rarityInfo.stars} />

					{/* Imagen de la nota (si existe) */}
					{note.image && (
						<CardImageSection
							imageUrl={note.image}
							alt={note.title || 'Nota'}
							aspectRatio="video"
							className="mb-3 border border-muted rounded-md overflow-hidden"
						/>
					)}

					{/* Contenido de la nota */}
					<CardDescriptionSection
						description={note.content || 'Sin contenido'}
						maxLines={5}
						className="flex-grow"
					/>

					{/* Metadatos de la nota */}
					{metadataItems.length > 0 && (
						<CardMetadataSection
							items={metadataItems}
							className="mt-2 bg-card/80 rounded"
						/>
					)}

					{/* Pie de página con indicador de rareza */}
					<CardFooter
						className="mt-auto"
						leftContent={
							<div className={cn(
								"note-rarity px-3 py-1 rounded-full text-[10px] font-medium",
								rarityKey === 'mythic' ? "bg-fuchsia-500/20 text-fuchsia-200" :
									rarityKey === 'legendary' ? "bg-amber-500/20 text-amber-200" :
										rarityKey === 'rare' ? "bg-blue-500/20 text-blue-200" :
											rarityKey === 'uncommon' ? "bg-green-500/20 text-green-200" :
												"bg-gray-500/20 text-gray-200"
							)}>
								{NOTE_RARITY[rarityKey].label}
							</div>
						}
						rightContent={
							<span className="text-[10px] opacity-70">
								{note.type ? `#${note.type}` : '#nota'}
							</span>
						}
					/>
				</div>
			</EntityCardWrapper>
		</div>
	);
}

// Componente público para usar en la aplicación
export function NoteCard(props: NoteCardProps) {
	return <NoteCardLayout {...props} />;
}