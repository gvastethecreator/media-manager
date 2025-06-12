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
		logger.debug(`🔄 Hook useFolderImages llamado con folderId: ${folderId || 'null'}`);

		// Validar que el folderId sea un valor válido
		if (folderId) {
			if (folderId.trim() === '') {
				logger.warn('⚠️ Se recibió un folderId vacío');
			} else if (folderId.length < 5) {
				logger.warn(`⚠️ El folderId parece ser inválido (demasiado corto): ${folderId}`);
			} else {
				logger.info(`✅ folderId parece válido: ${folderId}`);
			}
		}
	}, [folderId]);

	const query = useQuery({
		queryKey: [FOLDER_IMAGES_KEY, folderId],
		queryFn: async () => {
			if (!folderId) {
				logger.debug('⚠️ folderId es nulo, devolviendo objeto vacío');
				return Promise.resolve({ items: [], folder: null, status: 200 });
			}

			try {
				logger.info(`🔄 Obteniendo imágenes para carpeta: ${folderId}`);
				const response = await getFolderImages(folderId);

				// Verificar la estructura de la respuesta
				if (!response) {
					logger.error('❌ La respuesta de getFolderImages es undefined o null');
					return { items: [], folder: null, status: 500, error: 'Respuesta vacía del servidor' };
				}

				// Acceder a los items de manera segura
				const items = response.items || [];
				logger.info(`✅ Obtenidas ${items.length} imágenes para carpeta ${folderId}`);

				if (items.length > 0) {
					// Mostrar información de la primera imagen para depuración
					const firstImage = items[0];
					logger.debug('📄 Primera imagen recibida:', {
						id: firstImage.id,
						name: firstImage.name,
						thumbnail: firstImage.thumbnail ? 'Disponible' : 'No disponible',
						imageUrl: firstImage.imageUrl || firstImage.src || 'No disponible',
						propiedades: Object.keys(firstImage).join(', '),
					});
				} else {
					logger.warn(`⚠️ No se recibieron imágenes para la carpeta ${folderId}`);
				}

				return response;
			} catch (error) {
				logger.error(`❌ Error obteniendo imágenes para carpeta ${folderId}:`, error);
				throw error;
			}
		},
		enabled: !!folderId, // Solo ejecutar si hay un folderId
		staleTime: 30 * 1000, // Considerar datos frescos por 30 segundos
		gcTime: 5 * 60 * 1000, // Mantener en caché por 5 minutos
		refetchOnWindowFocus: false, // No recargar al enfocar la ventana
		refetchOnMount: true, // Recargar al montar el componente para asegurar datos frescos
	});

	// 🛡️ Robustez: filtrar y loguear elementos inválidos en items antes de exponerlos a la UI
	const safeData =
		query.data && Array.isArray(query.data.items)
			? {
					...query.data,
					items: query.data.items.filter((img, idx) => {
						const isValid = img && typeof img === 'object' && typeof (img as any).then !== 'function';
						if (!isValid) {
							logger.warn(`🛡️ Imagen excluida en posición ${idx}: nulo, promesa o tipo inválido`, { img });
						}
						return isValid;
					}),
				}
			: query.data;

	// Registrar cambios en el estado del query
	useEffect(() => {
		if (query.isLoading) {
			logger.debug(`⏳ Cargando imágenes para carpeta: ${folderId || 'null'}`);
		} else if (query.isError) {
			logger.error(`❌ Error en query para carpeta ${folderId}:`, query.error);
		} else if (query.isSuccess) {
			const imageCount = safeData?.items?.length || 0;
			logger.debug(`✅ Query exitoso para carpeta ${folderId}: ${imageCount} imágenes (validadas)`);
		}
	}, [folderId, query.isLoading, query.isError, query.error, query.isSuccess, safeData?.items?.length]);

	return { ...query, data: safeData };
}
