import { serverLogger } from '@/lib/logger/server-logger';
import type { ConceptBase, ConceptExtended } from '@/types/entities/concept';

const serializersLogger = serverLogger.withContext('ConceptSerializers');

/**
 * Serializa un array de tags desde un string JSON
 * @param tagsString String JSON con tags
 * @returns Array de strings con los tags
 */
export function serializeTags(tagsString?: string | null): string[] {
  if (!tagsString) return [];

  try {
    if (tagsString === 'empty_array') return [];
    const parsed = JSON.parse(tagsString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    serializersLogger.error('❌ Error al serializar tags:', error);
    return [];
  }
}

/**
 * Deserializa un array de tags a string JSON
 * @param tags Array de tags
 * @returns String JSON con los tags
 */
export function deserializeTags(tags: string[]): string {
  try {
    return tags && tags.length > 0 ? JSON.stringify(tags) : 'empty_array';
  } catch (error) {
    serializersLogger.error('❌ Error al deserializar tags:', error);
    return 'empty_array';
  }
}

/**
 * Transforma un concepto base a un concepto extendido con propiedades para UI
 * @param concept Concepto base
 * @returns Concepto extendido
 */
export function toExtendedConcept(concept: ConceptBase): ConceptExtended {
  return {
    ...concept,
    parsedTags: serializeTags(concept.tags),
    previewContent: concept.content ? getPreviewContent(concept.content) : undefined,
    lastUpdated: concept.updatedAt instanceof Date ? concept.updatedAt : new Date(concept.updatedAt),
  };
}

/**
 * Genera un preview del contenido para mostrar en UI
 * @param content Contenido completo
 * @param maxLength Longitud máxima del preview
 * @returns Preview del contenido
 */
function getPreviewContent(content: string, maxLength = 150): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;

  return `${content.substring(0, maxLength)}...`;
}