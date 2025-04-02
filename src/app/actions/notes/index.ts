'use server';

/**
 * @file Exporta todas las acciones relacionadas con notas
 * @module app/actions/notes
 */

import * as NoteActions from './note.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
export const getNotes = NoteActions.getNotes;
export const getNote = NoteActions.getNote;
export const createNote = NoteActions.createNote;
export const updateNote = NoteActions.updateNote;
export const deleteNote = NoteActions.deleteNote;
export const getNoteImages = NoteActions.getNoteImages;
export const addImageToNote = NoteActions.addImageToNote;
export const removeImageFromNote = NoteActions.removeImageFromNote;
