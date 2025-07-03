/**
 * @file Registro de componentes específicos para cada tipo de entidad
 * @module components/panels/details-panel/entity-details-registry
 * @description Sistema de registro que mapea tipos de entidades a sus componentes específicos de detalles
 */

import type { ComponentType } from 'react';
import type { EntityWithStats } from '@/types/migration';
import { getEntityStatsType } from '@/types/migration';

// Imports de componentes específicos
import { ImageDetails, ImagePreview, ImageToolbar, ImageMetadata } from './entities/image-details';
import { VideoDetails, VideoPreview, VideoToolbar, VideoMetadata } from './entities/video-details';
import { FolderDetails, FolderPreview, FolderToolbar, FolderMetadata } from './entities/folder-details';
import { CollectionDetails, CollectionPreview, CollectionToolbar, CollectionMetadata } from './entities/collection-details';

// Tipos base para los componentes de detalles
export interface EntityDetailsProps<T extends EntityWithStats = EntityWithStats> {
	entity: T;
	isSelected?: boolean;
	onAction?: (action: string, data?: any) => void;
}

export interface EntityPreviewProps<T extends EntityWithStats = EntityWithStats> {
	entity: T;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	showControls?: boolean;
	onAction?: (action: string, data?: any) => void;
}

export interface EntityToolbarProps<T extends EntityWithStats = EntityWithStats> {
	entity: T;
	onAction: (action: string, data?: any) => void;
}

export interface EntityMetadataProps<T extends EntityWithStats = EntityWithStats> {
	entity: T;
	editable?: boolean;
	onUpdate?: (updates: Partial<T>) => void;
}

// Configuración completa para cada tipo de entidad
export interface EntityDetailsConfig<T extends EntityWithStats = EntityWithStats> {
	/** Componente principal de detalles */
	detailsComponent: ComponentType<EntityDetailsProps<T>>;
	/** Componente de preview/vista previa */
	previewComponent: ComponentType<EntityPreviewProps<T>>;
	/** Componente de toolbar con acciones específicas */
	toolbarComponent: ComponentType<EntityToolbarProps<T>>;
	/** Componente de metadatos editables */
	metadataComponent: ComponentType<EntityMetadataProps<T>>;
	/** Acciones disponibles para este tipo */
	actions: EntityAction[];
	/** Categorías de información a mostrar */
	infoCategories: string[];
	/** Si soporta preview expandido */
	supportsExpandedPreview: boolean;
	/** Si soporta edición en línea */
	supportsInlineEdit: boolean;
}

// Definición de acciones disponibles
export interface EntityAction {
	id: string;
	label: string;
	icon?: string;
	category: 'primary' | 'secondary' | 'destructive';
	shortcut?: string;
	condition?: (entity: EntityWithStats) => boolean;
}

// Registro global de configuraciones por tipo de entidad
class EntityDetailsRegistry {
	private configs = new Map<string, EntityDetailsConfig>();

	/**
	 * Registra una configuración para un tipo de entidad
	 */
	register<T extends EntityWithStats>(
		entityType: string,
		config: EntityDetailsConfig<T>
	): void {
		this.configs.set(entityType, config as EntityDetailsConfig);
	}

	/**
	 * Obtiene la configuración para un tipo de entidad
	 */
	getConfig(entityType: string): EntityDetailsConfig | undefined {
		return this.configs.get(entityType);
	}

	/**
	 * Obtiene la configuración para una entidad específica
	 */
	getConfigForEntity(entity: EntityWithStats): EntityDetailsConfig | undefined {
		const entityType = getEntityStatsType(entity);
		return this.getConfig(entityType);
	}

	/**
	 * Verifica si un tipo de entidad está registrado
	 */
	isRegistered(entityType: string): boolean {
		return this.configs.has(entityType);
	}

	/**
	 * Obtiene todos los tipos registrados
	 */
	getRegisteredTypes(): string[] {
		return Array.from(this.configs.keys());
	}

	/**
	 * Obtiene todas las acciones disponibles para un tipo
	 */
	getActionsForType(entityType: string): EntityAction[] {
		const config = this.getConfig(entityType);
		return config?.actions || [];
	}

	/**
	 * Obtiene las acciones aplicables para una entidad específica
	 */
	getActionsForEntity(entity: EntityWithStats): EntityAction[] {
		const config = this.getConfigForEntity(entity);
		if (!config) return [];

		return config.actions.filter(action =>
			!action.condition || action.condition(entity)
		);
	}
}

// Instancia singleton del registro
export const entityDetailsRegistry = new EntityDetailsRegistry();

// Acciones comunes que pueden ser reutilizadas
export const CommonActions: Record<string, EntityAction> = {
	VIEW: {
		id: 'view',
		label: 'Ver',
		icon: 'Eye',
		category: 'primary',
		shortcut: 'Enter',
	},
	EDIT: {
		id: 'edit',
		label: 'Editar',
		icon: 'Edit',
		category: 'primary',
		shortcut: 'F2',
	},
	DUPLICATE: {
		id: 'duplicate',
		label: 'Duplicar',
		icon: 'Copy',
		category: 'secondary',
		shortcut: 'Ctrl+D',
	},
	DELETE: {
		id: 'delete',
		label: 'Eliminar',
		icon: 'Trash2',
		category: 'destructive',
		shortcut: 'Delete',
	},
	SHARE: {
		id: 'share',
		label: 'Compartir',
		icon: 'Share',
		category: 'secondary',
	},
	DOWNLOAD: {
		id: 'download',
		label: 'Descargar',
		icon: 'Download',
		category: 'secondary',
		shortcut: 'Ctrl+S',
	},
	FAVORITE: {
		id: 'favorite',
		label: 'Favorito',
		icon: 'Heart',
		category: 'secondary',
		condition: (entity) => 'isFavorite' in entity,
	},
	TAG: {
		id: 'tag',
		label: 'Etiquetar',
		icon: 'Tag',
		category: 'secondary',
		shortcut: 'T',
	},
	MOVE: {
		id: 'move',
		label: 'Mover',
		icon: 'Move',
		category: 'secondary',
		shortcut: 'M',
	},
	COPY: {
		id: 'copy',
		label: 'Copiar',
		icon: 'Copy',
		category: 'secondary',
		shortcut: 'Ctrl+C',
	},
	RENAME: {
		id: 'rename',
		label: 'Renombrar',
		icon: 'Edit3',
		category: 'secondary',
		shortcut: 'F2',
	},
	PROPERTIES: {
		id: 'properties',
		label: 'Propiedades',
		icon: 'Settings',
		category: 'secondary',
		shortcut: 'Alt+Enter',
	},
};

// Acciones específicas por tipo
export const ImageActions: EntityAction[] = [
	CommonActions.VIEW,
	CommonActions.EDIT,
	{
		id: 'rotate-left',
		label: 'Rotar izquierda',
		icon: 'RotateCcw',
		category: 'secondary',
		shortcut: 'Ctrl+L',
	},
	{
		id: 'rotate-right',
		label: 'Rotar derecha',
		icon: 'RotateCw',
		category: 'secondary',
		shortcut: 'Ctrl+R',
	},
	{
		id: 'crop',
		label: 'Recortar',
		icon: 'Crop',
		category: 'secondary',
		shortcut: 'C',
	},
	{
		id: 'enhance',
		label: 'Mejorar',
		icon: 'Wand2',
		category: 'secondary',
	},
	CommonActions.FAVORITE,
	CommonActions.TAG,
	CommonActions.SHARE,
	CommonActions.DOWNLOAD,
	CommonActions.MOVE,
	CommonActions.DUPLICATE,
	CommonActions.DELETE,
];

export const VideoActions: EntityAction[] = [
	CommonActions.VIEW,
	{
		id: 'play',
		label: 'Reproducir',
		icon: 'Play',
		category: 'primary',
		shortcut: 'Space',
	},
	{
		id: 'extract-frame',
		label: 'Extraer frame',
		icon: 'Image',
		category: 'secondary',
	},
	{
		id: 'trim',
		label: 'Recortar',
		icon: 'Scissors',
		category: 'secondary',
	},
	CommonActions.FAVORITE,
	CommonActions.TAG,
	CommonActions.SHARE,
	CommonActions.DOWNLOAD,
	CommonActions.MOVE,
	CommonActions.DUPLICATE,
	CommonActions.DELETE,
];

export const FolderActions: EntityAction[] = [
	CommonActions.VIEW,
	{
		id: 'open',
		label: 'Abrir',
		icon: 'FolderOpen',
		category: 'primary',
		shortcut: 'Enter',
	},
	{
		id: 'scan',
		label: 'Escanear',
		icon: 'Search',
		category: 'secondary',
		shortcut: 'F5',
	},
	{
		id: 'create-album',
		label: 'Crear álbum',
		icon: 'Plus',
		category: 'secondary',
	},
	CommonActions.FAVORITE,
	CommonActions.TAG,
	CommonActions.MOVE,
	CommonActions.RENAME,
	CommonActions.PROPERTIES,
	CommonActions.DELETE,
];

export const CollectionActions: EntityAction[] = [
	CommonActions.VIEW,
	CommonActions.EDIT,
	{
		id: 'add-items',
		label: 'Añadir elementos',
		icon: 'Plus',
		category: 'secondary',
	},
	{
		id: 'remove-items',
		label: 'Quitar elementos',
		icon: 'Minus',
		category: 'secondary',
	},
	{
		id: 'export',
		label: 'Exportar',
		icon: 'Download',
		category: 'secondary',
	},
	CommonActions.FAVORITE,
	CommonActions.TAG,
	CommonActions.SHARE,
	CommonActions.DUPLICATE,
	CommonActions.DELETE,
];

export const AlbumActions: EntityAction[] = [
	CommonActions.VIEW,
	CommonActions.EDIT,
	{
		id: 'slideshow',
		label: 'Presentación',
		icon: 'Presentation',
		category: 'primary',
		shortcut: 'F11',
	},
	{
		id: 'add-images',
		label: 'Añadir imágenes',
		icon: 'ImagePlus',
		category: 'secondary',
	},
	{
		id: 'remove-images',
		label: 'Quitar imágenes',
		icon: 'ImageMinus',
		category: 'secondary',
	},
	CommonActions.FAVORITE,
	CommonActions.TAG,
	CommonActions.SHARE,
	CommonActions.DUPLICATE,
	CommonActions.DELETE,
];

// Categorías de información por defecto
export const DefaultInfoCategories = {
	BASIC: 'basic',
	TECHNICAL: 'technical',
	METADATA: 'metadata',
	RELATIONSHIPS: 'relationships',
	STATISTICS: 'statistics',
	HISTORY: 'history',
	AI_GENERATED: 'ai_generated',
} as const;

// Helper para crear configuraciones rápidamente
export function createEntityConfig<T extends EntityWithStats>(
	config: Partial<EntityDetailsConfig<T>> & {
		detailsComponent: ComponentType<EntityDetailsProps<T>>;
	}
): EntityDetailsConfig<T> {
	return {
		previewComponent: config.previewComponent || (() => null),
		toolbarComponent: config.toolbarComponent || (() => null),
		metadataComponent: config.metadataComponent || (() => null),
		actions: config.actions || [],
		infoCategories: config.infoCategories || [
			DefaultInfoCategories.BASIC,
			DefaultInfoCategories.METADATA,
		],
		supportsExpandedPreview: config.supportsExpandedPreview ?? false,
		supportsInlineEdit: config.supportsInlineEdit ?? false,
		...config,
	};
}