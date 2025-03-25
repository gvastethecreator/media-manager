/**
 * @file Funciones de mapeo entre diferentes formatos para Folder
 * @module transformers/folder/mappers
 */

import type {
    FolderExtended,
    FolderTreeItem,
    FolderWithRelations
} from '@/types/entities/folder';
import type { Folder as PrismaFolder } from '@prisma/client';
import { toFolderExtended, toFolderTreeItem } from './serializers';

/**
 * Construye una estructura jerárquica de carpetas (árbol)
 * @param folders Lista plana de carpetas
 * @param parentId ID del padre para el nivel actual (null para raíz)
 * @param level Nivel de profundidad actual
 * @returns Lista jerárquica de carpetas
 */
export function buildFolderTree(
  folders: (PrismaFolder | FolderExtended)[],
  parentId: string | null = null,
  level = 0
): FolderTreeItem[] {
  const tree: FolderTreeItem[] = [];

  // Filtrar carpetas del nivel actual
  const currentLevelFolders = folders.filter(folder => folder.parentId === parentId);

  // Para cada carpeta de este nivel
  for (const folder of currentLevelFolders) {
    // Crear el item del árbol
    const treeItem = toFolderTreeItem(folder, level);

    // Buscar hijos recursivamente
    const children = buildFolderTree(folders, folder.id, level + 1);
    treeItem.hasChildren = children.length > 0;
    treeItem.children = children;
    treeItem.totalItems = children.length;

    // Añadir al árbol
    tree.push(treeItem);
  }

  return tree;
}

/**
 * Busca una carpeta por su ID en el árbol de carpetas
 * @param tree Árbol de carpetas
 * @param folderId ID de la carpeta a buscar
 * @returns La carpeta encontrada o undefined
 */
export function findFolderInTree(
  tree: FolderTreeItem[],
  folderId: string
): FolderTreeItem | undefined {
  for (const folder of tree) {
    if (folder.id === folderId) {
      return folder;
    }

    if (folder.children.length > 0) {
      const found = findFolderInTree(folder.children, folderId);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Construye una estructura con relaciones completas a partir de una lista plana
 * @param folders Lista plana de carpetas
 * @returns Carpetas con sus relaciones completas
 */
export function buildFolderRelations(
  folders: PrismaFolder[]
): FolderWithRelations[] {
  // Convertir a formato extendido
  const extendedFolders = folders.map(toFolderExtended);

  // Mapa para acceso rápido por ID
  const folderMap = new Map<string, FolderExtended>();
  extendedFolders.forEach(folder => folderMap.set(folder.id, folder));

  // Construir relaciones
  const foldersWithRelations: FolderWithRelations[] = [];

  for (const folder of extendedFolders) {
    const folderWithRel: FolderWithRelations = {
      ...folder,
      children: [],
    };

    // Asignar padre si existe
    if (folder.parentId) {
      folderWithRel.parent = folderMap.get(folder.parentId) || null;
    }

    // Encontrar todos los hijos
    folderWithRel.children = extendedFolders.filter(f => f.parentId === folder.id);

    foldersWithRelations.push(folderWithRel);
  }

  return foldersWithRelations;
}

/**
 * Calcula la ruta completa de una carpeta basada en su jerarquía
 * @param folder Carpeta para la que calcular la ruta
 * @param allFolders Todas las carpetas disponibles
 * @returns Ruta completa con nombres de carpetas
 */
export function calculateFolderPath(
  folder: PrismaFolder | FolderExtended,
  allFolders: (PrismaFolder | FolderExtended)[]
): string {
  const segments = [folder.name];
  let currentFolder = folder;

  // Recorrer la jerarquía hacia arriba
  while (currentFolder.parentId) {
    const parent = allFolders.find(f => f.id === currentFolder.parentId);
    if (!parent) break;

    segments.unshift(parent.name);
    currentFolder = parent;
  }

  return segments.join('/');
}