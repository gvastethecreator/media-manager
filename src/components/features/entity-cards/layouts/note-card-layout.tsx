'use client';

import { VisualizationConfig } from '@/components/features/entity-cards/config/visualization-config';
import { EntityCardContent } from '@/components/features/entity-cards/entity-card-content';
import type {
	CardDesignPreset,
	CardOptions,
	TextureConfig,
} from '@/components/features/entity-cards/types/shared-card-types';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/prisma';
import { ImageIcon, ScrollText, StarIcon, StickyNote, UsersIcon } from 'lucide-react';
import type * as React from 'react';
import { useState } from 'react';
import { EntityCardWrapper } from '../entity-card-wrapper';

// Opciones visuales optimizadas para tarjetas de notas
const DEFAULT_NOTE_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Sistema de diseño específico para notas
	designSystem: {
		preset: 'note' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '4/3',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: '239, 68, 68', // Un tono rojo
	secondaryColor: '248, 113, 113', // Un tono rojo claro

	// Opciones de efectos
	holographicOptions: {
		patternType: 'linear',
		intensity: 0.5,
		animationSpeed: 1,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 15,
		blurAmount: 10,
		animationType: 'pulse',
		pulseSpeed: 1.5,
		visibleOnHover: true,
	},

	borderOptions: {
		width: 2,
		pattern: 'solid',
		animationType: 'pulse',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.6,
	},

	grainOptions: {
		intensity: 0.12,
		density: 0.5,
		contrast: 1.1,
		noise: 'light',
		animated: false,
		visibleOnHover: true,
	},

	// Opciones para imagen
	useImageGrid: true,
	imageGridLayout: 'single',
	imageGridGap: 4,
	imageGridStyle: 'standard',
};

// Definición de los tipos de notas
const NOTE_TYPES = {
	standard: {
		label: 'Estándar',
		icon: <ScrollText className="h-4 w-4" />,
		primaryColor: '239, 68, 68', // Rojo
		secondaryColor: '248, 113, 113', // Rojo claro
		texture: 'standard' as TextureConfig,
	},
	important: {
		label: 'Importante',
		icon: <StarIcon className="h-4 w-4" />,
		primaryColor: '168, 85, 247', // Púrpura
		secondaryColor: '192, 132, 252', // Púrpura claro
		texture: 'gold' as TextureConfig,
	},
	concept: {
		label: 'Concepto',
		icon: <UsersIcon className="h-4 w-4" />,
		primaryColor: '59, 130, 246', // Azul
		secondaryColor: '96, 165, 250', // Azul claro
		texture: 'silver' as TextureConfig,
	},
	research: {
		label: 'Investigación',
		icon: <ImageIcon className="h-4 w-4" />,
		primaryColor: '34, 197, 94', // Verde
		secondaryColor: '74, 222, 128', // Verde claro
		texture: 'bronze' as TextureConfig,
	},
};

// Interfaz para las propiedades de la tarjeta de nota
interface NoteCardProps {
	note: Note;
	onEdit?: (note: Note) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	visualOptions?: Partial<CardOptions>;
}

// Componente principal para la tarjeta de nota
export function NoteCard({ note, onEdit, onDelete, onClick, className, visualOptions }: NoteCardProps) {
	// Verificar si note existe y tiene las propiedades necesarias
	if (!note) {
		console.warn('NoteCard: Se recibió un objeto note indefinido');
		// Crear un note por defecto para evitar errores
		note = {
			id: 'placeholder',
			name: 'Nota sin nombre',
			content: 'Sin contenido',
			type: 'text',
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Note;
	}

	// Estado para controlar si el panel de configuración está abierto
	const [configOpen, setConfigOpen] = useState(false);

	// Estado para las opciones de la tarjeta
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_NOTE_OPTIONS,
		...visualOptions,
	});

	// Función para determinar el tipo de nota según el contenido
	const determineNoteType = (name: string, description: string) => {
		// Identificar si es una nota de investigación
		const isResearch =
			description?.toLowerCase().includes('investigación') ||
			description?.toLowerCase().includes('research') ||
			name?.toLowerCase().includes('investigación') ||
			name?.toLowerCase().includes('research');

		// Identificar si es una nota de concepto
		const isConcept =
			description?.toLowerCase().includes('concepto') ||
			description?.toLowerCase().includes('concept') ||
			name?.toLowerCase().includes('concepto') ||
			name?.toLowerCase().includes('concept');

		// Identificar si es una nota importante
		const isImportant =
			description?.toLowerCase().includes('importante') ||
			description?.toLowerCase().includes('important') ||
			description?.toLowerCase().includes('urgente') ||
			description?.toLowerCase().includes('urgent') ||
			name?.toLowerCase().includes('importante') ||
			name?.toLowerCase().includes('important') ||
			name?.toLowerCase().includes('urgente') ||
			name?.toLowerCase().includes('urgent');

		// Devolver el tipo correspondiente
		if (isResearch) return 'research';
		if (isConcept) return 'concept';
		if (isImportant) return 'important';
		return 'standard';
	};

	// Obtener el tipo de nota
	const noteType = note.type || determineNoteType(note.name || '', note.content || '');
	const typeInfo = NOTE_TYPES[noteType as keyof typeof NOTE_TYPES] || NOTE_TYPES.standard;

	// Obtener fecha formateada
	const formattedDate = note.createdAt
		? new Date(note.createdAt).toLocaleDateString()
		: new Date().toLocaleDateString();

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					options={cardOptions}
					onOptionsChange={setCardOptions}
					onClose={() => setConfigOpen(false)}
				/>
			)}

			<div
				className={cn('note-card min-h-[250px] w-full relative', className)}
				onClick={onClick}
				onKeyDown={(e) => {
					// Activar el click cuando se presiona Enter o Space
					if (onClick && (e.key === 'Enter' || e.key === ' ')) {
						e.preventDefault();
						onClick();
					}
				}}
				tabIndex={onClick ? 0 : undefined} // Solo es focusable si tiene un onClick
				role={onClick ? 'button' : undefined} // Asignar rol de botón si es interactivo
				style={
					{
						'--primary-color': typeInfo.primaryColor,
						'--secondary-color': typeInfo.secondaryColor,
					} as React.CSSProperties
				}
			>
				<EntityCardWrapper
					title={note.name || 'Nota sin título'}
					description={note.content || ''}
					entityType="note"
					entityId={note.id}
					visualOptions={{
						...cardOptions,
						primaryColor: typeInfo.primaryColor,
						secondaryColor: typeInfo.secondaryColor,
					}}
					onConfigClick={() => setConfigOpen(true)}
				>
					<EntityCardContent
						title={note.name || 'Nota sin título'}
						description={note.content}
						entityId={note.id}
						onEdit={onEdit ? () => onEdit(note) : undefined}
						onDelete={onDelete ? () => onDelete(note.id) : undefined}
						icon={typeInfo.icon || <StickyNote className="h-4 w-4" />}
						className="p-4"
						badges={
							note.tags && Array.isArray(note.tags) && note.tags.length > 0
								? note.tags.slice(0, 3).map((tag: string) => ({
									key: `tag-${tag}`,
									label: `#${tag}`,
									variant: 'secondary',
								}))
								: []
						}
					>
						<div className="text-xs text-[--muted-foreground] mt-auto">{formattedDate}</div>
					</EntityCardContent>
				</EntityCardWrapper>
			</div>
		</>
	);
}
