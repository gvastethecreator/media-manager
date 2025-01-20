import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { EventEmitter } from 'events'
import type { Prompt } from '@prisma/client'
import type { PromptCreate } from '@/types/entities'

const promptLogger = logger.withContext('PromptService')

interface PromptEvents {
  PROMPT_CREATED: string
  PROMPT_UPDATED: string
  PROMPT_DELETED: string
  PROMPTS_CHANGED: string
}

interface PromptFilters {
  category?: string
  search?: string
  tags?: string[]
  sortBy?: 'createdAt' | 'name' | 'category'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface PromptStats {
  total: number
  byCategory: Record<string, number>
  byTag: Record<string, number>
}

interface PromptResults {
  items: Prompt[]
  total: number
  page: number
  pageSize: number
  stats: PromptStats
}

class PromptService extends EventEmitter {
  private static instance: PromptService
  private readonly EVENTS: PromptEvents = {
    PROMPT_CREATED: 'prompt:created',
    PROMPT_UPDATED: 'prompt:updated',
    PROMPT_DELETED: 'prompt:deleted',
    PROMPTS_CHANGED: 'prompts:changed',
  }

  private constructor() {
    super()
  }

  public static getInstance(): PromptService {
    if (!PromptService.instance) {
      PromptService.instance = new PromptService()
    }
    return PromptService.instance
  }

  public async createPrompt(data: PromptCreate): Promise<Prompt> {
    try {
      const prompt = await prisma.prompt.create({
        data,
      })

      // Emitir eventos
      this.emit(this.EVENTS.PROMPT_CREATED, prompt)
      this.emit(this.EVENTS.PROMPTS_CHANGED)

      return prompt
    } catch (error) {
      promptLogger.error('Error creating prompt:', { data, error })
      throw new Error('Error al crear prompt')
    }
  }

  public async updatePrompt(id: string, data: Partial<PromptCreate>): Promise<Prompt> {
    try {
      const prompt = await prisma.prompt.update({
        where: { id },
        data,
      })

      // Emitir eventos
      this.emit(this.EVENTS.PROMPT_UPDATED, prompt)
      this.emit(this.EVENTS.PROMPTS_CHANGED)

      return prompt
    } catch (error) {
      promptLogger.error('Error updating prompt:', { id, data, error })
      throw new Error('Error al actualizar prompt')
    }
  }

  public async deletePrompt(id: string): Promise<void> {
    try {
      const prompt = await prisma.prompt.delete({
        where: { id },
      })

      // Emitir eventos
      this.emit(this.EVENTS.PROMPT_DELETED, prompt)
      this.emit(this.EVENTS.PROMPTS_CHANGED)
    } catch (error) {
      promptLogger.error('Error deleting prompt:', { id, error })
      throw new Error('Error al eliminar prompt')
    }
  }

  public async getPrompt(id: string): Promise<Prompt | null> {
    try {
      return await prisma.prompt.findUnique({
        where: { id },
      })
    } catch (error) {
      promptLogger.error('Error getting prompt:', { id, error })
      throw new Error('Error al obtener prompt')
    }
  }

  public async getPrompts(filters: PromptFilters = {}): Promise<PromptResults> {
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
      const total = await prisma.prompt.count({ where })

      // Obtener prompts
      const prompts = await prisma.prompt.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: page * pageSize,
        take: pageSize,
      })

      // Obtener estadísticas
      const stats = await this.getPromptStats()

      return {
        items: prompts,
        total,
        page,
        pageSize,
        stats,
      }
    } catch (error) {
      promptLogger.error('Error getting prompts:', { filters, error })
      throw new Error('Error al obtener prompts')
    }
  }

  public async getPromptStats(): Promise<PromptStats> {
    try {
      const total = await prisma.prompt.count()

      // Agrupar por categoría
      const byCategory = await prisma.prompt.groupBy({
        by: ['category'],
        _count: true,
      })

      // Obtener todos los tags únicos y su conteo
      const prompts = await prisma.prompt.findMany({
        select: {
          tags: true,
        },
      })

      const tagCounts: Record<string, number> = {}
      prompts.forEach((prompt) => {
        const tags = JSON.parse(prompt.tags || '[]') as string[]
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
      promptLogger.error('Error getting prompt stats:', error)
      throw new Error('Error al obtener estadísticas de prompts')
    }
  }
}

export const promptService = PromptService.getInstance()