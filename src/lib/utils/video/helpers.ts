/**
 * @file Funciones auxiliares para el manejo de videos (archivo principal - re-exports)
 * @module utils/video/helpers
 */

// Re-export desde módulos especializados para mantener compatibilidad con imports existentes
export {
	calculateBitrate,
	formatVideoDimensions,
	formatVideoDuration,
	formatVideoSize,
	getVideoFormatDescription,
} from './format-helpers';
export {
	extractVideoTagSuggestions,
	getVideoQualityLabel,
	hasCompleteMetadata,
	isHDVideo,
} from './metadata-helpers';
// Client-safe thumbnail helper
export { generateVideoThumbnailUrl } from './thumbnail-helpers';

// NOTE: generateAnimatedVideoThumbnail and generateStaticVideoThumbnail are server-only
// Import them directly from './thumbnail-helpers.server' when needed on the server

export { generateVideoDownloadUrl, generateVideoStreamUrl } from './url-helpers';

export { getDefaultVideoVisualConfig, hasVisualConfigChanged } from './visual-config-helpers';
