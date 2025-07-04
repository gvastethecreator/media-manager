/**
 * @file Configuración y registro de todos los tipos de entidades para el Details Panel
 * @module components/panels/details-panel/registry-setup
 */

import { CollectionDetails, CollectionMetadata, CollectionPreview, CollectionToolbar } from './entities/collection-details';
import { FolderDetails, FolderMetadata, FolderPreview, FolderToolbar } from './entities/folder-details';

// Importar componentes específicos
import { ImageDetails, ImageMetadata, ImagePreview, ImageToolbar } from './entities/image-details';
import { VideoDetails, VideoMetadata, VideoPreview, VideoToolbar } from './entities/video-details';
import type {
	EntityDetailsProps,
	EntityMetadataProps, 
	EntityPreviewProps,
	EntityToolbarProps
} from './entity-details-registry';
import {
	AlbumActions,
	CollectionActions,
	createEntityConfig,
	DefaultInfoCategories, 
	entityDetailsRegistry,
	FolderActions,
	ImageActions,
	VideoActions
} from './entity-details-registry';

// Componentes genéricos para otros tipos
const GenericEntityDetails = ({ entity }: EntityDetailsProps) => {
	return (
		<div className="p-4 text-center text-muted-foreground">
			Componente específico en desarrollo
		</div>
	);
};

const GenericPreview = ({ entity }: EntityPreviewProps) => {
	return (
		<div className="h-32 bg-muted/30 flex items-center justify-center text-muted-foreground">
			Vista previa no disponible
		</div>
	);
};

const GenericToolbar = ({ entity, onAction }: EntityToolbarProps) => {
	return (
		<div className="p-2 text-xs text-muted-foreground">
			Herramientas en desarrollo
		</div>
	);
};

const GenericMetadata = ({ entity }: EntityMetadataProps) => {
	return (
		<div className="p-2 text-xs text-muted-foreground">
			Metadatos en desarrollo
		</div>
	);
};

/**
 * Inicializa el registro de entidades con todas las configuraciones
 */
export function initializeEntityRegistry() {
	// Registrar configuración para imágenes
	entityDetailsRegistry.register('image', createEntityConfig({
		detailsComponent: ImageDetails,
		previewComponent: ImagePreview,
		toolbarComponent: ImageToolbar,
		metadataComponent: ImageMetadata,
		actions: ImageActions,
		infoCategories: [
			DefaultInfoCategories.BASIC,
			DefaultInfoCategories.TECHNICAL,
			DefaultInfoCategories.METADATA,
			DefaultInfoCategories.STATISTICS,
		],
		supportsExpandedPreview: true,
		supportsInlineEdit: true,
	}));

	// Registrar configuración para videos
	entityDetailsRegistry.register('video', createEntityConfig({
		detailsComponent: VideoDetails,
		previewComponent: VideoPreview,
		toolbarComponent: VideoToolbar,
		metadataComponent: VideoMetadata,
		actions: VideoActions,
		infoCategories: [
			DefaultInfoCategories.BASIC,
			DefaultInfoCategories.TECHNICAL,
			DefaultInfoCategories.METADATA,
		],
		supportsExpandedPreview: true,
		supportsInlineEdit: false,
	}));

	// Registrar configuración para carpetas
	entityDetailsRegistry.register('folder', createEntityConfig({
		detailsComponent: FolderDetails,
		previewComponent: FolderPreview,
		toolbarComponent: FolderToolbar,
		metadataComponent: FolderMetadata,
		actions: FolderActions,
		infoCategories: [
			DefaultInfoCategories.BASIC,
			DefaultInfoCategories.STATISTICS,
			DefaultInfoCategories.RELATIONSHIPS,
		],
		supportsExpandedPreview: false,
		supportsInlineEdit: true,
	}));

	// Registrar configuración para colecciones
	entityDetailsRegistry.register('collection', createEntityConfig({
		detailsComponent: CollectionDetails,
		previewComponent: CollectionPreview,
		toolbarComponent: CollectionToolbar,
		metadataComponent: CollectionMetadata,
		actions: CollectionActions,
		infoCategories: [
			DefaultInfoCategories.BASIC,
			DefaultInfoCategories.METADATA,
			DefaultInfoCategories.STATISTICS,
			DefaultInfoCategories.RELATIONSHIPS,
		],
		supportsExpandedPreview: false,
		supportsInlineEdit: true,
	}));

	// Registrar configuración para álbumes
	entityDetailsRegistry.register('album', createEntityConfig({
		detailsComponent: GenericEntityDetails,
		previewComponent: GenericPreview,
		toolbarComponent: GenericToolbar,
		metadataComponent: GenericMetadata,
		actions: AlbumActions,
		infoCategories: [
			DefaultInfoCategories.BASIC,
			DefaultInfoCategories.METADATA,
			DefaultInfoCategories.STATISTICS,
			DefaultInfoCategories.RELATIONSHIPS,
		],
		supportsExpandedPreview: false,
		supportsInlineEdit: true,
	}));

	// Registrar tipos adicionales
	const additionalTypes = ['audio', 'document', 'character', 'tag', 'place'];

	for (const type of additionalTypes) {
		entityDetailsRegistry.register(type, createEntityConfig({
			detailsComponent: GenericEntityDetails,
			previewComponent: GenericPreview,
			toolbarComponent: GenericToolbar,
			metadataComponent: GenericMetadata,
			actions: [],
			infoCategories: [DefaultInfoCategories.BASIC, DefaultInfoCategories.METADATA],
			supportsExpandedPreview: false,
			supportsInlineEdit: false,
		}));
	}

	console.log('Registry de entidades inicializado con', entityDetailsRegistry.getRegisteredTypes().length, 'tipos');
}

/**
 * Obtiene estadísticas del registro
 */
export function getRegistryStats() {
	const types = entityDetailsRegistry.getRegisteredTypes();
	const stats = {
		totalTypes: types.length,
		typesWithExpandedPreview: 0,
		typesWithInlineEdit: 0,
		totalActions: 0,
	};

	for (const type of types) {
		const config = entityDetailsRegistry.getConfig(type);
		if (config) {
			if (config.supportsExpandedPreview) stats.typesWithExpandedPreview++;
			if (config.supportsInlineEdit) stats.typesWithInlineEdit++;
			stats.totalActions += config.actions.length;
		}
	}

	return stats;
}