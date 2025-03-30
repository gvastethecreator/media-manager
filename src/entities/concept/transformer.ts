/**
 * @file Transformer para la entidad Concept
 * @module entities/concept/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { Concept, ConceptFilters, ConceptSortCriteria, ConceptWithRelations, CreateConceptData, UpdateConceptData } from '@/types/entities/concept/types';
import { mapConceptSearchOptionsToPrisma, mapCreateConceptDataToPrisma, mapUpdateConceptDataToPrisma } from './mappers';
import { extendConcept, extendConceptWithStats, validateConcept } from './serializers';

/**
 * Transformer para la entidad Concept
 */
export class ConceptTransformer {
  /**
   * Busca múltiples conceptos con opciones de filtrado y paginación
   */
  static async findMany(options: {
    take?: number;
    skip?: number;
    sortBy?: ConceptSortCriteria;
    filters?: ConceptFilters;
    include?: Record<string, boolean>;
  } = {}): Promise<{ items: ConceptWithRelations[]; total: number; hasMore: boolean }> {
    try {
      const prismaOptions = mapConceptSearchOptionsToPrisma(options);
      const [items, total] = await Promise.all([
        prisma.concept.findMany(prismaOptions),
        prisma.concept.count({ where: prismaOptions.where })
      ]);

      const extendedItems = items.map(item => extendConcept(item as Concept));
      const hasMore = (options.skip || 0) + items.length < total;

      return { items: extendedItems, total, hasMore };
    } catch (error) {
      logger.error('Error buscando conceptos:', error);
      throw error;
    }
  }

  /**
   * Busca un concepto por su ID
   */
  static async findById(id: string, include?: Record<string, boolean>): Promise<ConceptWithRelations | null> {
    try {
      const concept = await prisma.concept.findUnique({
        where: { id },
        include: {
          _count: true,
          ...(include?.images && { images: true }),
          ...(include?.videos && { videos: true }),
          ...(include?.albums && { albums: true }),
          ...(include?.collections && { collections: true }),
          ...(include?.tagEntities && { tags: true }),
          ...(include?.characters && { characters: true }),
          ...(include?.places && { places: true }),
          ...(include?.worldItems && { worldItems: true }),
          ...(include?.prompts && { prompts: true }),
          ...(include?.notes && { notes: true }),
          ...(include?.wildcards && { wildcards: true }),
          ...(include?.properties && { properties: true }),
          ...(include?.groups && { groups: true })
        }
      });

      return concept ? extendConcept(concept as Concept) : null;
    } catch (error) {
      logger.error(`Error buscando concepto con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo concepto
   */
  static async create(data: CreateConceptData): Promise<ConceptWithRelations> {
    try {
      const prismaData = mapCreateConceptDataToPrisma(data);
      const concept = await prisma.concept.create({
        data: prismaData,
        include: {
          _count: true,
          groups: true,
          properties: true,
          wildcards: true
        }
      });

      return extendConcept(concept as Concept);
    } catch (error) {
      logger.error('Error creando concepto:', error);
      throw error;
    }
  }

  /**
   * Actualiza un concepto existente
   */
  static async update(id: string, data: UpdateConceptData): Promise<ConceptWithRelations> {
    try {
      const prismaData = mapUpdateConceptDataToPrisma(data);
      const concept = await prisma.concept.update({
        where: { id },
        data: prismaData,
        include: {
          _count: true,
          groups: true,
          properties: true,
          wildcards: true
        }
      });

      return extendConcept(concept as Concept);
    } catch (error) {
      logger.error(`Error actualizando concepto con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un concepto
   */
  static async delete(id: string): Promise<ConceptWithRelations> {
    try {
      const concept = await prisma.concept.delete({
        where: { id },
        include: {
          _count: true,
          groups: true,
          properties: true,
          wildcards: true
        }
      });

      return extendConcept(concept as Concept);
    } catch (error) {
      logger.error(`Error eliminando concepto con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca conceptos relacionados con el contenido dado
   */
  static async findRelatedByContent(content: string, limit = 5): Promise<ConceptWithRelations[]> {
    try {
      // Buscar palabras clave en el contenido
      const keywords = extractKeywordsFromContent(content);

      if (keywords.length === 0) {
        return [];
      }

      // Buscar conceptos que coincidan con las palabras clave
      const concepts = await prisma.concept.findMany({
        where: {
          OR: [
            { name: { in: keywords } },
            { tags: { contains: keywords.join(',') } },
            { content: { contains: keywords.join(' ') } }
          ]
        },
        take: limit,
        include: { _count: true }
      });

      return concepts.map(concept => extendConcept(concept as Concept));
    } catch (error) {
      logger.error('Error buscando conceptos relacionados por contenido:', error);
      throw error;
    }
  }

  /**
   * Extiende un concepto con datos adicionales
   */
  static extend(concept: Concept): ConceptWithRelations {
    return extendConcept(concept);
  }

  /**
   * Enriquece un concepto con estadísticas
   */
  static extendWithStats(concept: Concept) {
    return extendConceptWithStats(concept);
  }

  /**
   * Valida un concepto
   */
  static validate(concept: Concept): boolean {
    return validateConcept(concept);
  }
}

/**
 * Extrae palabras clave de un contenido
 * @private
 */
function extractKeywordsFromContent(content: string): string[] {
  // Una implementación básica - en una aplicación real esto sería más sofisticado
  if (!content) return [];

  // Eliminar signos de puntuación, convertir a minúsculas y dividir por espacios
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3) // Filtrar palabras muy cortas
    .filter(word => !COMMON_WORDS.includes(word)); // Filtrar palabras comunes

  // Eliminar duplicados y limitar a 10 palabras
  return [...new Set(words)].slice(0, 10);
}

/**
 * Lista de palabras comunes a filtrar
 * @private
 */
const COMMON_WORDS = [
  'como', 'para', 'este', 'esta', 'estos', 'estas', 'entre', 'sobre', 'desde', 'hasta',
  'ante', 'bajo', 'cabe', 'contra', 'según', 'durante', 'mediante', 'porque', 'cuando'
];

// Exportar funciones individuales para uso directo
export const findManyConcepts = ConceptTransformer.findMany;
export const findConceptById = ConceptTransformer.findById;
export const createConcept = ConceptTransformer.create;
export const updateConcept = ConceptTransformer.update;
export const deleteConcept = ConceptTransformer.delete;
export const findRelatedConceptsByContent = ConceptTransformer.findRelatedByContent;
export const extendConceptTransform = ConceptTransformer.extend;
export const extendConceptWithStatsTransform = ConceptTransformer.extendWithStats;
export const validateConceptData = ConceptTransformer.validate;