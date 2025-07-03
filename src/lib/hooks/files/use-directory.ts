import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { DirectoryReadResult } from '@/types/entities/file';

/**
 * Hook React Query para obtener el contenido de un directorio desde el backend.
 * @param path Ruta relativa al directorio base configurado en el servidor
 */
export function useDirectory(path: string) {
	return useQuery<DirectoryReadResult, Error>({
		queryKey: ['directory', path],
		queryFn: () => api.get<DirectoryReadResult>(`/files/list?path=${encodeURIComponent(path)}`),
		staleTime: 1000 * 30, // 30s
	});
}
