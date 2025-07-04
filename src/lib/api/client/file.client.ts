/**
 * Cliente de API para operaciones de archivos.
 */
import type { DirectoryReadResult } from '@/types/entities/file/base';

const API_BASE_PATH = '/api/files';

export async function getDirectoryInfoFromApi(dirPath: string): Promise<DirectoryReadResult> {
    const encoded = encodeURIComponent(dirPath);
    const response = await fetch(`${API_BASE_PATH}/directory/${encoded}`);
    if (!response.ok) throw new Error('Error al leer el directorio');
    const { data } = await response.json();
    return data as DirectoryReadResult;
}
