/**
 * @file Utilidades para álbumes
 * @module utils/album
 */

export * from './helpers';
export * from './validators';

// TODO: Arreglar importaciones de tipos de album - archivo temporalmente deshabilitado
// Todo el contenido del archivo ha sido comentado hasta resolver las importaciones de AlbumSortCriteria y AlbumComplete
// El archivo se reactivará cuando se resuelvan los tipos faltantes

/*
Todas las funciones están temporalmente comentadas debido a tipos faltantes:

// import { AlbumSortCriteria } from '@/types/entities/album';
// import type { AlbumComplete } from '@/types/entities/album/extended';

// export function sortAlbums(albums: AlbumComplete[], sortOption: AlbumSortCriteria): AlbumComplete[] {
//   return albums.slice().sort((a, b) => {
//     switch (sortOption) {
//       case AlbumSortCriteria.NAME_ASC:
//         return a.name.localeCompare(b.name);
//       case AlbumSortCriteria.NAME_DESC:
//         return b.name.localeCompare(a.name);
//       case AlbumSortCriteria.DATE_CREATED_ASC:
//         return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
//       case AlbumSortCriteria.DATE_CREATED_DESC:
//         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//       case AlbumSortCriteria.DATE_UPDATED_ASC:
//         return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
//       case AlbumSortCriteria.DATE_UPDATED_DESC:
//         return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
//       case AlbumSortCriteria.CUSTOM:
//       default:
//         return a.name.localeCompare(b.name);
//     }
//   });
// }

// export function groupAlbums(
//   albums: AlbumComplete[],
//   groupBy: 'category' | 'type' | 'date' | 'favorite' | null
// ): Record<string, AlbumComplete[]> {
//   if (!albums || albums.length === 0 || !groupBy) {
//     return { Todos: albums || [] };
//   }
//
//   const groups: Record<string, AlbumComplete[]> = {};
//
//   for (const album of albums) {
//     let groupKey: string;
//
//     switch (groupBy) {
//       case 'category':
//         groupKey = album.category || 'Sin categoría';
//         break;
//       case 'type':
//         groupKey = 'Estándar';
//         break;
//       case 'date': {
//         const year = new Date(album.createdAt).getFullYear();
//         groupKey = year.toString();
//         break;
//       }
//       case 'favorite':
//         groupKey = album.isFavorite ? 'Favoritos' : 'Normales';
//         break;
//       default:
//         groupKey = 'Todos';
//     }
//
//     if (!groups[groupKey]) {
//       groups[groupKey] = [];
//     }
//     groups[groupKey].push(album);
//   }
//
//   return groups;
// }

// export function filterAlbumsBySearch(albums: AlbumComplete[], searchTerm: string): AlbumComplete[] {
//   if (!searchTerm.trim()) {
//     return albums;
//   }
//
//   const term = searchTerm.toLowerCase();
//
//   return albums.filter(
//     (album) =>
//       album.name.toLowerCase().includes(term) ||
//       album.description?.toLowerCase().includes(term) ||
//       album.category?.toLowerCase().includes(term)
//   );
// }

// Más funciones comentadas...
*/
