import { useCallback, useEffect, useState } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useCreateFolder } from '@/lib/api/folders'; // Importar el hook useCreateFolder
import { findFolders } from '@/lib/api/services/folders';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFileStoreBase } from '@/store/entities/file';
import { useFolderStore } from '@/store/entities/folder';
import type { FolderWithStats } from '@/types/entities/folder';
import type { ViewProps } from '../types';
import FoldersContentView from './folders-content-view';

const viewLogger = clientLogger.withContext('FoldersView');

export function FoldersView(_props: ViewProps) {
	const { setCurrentView, setCurrentItem } = useNavigationStore();

	// 🆕 Usar los nuevos stores específicos
	const { selectFolder, getFolder } = useFolderStore();
	const { mutate: createFolder } = useCreateFolder(); // Obtener la función de mutación

	// 🧹 Para limpiar selección - usar el hook base directamente
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);

	const [folders, setFolders] = useState<FolderWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [showForm, setShowForm] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderPath, setNewFolderPath] = useState('');

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<FolderWithStats[]>(folders);
	// Mantener un contador de reintentos
	const [retryCount, setRetryCount] = useState(0);
	const [isManualRetry, setIsManualRetry] = useState(false);
	const maxRetries = 3;

	// Separar la lógica de carga para evitar dependencias circulares
	const executeLoad = useCallback(
		async (isManual = false) => {
			try {
				if (isManual) {
					setIsManualRetry(true);
				}
				setIsLoading(true);
				viewLogger.info('🔄 Cargando carpetas...');
				const result = await findFolders({ limit: 100 });

				// ✅ Transformar datos para EntityCard - ahora los datos ya vienen con estadísticas
				if (result?.data && Array.isArray(result.data)) {
					const transformedData = result.data.map((folderData: FolderWithStats): FolderWithStats => {
						return {
							...folderData,
							lastIndexed: folderData.lastIndexed ? new Date(folderData.lastIndexed) : null,
							createdAt: new Date(folderData.createdAt),
							updatedAt: new Date(folderData.updatedAt),
							// Las estadísticas ya vienen del servicio, no necesitamos modificarlas
							// _count ya viene del transformer
							// totalSize y totalFiles ya vienen del transformer
						};
					});

					setFolders(transformedData);
					setRetryCount(0);
					setError(null);
					viewLogger.info(`✅ ${transformedData.length} carpetas cargadas`);
				} else {
					throw new Error('Respuesta del servicio no es un array válido');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

				// Gestionar los casos de errores de concurrencia o transitorios solo en carga automática
				const isTransientError =
					(errorMessage.includes('Operación') && errorMessage.includes('en progreso')) ||
					errorMessage.includes('ECONNREFUSED') ||
					errorMessage.includes('timeout') ||
					errorMessage.includes('network');

				if (isTransientError && retryCount < maxRetries && !isManual) {
					// Calcular retraso de reintento exponencial (300ms, 900ms, 2700ms)
					const retryDelay = 300 * 3 ** retryCount;
					viewLogger.debug(
						`🔄 Error transitorio, reintentando en ${retryDelay}ms (intento ${retryCount + 1}/${maxRetries})...`
					);

					// Incrementar contador de reintentos y programar un nuevo intento
					setRetryCount((prev) => prev + 1);
					setTimeout(() => {
						executeLoad(false);
					}, retryDelay);
					return;
				}

				// Si hemos alcanzado el máximo de reintentos o no es un error transitorio, mostrar el error
				if (retryCount >= maxRetries && !isManual) {
					viewLogger.warn(`⚠️ Alcanzado máximo de reintentos (${maxRetries})`);
				}

				viewLogger.error('❌ Error cargando carpetas:', error);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
				if (isManual) {
					setIsManualRetry(false);
				}
			}
		},
		[retryCount]
	);

	// Hook para carga inicial - sin dependencias que causen loops
	useEffect(() => {
		viewLogger.debug('🟢 FoldersView Montado');
		// Cargar carpetas solo una vez al montar
		if (folders.length === 0 && !isLoading) {
			viewLogger.debug('📁 Iniciando carga de carpetas...');
			executeLoad(false);
		}

		return () => {
			viewLogger.debug('🔴 FoldersView Desmontado');
		};
	}, [executeLoad, folders.length, isLoading]); // Solo ejecutar al montar/desmontar

	// Función pública para recargar
	const loadFolders = useCallback(
		(isManual = false) => {
			setRetryCount(0); // Resetear contador en cargas manuales
			executeLoad(isManual);
		},
		[executeLoad]
	);

	const handleFolderClick = useCallback(
		(folder: FolderWithStats) => {
			try {
				viewLogger.info('🖱️ Click en carpeta:', folder.name);
				viewLogger.debug('ℹ️ Carpeta clickeada:', folder);

				// Verificaciones de seguridad
				if (!folder || !folder.id) {
					viewLogger.error('❌ Carpeta inválida:', folder);
					return;
				}

				viewLogger.debug('🧹 Limpiando selecciones previas...');
				// 🧹 Limpiar selecciones previas
				deselectAllFiles();
				viewLogger.debug('✅ Selecciones limpiadas.');

				viewLogger.debug('🔄 Actualizando el store de carpetas (selectFolder)...');
				// 🔄 Actualizar el store de carpetas PRIMERO
				selectFolder(folder.id);
				viewLogger.debug(`✅ selectFolder llamado con ID: ${folder.id}`);

				viewLogger.debug('📋 Estableciendo elemento actual en navigation store...');
				// 📋 Establecer el elemento actual en el navigation store
				setCurrentItem({
					id: folder.id,
					name: folder.name,
					path: folder.path,
					description: folder.description || undefined,
					color: folder.color || undefined,
					emoji: folder.emoji || undefined,
					count: folder._count?.images || 0,
					totalSize: folder.totalSize,
					lastIndexed: folder.lastIndexed || undefined,
					createdAt: folder.createdAt,
					itemType: 'folder',
				});
				viewLogger.debug('✅ setCurrentItem llamado con datos de carpeta.');

				viewLogger.debug('📍 Actualizando la vista de navegación (setCurrentView)...');
				// 📍 Actualizar la vista de navegación
				setCurrentView('folder-content');
				viewLogger.debug('✅ setCurrentView llamado a folder-content.');

				viewLogger.info(`✅ Navegando a carpeta: ${folder.name} (${folder.id})`);
			} catch (error) {
				viewLogger.error('❌ Error al cambiar a la carpeta:', error);
			}
		},
		[setCurrentView, setCurrentItem, deselectAllFiles, selectFolder]
	);

	// Función para reintento manual
	const handleManualRetry = useCallback(() => {
		loadFolders(true);
	}, [loadFolders]);

	const handleCreateFolder = useCallback(async () => {
		if (newFolderName.trim() === '') {
			console.error('El nombre de la carpeta no puede estar vacío.');
			return;
		}
		// Aquí se asume que createFolder es una función que interactúa con el backend
		// y que, al completarse, recargará la lista de carpetas o actualizará el store.
		try {
			await createFolder({ name: newFolderName, path: newFolderPath });
			setNewFolderName('');
			setNewFolderPath('');
			setShowForm(false);
			loadFolders(true); // Recargar carpetas después de crear una nueva
		} catch (err) {
			console.error('Error al crear carpeta:', err);
		}
	}, [newFolderName, newFolderPath, createFolder, loadFolders]);

	return (
		<FoldersContentView
			folders={folders}
			isLoading={isLoading}
			error={error}
			showForm={showForm}
			newFolderName={newFolderName}
			newFolderPath={newFolderPath}
			optimisticFolders={optimisticFolders}
			setShowForm={setShowForm}
			setNewFolderName={setNewFolderName}
			setNewFolderPath={setNewFolderPath}
			handleFolderClick={handleFolderClick}
			handleCreateFolder={handleCreateFolder}
			handleManualRetry={handleManualRetry}
		/>
	);
}
