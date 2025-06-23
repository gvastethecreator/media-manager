'use client';

import { clientLogger } from '@/lib/logger/client-logger';
import { folderService } from '@/services/folder-service-export';
import type { FolderStats } from '@/types/entities/folder';
import { useCallback, useState } from 'react';
import { type ExtendedFolder, initialStats } from '../folder-types';

const stateLogger = clientLogger.withContext('FoldersState');

/**
 * Hook para gestionar el estado básico de las carpetas
 * Migrado a usar FolderStatistics para mejor rendimiento
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

			// Calcular estadísticas básicas a partir de las carpetas usando FolderStatistics
			const totalFiles = transformedFolders.reduce((acc: number, f: ExtendedFolder) => acc + (f.totalFiles || f._count.images || 0), 0);
			const totalSize = transformedFolders.reduce((acc: number, f: ExtendedFolder) => acc + (f.totalSize || 0), 0);
			const imageCount = transformedFolders.reduce((acc: number, f: ExtendedFolder) => acc + (f._count.images || 0), 0);

			setStats({
				hierarchyDepth: 0,
				totalDescendants: 0,
				directChildren: transformedFolders.length,
				contentDiversity: 0,
				organizationScore: 0,
				totalItems: totalFiles,
				accessFrequency: 0,
				lastActivity: null,
				imageCount,
				videoCount: 0,
				noteCount: 0,
				documentCount: 0,
				folderCount: transformedFolders.length,
				formattedSize: formatBytes(totalSize),
				averageFileSize: totalFiles > 0 ? totalSize / totalFiles : 0,
				largestFile: 0,
				hasConsistentNaming: false,
				hasDeepHierarchy: false,
				isWellOrganized: false,
				breadcrumbs: [],
				fullPath: '',
				relativePath: '',
				autoTags: [],
				qualityGrade: 'C',
				totalRelations: 0,
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
		setStats((prevStats: any) => ({
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

// Función auxiliar para formatear bytes
function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
