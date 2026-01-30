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
 * 1. (Legacy) Usaba hooks de Next.js (`useRouter`, `useSearchParams`) para leer y escribir los filtros en la URL.
 *    Ahora se manejan con React Router.
 * 2. Pasar estos filtros a los hooks de React Query, que a su vez se comunican con la API.
 * 3. Las APIs aplican estos filtros directamente en Drizzle.
 */

import type { StateCreator } from 'zustand';
import type { ImageState } from '../types';

export type ImageFiltersSlice = Record<string, never>;

export const createImageFiltersSlice: StateCreator<ImageState, [], [], ImageFiltersSlice> = () => ({});
