// Re-exportar servicio principal con API pública original

// Re-exportar core service para código nuevo
export { FileEntityMapperCore } from './core.service';
export { FileEntityMapperService } from './file-entity-mapper.service';
export { AudioProcessor } from './processors/audio.processor';
export { DocumentProcessor } from './processors/document.processor';
export { File3DProcessor } from './processors/file3d.processor';
// Re-exportar procesadores especializados
export { ImageProcessor } from './processors/image.processor';
export { JsonProcessor } from './processors/json.processor';
export { VideoProcessor } from './processors/video.processor';
export { getEntityTypeFromExtension, getFileInfo, getMimeTypeFromExtension } from './utils/file-info.utils';
// Re-exportar utilidades
export { calculateFileHash, clearHashCache } from './utils/hash.utils';
export { MetricsCollector } from './utils/metrics.utils';
