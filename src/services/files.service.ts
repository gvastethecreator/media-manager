import { FileItem } from "@/types/files";

export async function getFiles(path?: string): Promise<FileItem[]> {
  try {
    const response = await fetch(`/api/files${path ? `?path=${encodeURIComponent(path)}` : ''}`);
    if (!response.ok) {
      throw new Error('Error al obtener los archivos');
    }
    return response.json();
  } catch (error) {
    console.error('Error en getFiles:', error);
    throw error;
  }
}

export async function getFilesByFolder(folderId: string): Promise<FileItem[]> {
  try {
    const response = await fetch(`/api/folders/${folderId}/files`);
    if (!response.ok) {
      throw new Error('Error al obtener los archivos de la carpeta');
    }
    return response.json();
  } catch (error) {
    console.error('Error en getFilesByFolder:', error);
    throw error;
  }
}

export async function getCollectionFiles(collectionId: string): Promise<FileItem[]> {
  try {
    const response = await fetch(`/api/collections/${collectionId}/files`);
    if (!response.ok) {
      throw new Error('Error al obtener los archivos de la colección');
    }
    return response.json();
  } catch (error) {
    console.error('Error en getCollectionFiles:', error);
    throw error;
  }
}

export async function getTaggedFiles(tag: string): Promise<FileItem[]> {
  try {
    const response = await fetch(`/api/tags/${encodeURIComponent(tag)}/files`);
    if (!response.ok) {
      throw new Error('Error al obtener los archivos etiquetados');
    }
    return response.json();
  } catch (error) {
    console.error('Error en getTaggedFiles:', error);
    throw error;
  }
}
