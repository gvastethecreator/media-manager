'use client';

import { DatabaseIcon, FolderIcon, RefreshCcw, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { FolderCard } from '@/components/cards/folder-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button, buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { folderService } from '@/services/folder-service-export';
import { useFileStoreBase } from '@/store/entities/file';
import { useFolderStore } from '@/store/entities/folder';
import type { Folder } from '@/types/entities/folder';
import type { ViewProps } from '../../views/types';

const viewLogger = clientLogger.withContext('FoldersView');

// Actualizar la definición de tipo para Folder para incluir _count
type FolderWithCount = Folder & {
	_count?: {
		images: number;
	};
	// Asegurar que estos campos están disponibles explícitamente
	totalSize: number;
	totalFiles: number;
};

// Componente memoizado para cada tarjeta de carpeta
const MemoizedFolderCard = React.memo(
	({ folder, onFolderClick }: { folder: FolderWithCount; onFolderClick: () => void }) => {
		return <FolderCard folder={folder} onClick={onFolderClick} className="h-full" />;
	},
	(prevProps, nextProps) => {
		// Memoización personalizada para solo re-renderizar si cambian propiedades importantes
		return (
			prevProps.folder.id === nextProps.folder.id &&
			prevProps.folder.name === nextProps.folder.name &&
			prevProps.folder.emoji === nextProps.folder.emoji &&
			prevProps.folder.updatedAt === nextProps.folder.updatedAt &&
			(prevProps.folder._count?.images || 0) === (nextProps.folder._count?.images || 0) &&
			prevProps.folder.totalSize === nextProps.folder.totalSize &&
			prevProps.folder.totalFiles === nextProps.folder.totalFiles
		);
	}
);

// Para evitar advertencias de displayName
MemoizedFolderCard.displayName = 'MemoizedFolderCard';

export function FoldersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();

	// 🆕 Usar los nuevos stores específicos
	const {
		coreActions: { fetchFolderById: setCurrentFolderId, setCurrentFolder },
	} = useFolderStore();

	// 🧹 Para limpiar selección - usar el hook base directamente
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);

	const [folders, setFolders] = useState<FolderWithCount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<Folder[]>(folders);
	// Mantener un contador de reintentos
	const [retryCount, setRetryCount] = useState(0);
	const maxRetries = 3;

	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true); // Siempre poner en loading al iniciar la carga/reintento
			// viewLogger.info('🔄 Cargando carpetas...'); // Comentado
			const data = await folderService.getFolders();

			// ✅ data ahora es el array correcto, no necesitamos .map si ya viene correcto
			if (Array.isArray(data)) {
				const transformedData = data.map((folderData: any) => {
					return {
						...folderData,
						lastIndexed: folderData.lastIndexed ? new Date(folderData.lastIndexed) : null,
						createdAt: new Date(folderData.createdAt),
						updatedAt: new Date(folderData.updatedAt),
						// Asegurarnos de que _count existe y preservar datos importantes
						_count: folderData._count || { images: folderData.imageCount || 0 },
						// Asegurar que estos campos se preservan
						totalSize: folderData.totalSize || 0,
						totalFiles: folderData.totalFiles || 0,
					} as FolderWithCount;
				});

				// viewLogger.debug('Datos de carpetas transformados:', { // Comentado
				// 	firstFolder: transformedData[0]
				// 		? {
				// 		id: transformedData[0].id,
				// 		name: transformedData[0].name,
				// 		totalSize: transformedData[0].totalSize,
				// 		totalFiles: transformedData[0].totalFiles,
				// 		imageCount: transformedData[0]._count?.images,
				// 	}
				// 	: 'No hay carpetas',
				// });

				setFolders(transformedData);
				setRetryCount(0); // Reiniciar el contador de reintentos si la carga es exitosa
				setError(null); // Limpiar cualquier error previo
				// viewLogger.info(`✅ ${transformedData.length} carpetas cargadas`); // Comentado
			} else {
				throw new Error('Respuesta del servicio no es un array válido');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

			// Gestionar los casos de errores de concurrencia o transitorios
			const isTransientError =
				(errorMessage.includes('Operación') && errorMessage.includes('en progreso')) ||
				errorMessage.includes('ECONNREFUSED') ||
				errorMessage.includes('timeout') ||
				errorMessage.includes('network');

			if (isTransientError && retryCount < maxRetries) {
				// Calcular retraso de reintento exponencial (300ms, 900ms, 2700ms)
				const retryDelay = 300 * 3 ** retryCount;
				// viewLogger.debug(
				// 	`🔄 Error transitorio, reintentando en ${retryDelay}ms (intento ${retryCount + 1}/${maxRetries})...` // Comentado
				// );

				// Incrementar contador de reintentos y programar un nuevo intento
				setRetryCount((prev) => prev + 1);
				setTimeout(() => {
					loadFolders();
				}, retryDelay);
				return;
			}

			// Si hemos alcanzado el máximo de reintentos o no es un error transitorio, mostrar el error
			if (retryCount >= maxRetries) {
				// viewLogger.warn(`⚠️ Alcanzado máximo de reintentos (${maxRetries})`); // Comentado
			}

			// viewLogger.error('❌ Error cargando carpetas:', error); // Comentado
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- isLoading se maneja internamente, retryCount es la única dependencia externa necesaria para la lógica de reintento.
	}, [retryCount]);

	useEffect(() => {
		// viewLogger.debug('🟢 FoldersView Montado'); // <-- Comentado
		loadFolders();

		return () => {
			// viewLogger.debug('🔴 FoldersView Desmontado'); // <-- Comentado
		};
	}, [loadFolders]); // <-- Incluir loadFolders en las dependencias

	const handleFolderClick = useCallback(
		(folder: FolderWithCount) => {
			try {
				viewLogger.info('🖱️ Click en carpeta:', folder.name); // Descomentado
				viewLogger.debug('ℹ️ Carpeta clickeada:', folder); // Nuevo log

				// Verificaciones de seguridad
				if (!folder || !folder.id) {
					viewLogger.error('❌ Carpeta inválida:', folder); // Descomentado
					return;
				}

				viewLogger.debug('🧹 Limpiando selecciones previas...'); // Nuevo log
				// 🧹 Limpiar selecciones previas
				deselectAllFiles();
				viewLogger.debug('✅ Selecciones limpiadas.'); // Nuevo log

				viewLogger.debug('🔄 Actualizando el store de carpetas (setCurrentFolderId)...'); // Nuevo log
				// 🔄 Actualizar el store de carpetas PRIMERO
				setCurrentFolderId(folder.id);
				viewLogger.debug(`✅ setCurrentFolderId llamado con ID: ${folder.id}`); // Nuevo log

				viewLogger.debug('📍 Actualizando la vista de navegación (setCurrentView)...'); // Nuevo log
				// 📍 Actualizar la vista de navegación
				setCurrentView('folder-content');
				viewLogger.debug('✅ setCurrentView llamado a folder-content.'); // Nuevo log

				viewLogger.info(`✅ Navegando a carpeta: ${folder.name} (${folder.id})`); // Descomentado
			} catch (error) {
				viewLogger.error('❌ Error al cambiar a la carpeta:', error); // Descomentado
			}
		},
		[setCurrentView, deselectAllFiles, setCurrentFolderId]
	);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6">
				<div className="max-w-md w-full bg-destructive/10 rounded-lg p-6 text-center">
					<XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
					<h3 className="text-xl font-semibold text-destructive mb-2">Error al cargar carpetas</h3>
					<p className="text-sm mb-4">{error}</p>
					<p className="text-xs text-muted-foreground mb-4">
						Este error podría estar relacionado con problemas de conexión a la base de datos o problemas con la
						estructura de tablas.
					</p>
					<div className="flex flex-col gap-2">
						<Button variant="outline" onClick={loadFolders}>
							<RefreshCcw className="h-4 w-4 mr-2" />
							Reintentar
						</Button>
						<Link href="/diagnostics/database" className={buttonVariants({ variant: 'default' })}>
							<DatabaseIcon className="h-4 w-4 mr-2" />
							Ejecutar diagnóstico
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticFolders || optimisticFolders.length === 0) {
		return (
			<EmptyState
				icon={FolderIcon}
				title="No hay carpetas indexadas"
				description="Agrega carpetas desde el panel de configuración para comenzar a indexar tus imágenes."
			/>
		);
	}

	// Log de depuración para ver qué datos tenemos disponibles
	// if (optimisticFolders.length > 0) {
	// 	viewLogger.debug('Datos de carpeta para renderizado:', { // Comentado
	// 		id: optimisticFolders[0].id,
	// 		name: optimisticFolders[0].name,
	// 		totalSize: optimisticFolders[0].totalSize,
	// 		totalFiles: optimisticFolders[0].totalFiles,
	// 		_count: optimisticFolders[0]._count,
	// 		updatedAt: optimisticFolders[0].updatedAt,
	// 	});
	// }

	return (
		<>
			<ScrollArea className="h-full">
				<div className="container mx-auto p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
						{optimisticFolders.map((folder, index) => {
							// Verificar que la carpeta tenga un id válido
							if (!folder || !folder.id) {
								console.error('Carpeta sin id válido:', folder);
								return null;
							}

							// Crear una función de clic específica para esta carpeta
							const onFolderClick = () => handleFolderClick(folder);

							return (
								<motion.div
									key={folder.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: index * 0.1,
										duration: 0.4,
										type: 'spring',
										stiffness: 100,
										damping: 12,
									}}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-folder-id={folder.id}
									>
										<MemoizedFolderCard folder={folder} onFolderClick={onFolderClick} />
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>
			</ScrollArea>
		</>
	);
}
