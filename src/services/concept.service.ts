import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { EventEmitter } from 'events'
import type { Concept } from '@prisma/client'
import type { ConceptCreate } from '@/types/entities'

const conceptLogger = logger.withContext('ConceptService')

interface ConceptEvents {
  CONCEPT_CREATED: string
  CONCEPT_UPDATED: string
  CONCEPT_DELETED: string
  CONCEPTS_CHANGED: string
}

interface ConceptFilters {
  category?: string
  search?: string
  tags?: string[]
  sortBy?: 'createdAt' | 'name' | 'category'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface ConceptStats {
  total: number
  byCategory: Record<string, number>
  byTag: Record<string, number>
}

interface ConceptResults {
  items: Concept[]
  total: number
  page: number
  pageSize: number
  stats: ConceptStats
}

class ConceptService extends EventEmitter {
  private static instance: ConceptService
  private readonly EVENTS: ConceptEvents = {
    CONCEPT_CREATED: 'concept:created',
    CONCEPT_UPDATED: 'concept:updated',
    CONCEPT_DELETED: 'concept:deleted',
    CONCEPTS_CHANGED: 'concepts:changed',
  }

  private constructor() {
    super()
  }

  public static getInstance(): ConceptService {
    if (!ConceptService.instance) {
      ConceptService.instance = new ConceptService()
    }
    return ConceptService.instance
  }

  public async createConcept(data: ConceptCreate): Promise<Concept> {
    try {
      const concept = await prisma.concept.create({
        data,
      })

      // Emitir eventos
      this.emit(this.EVENTS.CONCEPT_CREATED, concept)
      this.emit(this.EVENTS.CONCEPTS_CHANGED)

      return concept
    } catch (error) {
      conceptLogger.error('Error creating concept:', { data, error })
      throw new Error('Error al crear concepto')
    }
  }

  public async updateConcept(id: string, data: Partial<ConceptCreate>): Promise<Concept> {
    try {
      const concept = await prisma.concept.update({
        where: { id },
        data,
      })

      // Emitir eventos
      this.emit(this.EVENTS.CONCEPT_UPDATED, concept)
      this.emit(this.EVENTS.CONCEPTS_CHANGED)

      return concept
    } catch (error) {
      conceptLogger.error('Error updating concept:', { id, data, error })
      throw new Error('Error al actualizar concepto')
    }
  }

  public async deleteConcept(id: string): Promise<void> {
    try {
      const concept = await prisma.concept.delete({
        where: { id },
      })

      // Emitir eventos
      this.emit(this.EVENTS.CONCEPT_DELETED, concept)
      this.emit(this.EVENTS.CONCEPTS_CHANGED)
    } catch (error) {
      conceptLogger.error('Error deleting concept:', { id, error })
      throw new Error('Error al eliminar concepto')
    }
  }

  public async getConcept(id: string): Promise<Concept | null> {
    try {
      return await prisma.concept.findUnique({
        where: { id },
      })
    } catch (error) {
      conceptLogger.error('Error getting concept:', { id, error })
      throw new Error('Error al obtener concepto')
    }
  }

  public async getConcepts(filters: ConceptFilters = {}): Promise<ConceptResults> {
    try {
      const {
        category,
        search,
        tags,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 0,
        pageSize = 50,
      } = filters

      // Construir where
      const where: any = {}
      if (category) where.category = category
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        }
      }

      // Obtener total
      const total = await prisma.concept.count({ where })

      // Obtener conceptos
      const concepts = await prisma.concept.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: page * pageSize,
        take: pageSize,
      })

      // Obtener estadísticas
      const stats = await this.getConceptStats()

      return {
        items: concepts,
        total,
        page,
        pageSize,
        stats,
      }
    } catch (error) {
      conceptLogger.error('Error getting concepts:', { filters, error })
      throw new Error('Error al obtener conceptos')
    }
  }

  public async getConceptStats(): Promise<ConceptStats> {
    try {
      const total = await prisma.concept.count()

      // Agrupar por categoría
      const byCategory = await prisma.concept.groupBy({
        by: ['category'],
        _count: true,
      })

      // Obtener todos los tags únicos y su conteo
      const concepts = await prisma.concept.findMany({
        select: {
          tags: true,
        },
      })

      const tagCounts: Record<string, number> = {}
      concepts.forEach((concept) => {
        const tags = JSON.parse(concept.tags || '[]') as string[]
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      return {
        total,
        byCategory: Object.fromEntries(
          byCategory.map((item) => [item.category, item._count])
        ),
        byTag: tagCounts,
      }
    } catch (error) {
      conceptLogger.error('Error getting concept stats:', error)
      throw new Error('Error al obtener estadísticas de conceptos')
    }
  }
}

export const conceptService = ConceptService.getInstance()