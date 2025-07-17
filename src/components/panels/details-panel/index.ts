// Exportar el componente principal para uso externo
export { DetailsPanelV2 } from './details-panel';

// Componentes de demostración
export { DetailsPanelShowcase } from './details-panel-showcase';
// Componentes específicos de entidades
export { ImageDetails, ImageMetadata, ImagePreview, ImageToolbar } from './entities/image-details';
export type {
	EntityAction,
	EntityDetailsConfig,
	EntityDetailsProps,
	EntityMetadataProps,
	EntityPreviewProps,
	EntityToolbarProps,
} from './entity-details-registry';
// Sistema de registro y configuración
export { entityDetailsRegistry } from './entity-details-registry';
export type { DetailsPanelIntegrationProps } from './integration-hook';
// Hooks de integración
export {
	useDetailsPanelComplete,
	useDetailsPanelIntegration,
	useEntityActions,
} from './integration-hook';
