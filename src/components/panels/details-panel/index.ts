// Exportar el componente principal para uso externo
export * from './details-panel';
export { DetailsPanel as DetailsPanelV2 } from './details-panel'; // Alias para compatibilidad

// Componentes de demostración
export { DetailsPanelShowcase } from './details-panel-showcase';

// Sistema de registro y configuración
export { entityDetailsRegistry } from './entity-details-registry';
export type {
	EntityDetailsConfig,
	EntityAction,
	EntityDetailsProps,
	EntityPreviewProps,
	EntityToolbarProps,
	EntityMetadataProps
} from './entity-details-registry';

// Hooks de integración
export {
	useDetailsPanelIntegration,
	useEntityActions,
	useDetailsPanelComplete
} from './integration-hook';
export type { DetailsPanelIntegrationProps } from './integration-hook';

// Componentes específicos de entidades
export { ImageDetails, ImagePreview, ImageToolbar, ImageMetadata } from './entities/image-details';
