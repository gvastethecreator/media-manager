/**
 * @file Store de Zustand para la entidad Document.
 * @module store/entities/document
 * @description
 *   Este store centraliza el estado y la lógica de negocio para los documentos en la aplicación.
 *   Utiliza un patrón de "slices" para separar las preocupaciones:
 *   - Core: Datos principales y acciones CRUD.
 *   - UI: Estado de la interfaz de usuario (selecciones, visibilidad).
 *   - Filters: Filtros, ordenación y paginación.
 *
 *   El estado se persiste en el almacenamiento local, pero solo las partes
 *   que son relevantes para el usuario (filtros).
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createDocumentCoreSlice } from './slices/core.slice';
import { createDocumentFilterSlice } from './slices/filters.slice';
import { createDocumentUISlice } from './slices/ui.slice';
import type { DocumentStore } from './types';

export const useDocumentStore = create<DocumentStore>()(
	devtools(
		immer((...a) => ({
			...createDocumentCoreSlice(...a),
		})),
		{ name: 'DocumentStore' }
	)
);
