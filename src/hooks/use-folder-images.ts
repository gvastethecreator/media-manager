'use client';

import { getFolderImages } from '@/app/actions/folders';
import { useQuery } from '@tanstack/react-query';

// Clave para el caché de React Query
const FOLDER_IMAGES_KEY = 'folder-images';

export function useFolderImages(folderId: string | null) {
  return useQuery({
    queryKey: [FOLDER_IMAGES_KEY, folderId],
    queryFn: () => {
      if (!folderId) {
        return Promise.resolve([]);
      }
      return getFolderImages(folderId);
    },
    enabled: !!folderId, // Solo ejecutar si hay un folderId
    staleTime: 30 * 1000, // Considerar datos frescos por 30 segundos
    gcTime: 5 * 60 * 1000, // Mantener en caché por 5 minutos
    refetchOnWindowFocus: false, // No recargar al enfocar la ventana
    refetchOnMount: false, // No recargar al montar el componente
  });
}