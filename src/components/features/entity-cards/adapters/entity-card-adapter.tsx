'use client';

import type { Character } from '@/types/entities/characters';
import type { Collection } from '@/types/entities/collections';
import type { Concept } from '@/types/entities/concepts';
import type { Folder } from '@/types/entities/folders';
import type { Note } from '@/types/entities/notes';
import type { Place } from '@/types/entities/places';
import type { Prompt } from '@/types/entities/prompts';
import type { Tag } from '@/types/entities/tags';
import type { WorldItem } from '@/types/entities/world-items';

import { getCardOptionsFromPreset } from '../actions/visual-presets.actions';
// Importamos todos los adaptadores de tarjeta
import { AlbumCard } from '../modules/layouts/album-card-layout';
import { CharacterCard } from '../modules/layouts/character-card-layout';
import { CollectionCard } from '../modules/layouts/collection-card-layout';
import { ConceptCard } from '../modules/layouts/concept-card-layout';
import { FolderCard } from '../modules/layouts/folder-card-layout';
import { NoteCard } from '../modules/layouts/note-card-layout';
import { PlaceCard } from '../modules/layouts/place-card-layout';
import { PromptCard } from '../modules/layouts/prompt-card-layout';
import { TagsCard } from '../modules/layouts/tags-card-layout';
import { WorldItemAdapter } from './world-item-adapter';

import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../modules/layouts/album-card-layout';
import type { CharacterCardProps } from '../modules/layouts/character-card-layout';
import type { ConceptCardProps } from '../modules/layouts/concept-card-layout';
import type { NoteCardProps } from '../modules/layouts/note-card-layout';
import type { PromptCardProps } from '../modules/layouts/prompt-card-layout';
import type { CardOptions } from '../types/unified-card-types';

// Importar nuestras nuevas herramientas de depuración
import { createDebugger } from '../debug/render-debug';
import { debugEntityData, normalizeEntityData } from '../utils/data-validator';

// Cerca de la definición de EntityCardAdapter, añadir debugger
const debug = createDebugger('EntityCardAdapter', process.env.NODE_ENV === 'development');

// Propiedad base para todas las entidades
interface EntityBase {
	presetId?: string;
}


// Estructura para las estadísticas de personajes como record para evitar errores de tipo
export interface CharacterStats {
	[key: string]: string | number | boolean | undefined;
	strength?: number;
	dexterity?: number;
	constitution?: number;
	intelligence?: number;
	wisdom?: number;
	charisma?: number;
}

// Tipo extendido para el componente Character que preserva la compatibilidad con string en stats
export interface CharacterExtended extends Omit<Character, 'stats'> {
	stats: CharacterStats | string | undefined;
	presetId?: string;
}

// Tipo para Concept con presetId y propiedades requeridas
export interface ExtendedConcept extends Omit<Concept, 'presetId' | 'content'> {
	presetId: string;
	content: string;
}

// Tipo para Note con presetId y propiedades requeridas
export interface ExtendedNote extends Omit<Note, 'status' | 'presetId'> {
	presetId: string;
	status: string;
}

// Tipo para Prompt con el formato requerido para _count
export interface ExtendedPrompt extends Omit<Prompt, '_count' | 'tags'> {
	_count?: {
		uses: number;
	};
	tags: string | string[] | undefined;
	presetId?: string;
}

export interface EntityCardAdapterProps {
	entityType: string;
	entity: Entity;
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
}

/**
 * Genera una configuración de rareza para una entidad
 * @param level El nivel de rareza
 * @param color El color base (opcional)
 * @returns La configuración de rareza
 */
export function generateRarityConfig(level: string, color = '#3b82f6') {
	return {
		name: level,
		color,
		borderWidth: level === 'common' ? '1px' : level === 'uncommon' ? '2px' : '3px',
		borderEffect: level === 'common' ? 'static' : level === 'uncommon' ? 'pulse' : 'glow',
	};
}

/**
 * Carga la configuración de un preset visual para una entidad
 * @param entity La entidad con posible presetId
 * @param entityType El tipo de entidad
 * @param defaultOptions Opciones predeterminadas si no hay preset
 * @returns Promise con las opciones de tarjeta
 */
async function loadEntityPresetConfig(
	entity: Entity,
	entityType: string,
	defaultOptions: CardOptions
): Promise<CardOptions> {
	// Si la entidad no tiene un presetId, devolver opciones predeterminadas
	if (!entity.presetId) {
		return defaultOptions;
	}

	try {
		// Intentar cargar el preset desde la API
		const response = await getCardOptionsFromPreset(entity.presetId as string, entityType);

		if (response?.success && response.data) {
			// Combinar con las opciones predeterminadas para asegurar que todos los campos existan
			return {
				...defaultOptions,
				...(response.data as CardOptions),
				// Preservar sistemas anidados
				designSystem: {
					...(defaultOptions.designSystem || {}),
					...((response.data as CardOptions).designSystem || {}),
				},
				layerSystem: {
					...(defaultOptions.layerSystem || {}),
					...((response.data as CardOptions).layerSystem || {}),
				},
			};
		}
	} catch (error) {
		console.error(`Error al cargar preset ${entity.presetId} para entidad tipo ${entityType}:`, error);
	}

	// Si hay algún error o el preset no existe, devolver opciones predeterminadas
	return defaultOptions;
}

/**
 * ADAPTADOR SIMPLIFICADO TEMPORAL
 *
 * Esta versión simplificada del adaptador resuelve problemas de rendimiento
 * utilizando la implementación mínima de EntityCard
 */

import { EntityCard } from '../entity-card';

// Propiedad base para todas las entidades
export interface Entity {
	id: string;
	name: string;
	description?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
	image?: string;
	[key: string]: unknown;
}

export interface EntityCardAdapterProps {
	entityType: string;
	entity: Entity;
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
}

/**
 * Adaptador simplificado para entidades
 * Esta versión elimina toda la complejidad y solo pasa los datos básicos al EntityCard
 */
export function simplifiedEntityCardAdapter({
	entityType,
	entity,
	options = {},
	onClick,
	className,
}: EntityCardAdapterProps) {
	// Verificar que la entidad existe
	if (!entity) {
		console.error(`Error: La entidad de tipo ${entityType} es undefined`);
		return (
			<div className="error-card p-4 border border-red-500 rounded-md">
				<h3 className="text-red-500 font-medium">Error de datos</h3>
				<p className="text-sm text-gray-500">No se pudo cargar la información de la entidad</p>
			</div>
		);
	}

	// Normalizar la entidad de forma básica
	const normalizedEntity = normalizeEntityData(entity, entityType);

	// Extraer propiedades básicas
	const {
		name: title,
		description,
		image,
		featuredImage,
		thumbnailUrl,
		coverImage,
	} = normalizedEntity;

	// Determinar la imagen a mostrar usando cualquier propiedad de imagen disponible
	const displayImage =
		image ||
		featuredImage ||
		thumbnailUrl ||
		coverImage ||
		(typeof normalizedEntity.avatar === 'string' ? normalizedEntity.avatar : undefined);

	// Asegurar modo seguro: desactivar efectos avanzados de las opciones para evitar problemas de rendimiento
	const safeOptions = {
		...options,
		// Forzar desactivación de efectos costosos
		enable3DEffect: false,
		enableHolographicEffect: false,
		enableGlowEffect: false,
		enableScanlines: false,
		enableAnimatedBorder: false,
		enableGrainEffect: false,
		// Mantener opciones de diseño básicas
		designSystem: options.designSystem,
	};

	// Logs de depuración en desarrollo
	if (process.env.NODE_ENV === 'development') {
		// Crear un grupo para la información de depuración
		console.group(`🎴 Adaptador EntityCard [${entityType}]: ${normalizedEntity.id}`);

		// Información general
		console.info('📄 Renderizando EntityCardAdapter simplificado');
		console.info('🏷️ Tipo de entidad:', entityType);
		console.info('🆔 ID:', normalizedEntity.id);
		console.info('📝 Título:', title || 'Sin título');

		// Analizar qué capas están disponibles
		const availableSystems = [];
		const activatedSystems = [];

		// Sistemas base siempre presentes
		availableSystems.push('BaseSystem', 'RenderingSystem');
		activatedSystems.push('BaseSystem', 'RenderingSystem');

		// Ver si hay sistema de imágenes
		if (displayImage) {
			availableSystems.push('ImageSystem');
			activatedSystems.push('ImageSystem');
		}

		// Verificar opciones de diseño
		if (safeOptions.designSystem) {
			availableSystems.push('DesignSystem');
			activatedSystems.push('DesignSystem');
		}

		// Mostrar sistemas
		console.info('🧩 Sistemas disponibles:', availableSystems.join(', '));
		console.info('✅ Sistemas activados:', activatedSystems.join(', '));

		// Si había efectos en las opciones originales que fueron desactivados, mostrar advertencia
		const disabledEffects = [];
		if (options.enable3DEffect) disabledEffects.push('3DEffect');
		if (options.enableHolographicEffect) disabledEffects.push('HolographicEffect');
		if (options.enableGlowEffect) disabledEffects.push('GlowEffect');
		if (options.enableScanlines) disabledEffects.push('Scanlines');
		if (options.enableAnimatedBorder) disabledEffects.push('AnimatedBorder');
		if (options.enableGrainEffect) disabledEffects.push('GrainEffect');

		if (disabledEffects.length > 0) {
			console.warn('⚠️ Efectos desactivados automáticamente por modo seguro:', disabledEffects.join(', '));
			console.info('💡 Usa el modo "complex" si necesitas estos efectos, pero puede afectar al rendimiento');
		}

		// Datos específicos según el tipo de entidad
		switch (entityType) {
			case 'folder':
				console.info('📁 Estadísticas de carpeta:', {
					imágenes: normalizedEntity._count?.images || 0,
					tamaño: normalizedEntity.totalSize || 'desconocido'
				});
				break;
			case 'album':
				console.info('📚 Estadísticas de álbum:', {
					imágenes: normalizedEntity._count?.images || 0
				});
				break;
			case 'character':
				console.info('👤 Información de personaje:', {
					stats: normalizedEntity.stats || 'no disponible',
					relationships: normalizedEntity.relationships?.length || 0
				});
				break;
			// Más casos según sea necesario
		}

		console.groupEnd();
	}

	// Renderizar usando el EntityCard simplificado con opciones seguras
	return (
		<EntityCard
			title={title || 'Sin título'}
			description={description || ''}
			image={displayImage}
			options={safeOptions}
			className={className}
			onClick={onClick}
		/>
	);
}

/**
 * Adaptador genérico para mostrar tarjetas de entidades
 * Este componente es memoizado para evitar renderizados innecesarios
 */
export const EntityCardAdapter = React.memo(
	function EntityCardAdapterComponent({
		entityType,
		entity,
		options = {},
		onClick,
		showVisualConfig,
		onVisualConfigClick,
		enableExplode,
		isExploded,
		activeLayer,
		onExplodedChange,
		onActiveLayerChange,
		className,
	}: EntityCardAdapterProps) {
		const [cardOptions, setCardOptions] = useState<CardOptions>(options as CardOptions);
		const [isLoadingPreset, setIsLoadingPreset] = useState<boolean>(false);
		const entityRef = useRef(entity);
		const optionsRef = useRef(options);

		// Prevenir bucle infinito normalizando la entidad y opciones
		useEffect(() => {
			// Solo actualizar refs si hay cambios reales
			if (entity !== entityRef.current) {
				entityRef.current = entity;
			}
			if (options !== optionsRef.current) {
				optionsRef.current = options;
			}
		}, [entity, options]);

		// Efecto para cargar el preset si la entidad tiene uno
		useEffect(() => {
			// Solo ejecutar este efecto si entityType, entityRef o optionsRef cambian
			debug.logEffect('loadPreset', [entityType, entityRef.current.id, entityRef.current.presetId]);

			// Validar y normalizar la entidad para diagnóstico
			if (process.env.NODE_ENV === 'development') {
				debugEntityData(entityRef.current, entityType, 'EntityCardAdapter');
			}

			// Solo cargar el preset si la entidad tiene un presetId
			if (entityRef.current?.presetId) {
				setIsLoadingPreset(true);

				// Valores por defecto basados en las opciones proporcionadas
				const defaultOptions = optionsRef.current as CardOptions;

				// Cargar el preset usando una función estable
				loadEntityPresetConfig(entityRef.current, entityType, defaultOptions)
					.then(presetOptions => {
						debug.logState('cardOptions', presetOptions);
						// Actualizar las opciones con las del preset
						setCardOptions(presetOptions);
					})
					.catch(error => {
						console.error('Error cargando preset para tarjeta de entidad:', error);
						// En caso de error, usar las opciones proporcionadas
						setCardOptions(defaultOptions);
					})
					.finally(() => {
						setIsLoadingPreset(false);
					});
			} else {
				// Si no hay presetId, usar las opciones proporcionadas directamente
				debug.logState('cardOptions (default)', optionsRef.current);
				setCardOptions(optionsRef.current as CardOptions);
				setIsLoadingPreset(false);
			}
		}, [entityType]);

		// Verificar que la entidad existe
		if (!entity) {
			console.error(`Error: La entidad de tipo ${entityType} es undefined`);
			return (
				<div className="error-card p-4 border border-red-500 rounded-md">
					<h3 className="text-red-500 font-medium">Error de datos</h3>
					<p className="text-sm text-gray-500">No se pudo cargar la información de la entidad</p>
				</div>
			);
		}

		// Si el preset está cargando, mostrar una versión simplificada de la tarjeta
		if (isLoadingPreset) {
			return (
				<div className="loading-card p-4 border border-muted rounded-md animate-pulse">
					<div className="h-32 bg-muted/30 rounded-md mb-2" />
					<div className="h-4 w-2/3 bg-muted/30 rounded-md" />
					<div className="h-3 w-1/2 bg-muted/30 rounded-md mt-2" />
				</div>
			);
		}

		// Pasamos las propiedades comunes a todos los tipos de tarjetas
		const commonProps = {
			onClick,
			className,
			showVisualConfig,
			onVisualConfigClick,
			enableExplode,
			isExploded,
			activeLayer,
			onExplodedChange,
			onActiveLayerChange,
			options: cardOptions as CardOptions,
		};

		// Normalizar la entidad antes de pasarla a los componentes
		const normalizedEntity = normalizeEntityData(entity, entityType);

		// Renderizamos el adaptador según el tipo de entidad
		switch (entityType) {
			case 'folder':
				return <FolderCard folder={normalizedEntity as Folder} {...commonProps} />;

			case 'album': {
				// Preparamos los datos necesarios para AlbumCard usando la función de normalización
				const albumData = {
					...normalizedEntity,
					// Asegurar que createdAt es una fecha
					createdAt: normalizedEntity.createdAt instanceof Date
						? normalizedEntity.createdAt
						: new Date(normalizedEntity.createdAt || Date.now()),
					// Asegurar que _count existe
					_count: normalizedEntity._count || { images: normalizedEntity.imageCount || 0 },
				};
				return <AlbumCard data={albumData as CardData} {...commonProps} />;
			}

			case 'tag':
				return <TagsCard tag={normalizedEntity as Tag} {...commonProps} />;

			case 'collection':
				return <CollectionCard collection={normalizedEntity as Collection} {...commonProps} />;

			case 'character': {
				return <CharacterCard character={normalizedEntity as CharacterCardProps['character']} {...commonProps} />;
			}

			case 'place':
				return <PlaceCard place={normalizedEntity as Place} {...commonProps} />;

			case 'world-item':
			case 'worldItem':
				return <WorldItemAdapter worldItem={normalizedEntity as WorldItem} {...commonProps} />;

			case 'concept': {
				return <ConceptCard concept={normalizedEntity as ConceptCardProps['concept']} {...commonProps} />;
			}

			case 'prompt': {
				return <PromptCard prompt={normalizedEntity as PromptCardProps['prompt']} {...commonProps} />;
			}

			case 'note': {
				return <NoteCard note={normalizedEntity as NoteCardProps['note']} {...commonProps} />;
			}

			default:
				console.warn(`No se ha implementado todavía un layout para el tipo de entidad: ${entityType}`);
				return (
					<div className="error-card p-4 border border-red-500 rounded-md">
						<h3 className="text-red-500 font-medium">Tipo de entidad no soportado</h3>
						<p className="text-sm text-gray-500">No se ha encontrado un layout para: {entityType}</p>
					</div>
				);
		}
	},
	(prevProps, nextProps) => {
		// Función de comparación personalizada para evitar re-renderizados innecesarios
		// Solo re-renderizar si cambian propiedades clave
		const sameEntity = prevProps.entity.id === nextProps.entity.id;
		const sameType = prevProps.entityType === nextProps.entityType;
		const sameExploded = prevProps.isExploded === nextProps.isExploded;
		const sameLayer = prevProps.activeLayer === nextProps.activeLayer;

		// Comparación más segura de opciones
		let sameOptions = false;
		try {
			sameOptions = JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options);
		} catch (e) {
			// Si hay error al serializar, comparar referencias
			sameOptions = prevProps.options === nextProps.options;
		}

		// Solo para depuración
		if (process.env.NODE_ENV === 'development' && !sameEntity) {
			debug.logRender({
				message: 'Re-renderizado por cambio de entidad',
				prevId: prevProps.entity.id,
				nextId: nextProps.entity.id
			});
		}

		return sameEntity && sameType && sameExploded && sameLayer && sameOptions;
	}
);
