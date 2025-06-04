'use client';

import { getFolderImages } from '@/app/actions/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

// Logger para depuración
const logger = clientLogger.withContext('useFolderImages');

// Clave para el caché de React Query
const FOLDER_IMAGES_KEY = 'folder-images';

export function useFolderImages(folderId: string | null) {
	// Registrar cuando se llama al hook con un nuevo folderId
	useEffect(() => {
		logger.debug(`🔄 Hook llamado con folderId: ${folderId || 'null'}`);
	}, [folderId]);

	const query = useQuery({
		queryKey: [FOLDER_IMAGES_KEY, folderId],
		queryFn: async () => {
			if (!folderId) {
				logger.debug('⚠️ folderId es nulo, devolviendo array vacío');
				return Promise.resolve([]);
			}

			logger.info(`🔄 Obteniendo imágenes para carpeta: ${folderId}`);
			try {
				const images = await getFolderImages(folderId);
				logger.info(`✅ Obtenidas ${images.length} imágenes para carpeta ${folderId}`);

				if (images.length > 0) {
					logger.debug('📄 Primera imagen recibida:', {
						id: images[0].id,
						name: images[0].name,
						thumbnail: images[0].thumbnail ? 'Disponible' : 'No disponible'
					});
				} else {
					logger.debug('📄 No se recibieron imágenes');
				}

				return images;
			} catch (error) {
				logger.error(`❌ Error obteniendo imágenes para carpeta ${folderId}:`, error);
				throw error;
			}
		},
		enabled: !!folderId, // Solo ejecutar si hay un folderId
		staleTime: 30 * 1000, // Considerar datos frescos por 30 segundos
		gcTime: 5 * 60 * 1000, // Mantener en caché por 5 minutos
		refetchOnWindowFocus: false, // No recargar al enfocar la ventana
		refetchOnMount: false, // No recargar al montar el componente
	});

	// Registrar cambios en el estado del query
	useEffect(() => {
		if (query.isLoading) {
			logger.debug(`⏳ Cargando imágenes para carpeta: ${folderId || 'null'}`);
		} else if (query.isError) {
			logger.error(`❌ Error en query para carpeta ${folderId}:`, query.error);
		} else if (query.isSuccess) {
			const imageCount = query.data?.length || 0;
			logger.debug(`✅ Query exitoso para carpeta ${folderId}: ${imageCount} imágenes`);
		}
	}, [query.isLoading, query.isError, query.isSuccess, query.error, query.data, folderId]);

	return query;
}
