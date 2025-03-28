/**
 * Punto de entrada centralizado para componentes base de tarjetas
 * Facilita la importación y mantiene la consistencia en todo el sistema
 */

// Exportar componentes y tipos del layout base
export { BaseCardLayout } from './base-card-layout';
export type { BaseCardLayoutProps, BaseEntityCardProps } from './base-card-layout';

// Exportar componentes de secciones
export {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardImageSection,
	CardMetadataSection,
} from './card-sections';

export type {
	CardDescriptionSectionProps,
	CardFooterProps,
	CardHeaderProps,
	CardImageSectionProps,
	CardMetadataSectionProps,
	MetadataItem,
} from './card-sections';
