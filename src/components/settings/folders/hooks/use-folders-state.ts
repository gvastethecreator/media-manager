'use client';

import { clientLogger } from '@/lib/logger/client-logger';
import { folderService } from '@/services/folder-service-export';
import type { FolderStats } from '@/types/entities/folder';
import { useCallback, useState } from 'react';
import { type ExtendedFolder, initialStats } from '../folder-types';

const stateLogger = clientLogger.withContext('FoldersState');

/**
 * Hook para gestionar el estado básico de las carpetas
 */
export function useFoldersState() {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [stats, setStats] = useState<FolderStats>(initialStats);
	const [folders, setFolders] = useState<ExtendedFolder[]>([]);

	// Cargar carpetas desde la API
	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const folders = await folderService.getFolders();

			// Transformar datos de manera segura
			const transformedFolders = folders.map((folder) => ({
				...folder,
				lastIndexed: folder.lastIndexed ? new Date(folder.lastIndexed) : null,
				createdAt: new Date(folder.createdAt || new Date()),
				updatedAt: new Date(folder.updatedAt || new Date()),
				_count: {
					images: folder._count?.images || 0,
				},
				totalSize: Number(folder.totalSize || 0),
				totalFiles: Number(folder.totalFiles || folder._count?.images || 0),
				autoReindex: folder.autoReindex || false,
				recentImages: folder.recentImages?.filter((img): img is string => img !== null) || [],
			}));

			stateLogger.info('✅ Carpetas cargadas:', {
				count: transformedFolders.length,
			});
			setFolders(transformedFolders);

			// Calcular estadísticas básicas a partir de las carpetas
			const totalFiles = transformedFolders.reduce((acc, f) => acc + (f.totalFiles || f._count.images || 0), 0);
			const totalSize = transformedFolders.reduce((acc, f) => acc + (f.totalSize || 0), 0);
			setStats({
				totalFolders: transformedFolders.length,
				totalFiles,
				totalSize,
				lastIndexed: null,
			});
		} catch (error) {
			stateLogger.error('❌ Error cargando carpetas:', error);
			setError(error instanceof Error ? error.message : 'No se pudieron cargar las carpetas');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar estadísticas
	const loadStats = useCallback(async () => {
		try {
			stateLogger.info('🔄 Cargando estadísticas...');
			setIsLoading(true);
			await loadFolders();
			// Las estadísticas se cargan con las carpetas
			setIsLoading(false);
			stateLogger.info('✅ Estadísticas cargadas');
		} catch (error) {
			stateLogger.error('❌ Error cargando estadísticas:', error);
			setError(error instanceof Error ? error.message : 'Error cargando estadísticas');
			setIsLoading(false);
		}
	}, [loadFolders]);

	// Cargar datos iniciales
	const loadInitialData = useCallback(async () => {
		stateLogger.info('🚀 Cargando datos iniciales');
		await loadFolders();
		stateLogger.info('✅ Datos iniciales cargados');
	}, [loadFolders]);

	// Actualizar una carpeta específica
	const updateFolder = useCallback((id: string, updates: Partial<ExtendedFolder>) => {
		setFolders((prevFolders) => prevFolders.map((folder) => (folder.id === id ? { ...folder, ...updates } : folder)));
	}, []);

	// Actualizar estadísticas
	const updateStats = useCallback((newStats: Partial<FolderStats>) => {
		setStats((prevStats) => ({
			...prevStats,
			...newStats,
		}));
	}, []);

	return {
		// Estado
		folders,
		stats,
		error,
		isLoading,

		// Métodos
		loadFolders,
		loadStats,
		loadInitialData,
		updateFolder,
		updateStats,
		setError,
		setFolders,
		setStats,
	};
}
