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
export {
	generateAnimatedVideoThumbnail,
	generateStaticVideoThumbnail,
	generateVideoThumbnailUrl,
} from './thumbnail-helpers';

export { generateVideoDownloadUrl, generateVideoStreamUrl } from './url-helpers';

export { getDefaultVideoVisualConfig, hasVisualConfigChanged } from './visual-config-helpers';
