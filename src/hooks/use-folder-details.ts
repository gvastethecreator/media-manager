import { useQuery } from '@tanstack/react-query';
import { getFolder } from '@/services/folder/folder.service';
import type { FolderComplete } from '@/types/entities/folder';

/**
 * Hook para obtener los detalles completos de una carpeta específica
 */
export function useFolderDetails(folderId?: string) {
	return useQuery({
		queryKey: ['folder-details', folderId],
		queryFn: async (): Promise<FolderComplete | null> => {
			if (!folderId) return null;
			return await getFolder(folderId);
		},
		enabled: !!folderId,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
	});
}
