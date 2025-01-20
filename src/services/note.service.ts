import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { EventEmitter } from 'events'
import type { Note } from '@prisma/client'
import type { NoteCreate } from '@/types/entities'

const noteLogger = logger.withContext('NoteService')

interface NoteEvents {
  NOTE_CREATED: string
  NOTE_UPDATED: string
  NOTE_DELETED: string
  NOTES_CHANGED: string
}

interface NoteFilters {
  category?: string
  priority?: number
  status?: string
  search?: string
  tags?: string[]
  sortBy?: 'createdAt' | 'title' | 'category' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface NoteStats {
  total: number
  byCategory: Record<string, number>
  byPriority: Record<number, number>
  byStatus: Record<string, number>
  byTag: Record<string, number>
}

interface NoteResults {
  items: Note[]
  total: number
  page: number
  pageSize: number
  stats: NoteStats
}

class NoteService extends EventEmitter {
  private static instance: NoteService
  private readonly EVENTS: NoteEvents = {
    NOTE_CREATED: 'note:created',
    NOTE_UPDATED: 'note:updated',
    NOTE_DELETED: 'note:deleted',
    NOTES_CHANGED: 'notes:changed',
  }

  private constructor() {
    super()
  }

  public static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService()
    }
    return NoteService.instance
  }

  public async createNote(data: NoteCreate): Promise<Note> {
    try {
      const note = await prisma.note.create({
        data,
      })

      // Emitir eventos
      this.emit(this.EVENTS.NOTE_CREATED, note)
      this.emit(this.EVENTS.NOTES_CHANGED)

      return note
    } catch (error) {
      noteLogger.error('Error creating note:', { data, error })
      throw new Error('Error al crear nota')
    }
  }

  public async updateNote(id: string, data: Partial<NoteCreate>): Promise<Note> {
    try {
      const note = await prisma.note.update({
        where: { id },
        data,
      })

      // Emitir eventos
      this.emit(this.EVENTS.NOTE_UPDATED, note)
      this.emit(this.EVENTS.NOTES_CHANGED)

      return note
    } catch (error) {
      noteLogger.error('Error updating note:', { id, data, error })
      throw new Error('Error al actualizar nota')
    }
  }

  public async deleteNote(id: string): Promise<void> {
    try {
      const note = await prisma.note.delete({
        where: { id },
      })

      // Emitir eventos
      this.emit(this.EVENTS.NOTE_DELETED, note)
      this.emit(this.EVENTS.NOTES_CHANGED)
    } catch (error) {
      noteLogger.error('Error deleting note:', { id, error })
      throw new Error('Error al eliminar nota')
    }
  }

  public async getNote(id: string): Promise<Note | null> {
    try {
      return await prisma.note.findUnique({
        where: { id },
      })
    } catch (error) {
      noteLogger.error('Error getting note:', { id, error })
      throw new Error('Error al obtener nota')
    }
  }

  public async getNotes(filters: NoteFilters = {}): Promise<NoteResults> {
    try {
      const {
        category,
        priority,
        status,
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
      if (priority !== undefined) where.priority = priority
      if (status) where.status = status
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        }
      }

      // Obtener total
      const total = await prisma.note.count({ where })

      // Obtener notas
      const notes = await prisma.note.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: page * pageSize,
        take: pageSize,
      })

      // Obtener estadísticas
      const stats = await this.getNoteStats()

      return {
        items: notes,
        total,
        page,
        pageSize,
        stats,
      }
    } catch (error) {
      noteLogger.error('Error getting notes:', { filters, error })
      throw new Error('Error al obtener notas')
    }
  }

  public async getNoteStats(): Promise<NoteStats> {
    try {
      const total = await prisma.note.count()

      // Agrupar por categoría
      const byCategory = await prisma.note.groupBy({
        by: ['category'],
        _count: true,
      })

      // Agrupar por prioridad
      const byPriority = await prisma.note.groupBy({
        by: ['priority'],
        _count: true,
      })

      // Agrupar por estado
      const byStatus = await prisma.note.groupBy({
        by: ['status'],
        _count: true,
      })

      // Obtener todos los tags únicos y su conteo
      const notes = await prisma.note.findMany({
        select: {
          tags: true,
        },
      })

      const tagCounts: Record<string, number> = {}
      notes.forEach((note) => {
        const tags = JSON.parse(note.tags || '[]') as string[]
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      return {
        total,
        byCategory: Object.fromEntries(
          byCategory.map((item) => [item.category, item._count])
        ),
        byPriority: Object.fromEntries(
          byPriority.map((item) => [item.priority, item._count])
        ),
        byStatus: Object.fromEntries(
          byStatus.map((item) => [item.status, item._count])
        ),
        byTag: tagCounts,
      }
    } catch (error) {
      noteLogger.error('Error getting note stats:', error)
      throw new Error('Error al obtener estadísticas de notas')
    }
  }
}

export const noteService = NoteService.getInstance()