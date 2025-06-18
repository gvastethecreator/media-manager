/**
 * @file Slice para filtros y ordenación del store de imágenes
 * @module store/entities/image/slices/filters
 * @description
 * 💀 **ESTE SLICE HA SIDO VACIADO INTENCIONADAMENTE.** 💀
 *
 * La gestión del estado de los filtros de imágenes se ha migrado a un enfoque
 * más robusto y estándar utilizando los parámetros de la URL (URL Search Params).
 *
 * Mantener el estado de los filtros en un store global de Zustand es un anti-patrón
 * que conduce a:
 * - Desincronización entre la UI y la URL, rompiendo el historial del navegador,
 *   los marcadores y la capacidad de compartir enlaces.
 * - Lógica de filtrado ineficiente en el lado del cliente (`applyFilters`), que no
 *   es escalable y no funciona con paginación. El filtrado debe ocurrir en la
 *   base de datos a través de Server Actions.
 * - Complejidad innecesaria con acciones para gestionar un estado que la URL
 *   puede manejar de forma nativa.
 *
 * El nuevo enfoque consiste en:
 * 1. Usar hooks de Next.js (`useRouter`, `useSearchParams`) para leer y escribir
 *    los filtros en la URL.
 * 2. Pasar estos filtros a los hooks de React Query, que a su vez los pasarán a
 *    las Server Actions.
 * 3. Las Server Actions utilizan estos filtros en la cláusula `where` de Prisma
 *    para que la base de datos realice el trabajo pesado.
 */

import type { StateCreator } from 'zustand';
import type { ImageState } from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImageFiltersSlice {}

export const createImageFiltersSlice: StateCreator<ImageState, [], [], ImageFiltersSlice> = () => ({});
