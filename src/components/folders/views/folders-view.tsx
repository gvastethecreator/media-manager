'use client';

import { getFolders } from '@/app/actions/folders/folder-crud.actions';
import { FolderCard } from '@/components/cards/folder-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
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

// Actualizar la definición de tipo para Folder para incluir _count
type FolderWithCount = Folder & {
	_count?: {
		images: number;
	};
};

// Componente memoizado para cada tarjeta de carpeta
const MemoizedFolderCard = React.memo(
	({
		folder,
		onFolderClick,
	}: {
		folder: FolderWithCount;
		onFolderClick: () => void;
	}) => {
		return <FolderCard folder={folder} onClick={onFolderClick} className="h-full" />;
	},
	(prevProps, nextProps) => {
		// Memoización personalizada para solo re-renderizar si cambian propiedades importantes
		return (
			prevProps.folder.id === nextProps.folder.id &&
			prevProps.folder.name === nextProps.folder.name &&
			prevProps.folder.emoji === nextProps.folder.emoji &&
			prevProps.folder.updatedAt === nextProps.folder.updatedAt &&
			prevProps.folder.imageCount === nextProps.folder.imageCount
		);
	}
);

// Para evitar advertencias de displayName
MemoizedFolderCard.displayName = 'MemoizedFolderCard';

export function FoldersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentFolder, clearSelection } = useFileManager();
	const [folders, setFolders] = useState<FolderWithCount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<Folder[]>(folders);

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
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando carpetas:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadFolders();
	}, [loadFolders]);

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
						count: folder._count?.images || folder.imageCount || 0,
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
										<MemoizedFolderCard
											folder={folder}
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
