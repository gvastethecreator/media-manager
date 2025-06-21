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

import type { DocumentStore } from './types';
import { createDocumentCoreSlice } from './slices/core.slice';
import { createDocumentUISlice } from './slices/ui.slice';
import { createDocumentFilterSlice } from './slices/filters.slice';

export const useDocumentStore = create<DocumentStore>()(
	devtools(
		immer((...a) => ({
			...createDocumentCoreSlice(...a),
			...createDocumentUISlice(...a),
			...createDocumentFilterSlice(...a),
		})),
		{ name: 'DocumentStore' },
	),
);