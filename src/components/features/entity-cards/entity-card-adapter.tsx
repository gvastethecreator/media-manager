'use client';

// Definir un tipo genérico para entidades si no existe en @/types/entities
interface Entity {
	id: string;
	name: string;
	description?: string;
	[key: string]: unknown;
}

import { useEffect, useState } from 'react';
import type { CardOptions } from './types';

// Importamos la función de utilidad para generar configuración de rareza
import { generateRarityConfig } from './utils/rarity-utils';

// Definir un tipo para los componentes de tarjeta
type CardComponent = (props: Record<string, unknown>) => JSX.Element;

// Definición simplificada para el registro de componentes de tarjeta
const ENTITY_ADAPTERS: Record<string, CardComponent> = {};

// Función para cargar dinámicamente los adaptadores
const loadAdapters = async () => {
	// Importamos los adaptadores de tarjeta dinámicamente
	const folderModule = await import('./layouts/folder-card');
	const albumModule = await import('./layouts/album-card');
	const tagModule = await import('./layouts/tag-card');
	const collectionModule = await import('./layouts/collection-card');
	const characterModule = await import('./layouts/character-card');
	const placeModule = await import('./layouts/place-card');
	const worldItemModule = await import('./layouts/world-item-card');
	const conceptModule = await import('./layouts/concept-card');
	const promptModule = await import('./layouts/prompt-card');
	const noteModule = await import('./layouts/note-card');

	// Asignamos los adaptadores al objeto
	ENTITY_ADAPTERS.folder = folderModule.FolderCard;
	ENTITY_ADAPTERS.album = albumModule.AlbumCard;
	ENTITY_ADAPTERS.tag = tagModule.TagCard;
	ENTITY_ADAPTERS.collection = collectionModule.CollectionCard;
	ENTITY_ADAPTERS.character = characterModule.CharacterCard;
	ENTITY_ADAPTERS.place = placeModule.PlaceCard;
	ENTITY_ADAPTERS['world-item'] = worldItemModule.WorldItemCard;
	ENTITY_ADAPTERS.worldItem = worldItemModule.WorldItemCard;
	ENTITY_ADAPTERS.concept = conceptModule.ConceptCard;
	ENTITY_ADAPTERS.prompt = promptModule.PromptCard;
	ENTITY_ADAPTERS.note = noteModule.NoteCard;
};

// Cargar los adaptadores al inicializar
loadAdapters().catch((error) => {
	console.error('Error al cargar adaptadores de tarjeta:', error);
});

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

// Exportamos la función de utilidad para generar configuración de rareza
export { generateRarityConfig };

/**
 * Adaptador genérico para cualquier tipo de entidad
 * Selecciona el layout apropiado según el tipo de entidad
 */
export function EntityCardAdapter({
	entityType,
	entity,
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
}: EntityCardAdapterProps) {
	// Estado para manejar la carga de datos adicionales si es necesario
	const [enhancedEntity, setEnhancedEntity] = useState<Entity>(entity);
	// Estado para controlar si los adaptadores están cargados
	const [adaptersLoaded, setAdaptersLoaded] = useState(false);

	// Efecto para verificar si los adaptadores están cargados
	useEffect(() => {
		// Verificar si los adaptadores están cargados
		if (Object.keys(ENTITY_ADAPTERS).length > 0) {
			setAdaptersLoaded(true);
		} else {
			// Si no están cargados, intentar cargarlos de nuevo
			loadAdapters()
				.then(() => setAdaptersLoaded(true))
				.catch((error) => {
					console.error('Error al cargar adaptadores de tarjeta:', error);
				});
		}
	}, []);

	// Efecto para cargar datos adicionales según el tipo de entidad
	useEffect(() => {
		// Función para cargar datos adicionales de carpetas
		const loadFolderData = async (folderId: string) => {
			try {
				// Solo cargar datos adicionales si no están ya presentes
				if (!entity.totalFiles && !entity.totalSize) {
					const response = await fetch(`/api/folders/${folderId}/stats`);
					if (response.ok) {
						const stats = await response.json();
						setEnhancedEntity({
							...entity,
							totalFiles: stats.totalFiles || 0,
							totalSize: stats.totalSize || 0,
							imageCount: stats.imageCount || 0,
							lastIndexed: stats.lastIndexed || null,
						});
					}
				}
			} catch (error) {
				console.error('Error al cargar estadísticas de carpeta:', error);
			}
		};

		// Cargar datos adicionales según el tipo de entidad
		if (entityType === 'folder' && entity.id) {
			loadFolderData(entity.id);
		}

		// Para otros tipos de entidad, podríamos añadir más lógica aquí
	}, [entityType, entity]);

	// Si los adaptadores no están cargados, mostrar un indicador de carga
	if (!adaptersLoaded) {
		return (
			<div className="loading-card p-4 border border-gray-200 rounded-md">
				<p className="text-sm text-gray-500">Cargando componente de tarjeta...</p>
			</div>
		);
	}

	// Propiedades comunes para todos los tipos de tarjetas
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
		options,
	};

	// Obtener el adaptador correspondiente al tipo de entidad
	const CardAdapter = ENTITY_ADAPTERS[entityType];

	if (CardAdapter) {
		// Crear un objeto con la propiedad específica para este tipo de entidad
		const entityProp = { [entityType]: { ...enhancedEntity, presetId: enhancedEntity.presetId || null } };
		// Combinar las propiedades comunes con la propiedad específica de la entidad
		return <CardAdapter {...commonProps} {...entityProp} />;
	}

	// Mensaje de error si no hay adaptador para este tipo
	console.warn(`No se ha implementado todavía un layout para el tipo de entidad: ${entityType}`);
	return (
		<div className="error-card p-4 border border-red-500 rounded-md">
			<h3 className="text-red-500 font-medium">Tipo de entidad no soportado</h3>
			<p className="text-sm text-gray-500">No se ha encontrado un layout para: {entityType}</p>
		</div>
	);
}
