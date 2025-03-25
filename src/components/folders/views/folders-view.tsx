'use client';

import { getFolders } from '@/app/actions/folders/folder-crud.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardDev, useCardDisplay } from '@/components/features/entity-cards';
import { getCardOptionsFromPreset } from '@/components/features/entity-cards/actions/visual-presets.actions';
import { createDebugger } from '@/components/features/entity-cards/debug/render-debug';
import type { CardOptions } from '@/components/features/entity-cards/types/base-card-types';
import { normalizeEntityData } from '@/components/features/entity-cards/utils/data-validator';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import type { Folder } from '@/types/entities/folders';
import { FolderIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../../views/types';

const viewLogger = serverLogger.withContext('FoldersView');

// Crear un debugger para este componente
const debug = createDebugger('FoldersView', process.env.NODE_ENV === 'development');

// Configuración visual mejorada para carpetas tipo TCG (Trading Card Game)
const DEFAULT_FOLDER_OPTIONS: CardOptions = {
	primaryColor: '#3b82f6',
	secondaryColor: '#1e40af',
};

// Actualizar la definición de tipo para Folder para incluir _count
type FolderWithCount = Folder & {
	_count?: {
		images: number
	}
};

// Componente memoizado para cada tarjeta de carpeta
const MemoizedFolderCard = React.memo(
	({
		folder,
		cardOptions,
		onFolderClick,
	}: {
		folder: FolderWithCount;
		cardOptions: CardOptions;
		onFolderClick: () => void;
	}) => {
		// Debug de renderizados
		if (process.env.NODE_ENV === 'development') {
			debug.logRender({
				message: 'Renderizando MemoizedFolderCard',
				folderId: folder.id,
				folderName: folder.name
			});
		}

		// Normalizar los datos de la carpeta
		const normalizedFolder = normalizeEntityData(folder, 'folder') as FolderWithCount;

		return (
			<EntityCardDev
				key={`folder-card-${normalizedFolder.id}`}
				id={normalizedFolder.id}
				title={normalizedFolder.name}
				description={normalizedFolder.description || ''}
				image={normalizedFolder.featuredImage || undefined}
				metadata={{
					Imágenes: normalizedFolder._count?.images || normalizedFolder.imageCount || 0,
					...(normalizedFolder.totalSize ? { Tamaño: formatBytes(normalizedFolder.totalSize) } : {})
				}}
				onClick={onFolderClick}
				options={cardOptions}
				className="h-full"
			/>
		);
	},
	(prevProps, nextProps) => {
		// Memoización personalizada para solo re-renderizar si cambian propiedades importantes
		const result =
			prevProps.folder.id === nextProps.folder.id &&
			prevProps.folder.name === nextProps.folder.name &&
			prevProps.folder.emoji === nextProps.folder.emoji &&
			prevProps.folder.imageCount === nextProps.folder.imageCount &&
			JSON.stringify(prevProps.cardOptions) === JSON.stringify(nextProps.cardOptions);

		// Log de re-renderizados para depuración
		if (!result && process.env.NODE_ENV === 'development') {
			debug.logRender({
				message: 'Re-renderizado MemoizedFolderCard',
				folderId: nextProps.folder.id,
				reason: prevProps.folder.id !== nextProps.folder.id
					? 'Cambio de ID'
					: prevProps.folder.name !== nextProps.folder.name
						? 'Cambio de nombre'
						: 'Otros cambios'
			});
		}

		return result;
	}
);

// Función auxiliar para formatear bytes
function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / (k ** i)).toFixed(decimals))} ${sizes[i]}`;
}

export function FoldersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentFolder, clearSelection } = useFileManager();
	const [folders, setFolders] = useState<FolderWithCount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_FOLDER_OPTIONS);
	// Nuevo estado para almacenar presets de carpetas
	const [folderPresets, setFolderPresets] = useState<Record<string, CardOptions>>({});

	// Obtener el modo de visualización actual del contexto
	const { displayMode } = useCardDisplay();

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<Folder[]>(folders);

	// Función para cargar la configuración de un preset
	const loadPresetConfig = useCallback(async (presetId: string): Promise<CardOptions | null> => {
		try {
			const response = await getCardOptionsFromPreset(presetId, 'folder');
			if (response.success && response.data) {
				return response.data as CardOptions;
			}
			return null;
		} catch (error) {
			viewLogger.error('❌ Error cargando preset:', error);
			return null;
		}
	}, []);

	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando carpetas...');
			const data = await getFolders();
			const transformedData = data.map((folderData: any) => {
				return {
					...folderData,
					lastIndexed: folderData.lastIndexed ? new Date(folderData.lastIndexed) : null,
					createdAt: new Date(folderData.createdAt),
					updatedAt: new Date(folderData.updatedAt),
					// Asegurarnos de que _count existe
					_count: folderData._count || { images: folderData.imageCount || 0 },
				} as Folder;
			});

			setFolders(transformedData);
			viewLogger.info(`✅ ${data.length} carpetas cargadas`);

			// Cargar presets para carpetas que tengan presetId
			const presets: Record<string, CardOptions> = {};
			const presetsToLoad = transformedData.filter((folder: any) => folder.presetId);

			if (presetsToLoad.length > 0) {
				viewLogger.info(`🔄 Cargando ${presetsToLoad.length} presets para carpetas...`);

				// Cargar presets en paralelo
				const presetPromises = presetsToLoad.map(async (folder: any) => {
					if (folder.presetId) {
						const presetOptions = await loadPresetConfig(folder.presetId);
						if (presetOptions) {
							presets[folder.id] = presetOptions;
						}
					}
				});

				await Promise.all(presetPromises);
				viewLogger.info(`✅ ${Object.keys(presets).length} presets cargados`);
			}

			setFolderPresets(presets);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando carpetas:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [loadPresetConfig]);

	useEffect(() => {
		// Log de inicio de carga
		if (process.env.NODE_ENV === 'development') {
			debug.logEffect('loadFolders', []);
		}

		loadFolders();
	}, [loadFolders]);

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const response = await fetch('/api/entities/folders/visual-config');
				if (!response.ok) {
					throw new Error('Error al cargar la configuración visual');
				}
				const config = await response.json();
				// Combinamos la configuración del servidor con nuestros valores por defecto
				setVisualConfig({ ...DEFAULT_FOLDER_OPTIONS, ...config });
			} catch (error) {
				console.error('Error al cargar la configuración visual:', error);
				// Si hay un error, mantenemos la configuración predeterminada
			}
		};

		loadVisualConfig();
	}, []);

	// Función para obtener opciones de tarjeta para una carpeta específica
	const getFolderCardOptions = useCallback((folderId: string): CardOptions => {
		// Si la carpeta tiene un preset personalizado, usarlo
		if (folderPresets[folderId]) {
			// Evitar recrear el objeto en cada llamada
			return folderPresets[folderId];
		}
		// Si no, usar la configuración por defecto
		// (referencia estable que no cambia en cada renderizado)
		return visualConfig;
	}, [folderPresets, visualConfig]);

	const handleFolderClick = useCallback(
		async (folder: FolderWithCount) => {
			try {
				viewLogger.info('🖱️ Click en carpeta:', folder.name);

				// Verificaciones de seguridad
				if (!folder || !folder.id) {
					viewLogger.error('❌ Carpeta inválida:', folder);
					return;
				}

				// Limpiar selecciones previas
				clearSelection();

				// Asegurarnos de establecer la información completa de la carpeta en ambos stores

				// 1. Actualizar el store de navegación
				useNavigationStore.setState({
					currentView: 'folder-content',
					currentItem: {
						id: folder.id,
						name: folder.name,
						emoji: folder.emoji || '',
						count: folder._count?.images || folder.imageCount || 0,
						itemType: 'folder',
					},
					navigationDirection: 1, // Indicar navegación hacia adelante
				});

				// 2. Actualizar el store de gestor de archivos
				useFileManager.setState({
					currentFolder: {
						id: folder.id,
						name: folder.name,
						count: folder._count?.images || folder.imageCount || 0
					},
					currentFolderId: folder.id,
					currentView: 'folder-content',
					isLoading: true, // Indicar que comenzará la carga
					selectedItems: [], // Limpiar selección explícitamente
					currentItems: [], // Limpiar items actuales para evitar datos antiguos
				});

				// 3. Ahora cambiar la vista
				setCurrentView('folder-content');

				viewLogger.info(`✅ Navegando a carpeta: ${folder.name} (${folder.id})`);
			} catch (error) {
				viewLogger.error('❌ Error al cambiar a la carpeta:', error);
			}
		},
		[setCurrentView, clearSelection]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
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
										type: "spring",
										stiffness: 100,
										damping: 12
									}}
									className="cursor-pointer perspective-1000"
									onClick={onFolderClick}
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-folder-id={folder.id}
									>
										<MemoizedFolderCard
											folder={folder}
											cardOptions={getFolderCardOptions(folder.id)}
											onFolderClick={onFolderClick}
										/>
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
