import { logger } from '@/lib/logger';
import type { FileMetadata } from '@/types/metadata';

const metadataLogger = logger.withContext('MetadataParser');

export function parseMetadata(metadata: string | null): FileMetadata | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata);
    if (!parsed || typeof parsed !== 'object') {
      metadataLogger.warn('Metadata inválida:', metadata);
      return null;
    }
    return parsed;
  } catch (error) {
    metadataLogger.error('Error parseando metadata:', error);
    return null;
  }
}

export function stringifyMetadata(metadata: FileMetadata | null): string | null {
  if (!metadata) return null;
  try {
    return JSON.stringify(metadata);
  } catch (error) {
    metadataLogger.error('Error stringificando metadata:', error);
    return null;
  }
}