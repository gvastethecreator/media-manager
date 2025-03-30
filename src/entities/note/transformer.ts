/**
 * @file Transformer para la entidad Note
 * @module entities/note/transformer
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { CreateNoteData, Note, NoteComplete, NoteSearchOptions, UpdateNoteData } from '@/types/entities/note/types';
import { mapCreateNoteDataToPrisma, mapNoteSearchOptionsToPrisma, mapUpdateNoteDataToPrisma } from './mappers';
import { extendNote, validateNote } from './serializers';

/**
 * Transformer para la entidad Note
 */
export class NoteTransformer {
  /**
   * Busca múltiples notas con opciones de filtrado y paginación
   */
  static async findMany(options: NoteSearchOptions = {}): Promise<{ items: NoteComplete[]; total: number; hasMore: boolean }> {
    try {
      const prismaOptions = mapNoteSearchOptionsToPrisma(options);
      const [items, total] = await Promise.all([
        prisma.note.findMany(prismaOptions),
        prisma.note.count({ where: prismaOptions.where })
      ]);

      const extendedItems = items.map(item => extendNote(item as Note));
      const hasMore = (options.skip || 0) + items.length < total;

      return { items: extendedItems, total, hasMore };
    } catch (error) {
      logger.error('Error buscando notas:', error);
      throw error;
    }
  }

  /**
   * Busca una nota por su ID
   */
  static async findById(id: string, include?: NoteSearchOptions['include']): Promise<NoteComplete | null> {
    try {
      const note = await prisma.note.findUnique({
        where: { id },
        include: {
          _count: true,
          ...(include?.images && { images: true }),
          ...(include?.videos && { videos: true }),
          ...(include?.albums && { albums: true }),
          ...(include?.collections && { collections: true }),
          ...(include?.characters && { characters: true }),
          ...(include?.properties && { properties: true })
        }
      });

      return note ? extendNote(note as Note) : null;
    } catch (error) {
      logger.error(`Error buscando nota con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva nota
   */
  static async create(data: CreateNoteData): Promise<NoteComplete> {
    try {
      const prismaData = mapCreateNoteDataToPrisma(data);
      const note = await prisma.note.create({
        data: prismaData,
        include: {
          _count: true,
          images: true,
          videos: true,
          albums: true,
          collections: true,
          characters: true,
          properties: true
        }
      });

      return extendNote(note as Note);
    } catch (error) {
      logger.error('Error creando nota:', error);
      throw error;
    }
  }

  /**
   * Actualiza una nota existente
   */
  static async update(id: string, data: UpdateNoteData): Promise<NoteComplete> {
    try {
      const prismaData = mapUpdateNoteDataToPrisma(data);
      const note = await prisma.note.update({
        where: { id },
        data: prismaData,
        include: {
          _count: true,
          images: true,
          videos: true,
          albums: true,
          collections: true,
          characters: true,
          properties: true
        }
      });

      return extendNote(note as Note);
    } catch (error) {
      logger.error(`Error actualizando nota con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una nota
   */
  static async delete(id: string): Promise<NoteComplete> {
    try {
      const note = await prisma.note.delete({
        where: { id },
        include: {
          _count: true,
          images: true,
          videos: true,
          albums: true,
          collections: true,
          characters: true,
          properties: true
        }
      });

      return extendNote(note as Note);
    } catch (error) {
      logger.error(`Error eliminando nota con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Extiende una nota con campos deserializados
   */
  static extend(note: Note): NoteComplete {
    return extendNote(note);
  }

  /**
   * Valida una nota
   */
  static validate(note: Note): boolean {
    return validateNote(note);
  }
}

// Exportar funciones individuales para uso directo
export const findManyNotes = NoteTransformer.findMany;
export const findNoteById = NoteTransformer.findById;
export const createNote = NoteTransformer.create;
export const updateNote = NoteTransformer.update;
export const deleteNote = NoteTransformer.delete;
export const extendNoteTransform = NoteTransformer.extend;
export const validateNoteData = NoteTransformer.validate;