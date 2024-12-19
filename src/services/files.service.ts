import { FileItem } from "@/types/files";

export async function getFiles(path?: string): Promise<FileItem[]> {
  console.log('🔍 Iniciando getFiles:', { path });
  try {
    const url = new URL('/api/files', window.location.origin);
    if (path) url.searchParams.set('path', path);

    console.log('📡 Realizando petición a:', url.toString());
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('❌ Error en respuesta:', {
        status: response.status,
        statusText: response.statusText,
        url: url.toString()
      });
      throw new Error('Error al obtener los archivos');
    }

    const data = await response.json();
    console.log('✅ Datos recibidos:', {
      count: data.length,
      sample: data.slice(0, 2)
    });

    return data;
  } catch (error) {
    console.error('❌ Error en getFiles:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function getFilesByFolder(folderId: string): Promise<FileItem[]> {
  try {
    const response = await fetch(`/api/folders/${folderId}/files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Error al obtener los archivos de la carpeta');
    }

    return response.json();
  } catch (error) {
    console.error('❌ Error en getFilesByFolder:', error);
    throw error;
  }
}

export async function getCollectionFiles(collectionId: string): Promise<FileItem[]> {
  try {
    const response = await fetch(`/api/collections/${collectionId}/files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Error al obtener los archivos de la colección');
    }

    return response.json();
  } catch (error) {
    console.error('❌ Error en getCollectionFiles:', error);
    throw error;
  }
}

export async function getTaggedFiles(tag: string): Promise<FileItem[]> {
  try {
    const response = await fetch(`/api/tags/${encodeURIComponent(tag)}/files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Error al obtener los archivos etiquetados');
    }

    return response.json();
  } catch (error) {
    console.error('❌ Error en getTaggedFiles:', error);
    throw error;
  }
}
