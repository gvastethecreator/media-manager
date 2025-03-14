'use client';

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { getFolders } from '@/services/folder.service';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import type { Folder } from '@/types/entities/folders';
import { FolderIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('FoldersView');

// Configuración visual predeterminada para carpetas
const _DEFAULT_FOLDER_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	designSystem: {
		preset: 'folder' as const,
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},
};

export function FoldersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentFolder } = useFileManager();
	const [folders, setFolders] = useState<Folder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions | null>(null);

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<Folder[]>(folders);

	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando carpetas...');
			const data = await getFolders();
			const transformedData = data.map((folderData) => {
				return {
					...folderData,
					lastIndexed: folderData.lastIndexed ? new Date(folderData.lastIndexed) : null,
					createdAt: new Date(folderData.createdAt),
					updatedAt: new Date(folderData.updatedAt),
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

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const response = await fetch('/api/entities/folders/visual-config');
				if (!response.ok) {
					throw new Error('Error al cargar la configuración visual');
				}
				const config = await response.json();
				setVisualConfig(config);
			} catch (error) {
				console.error('Error al cargar la configuración visual:', error);
			}
		};

		loadVisualConfig();
	}, []);

	const handleFolderClick = useCallback(
		(folder: Folder) => {
			viewLogger.info('🖱️ Click en carpeta:', folder.name);
			setCurrentView('folder-content');
			setCurrentFolder(folder.id);
			// Actualizar la información completa de la carpeta en el store
			useFileManager.setState({
				currentFolder: {
					id: folder.id,
					name: folder.name,
					path: folder.path,
					description: folder.description,
					emoji: folder.emoji,
					_count: folder._count,
					totalSize: folder.totalSize,
					lastIndexed: folder.lastIndexed,
					createdAt: folder.createdAt,
					updatedAt: folder.updatedAt,
				},
			});
		},
		[setCurrentView, setCurrentFolder]
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
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticFolders.map((folder, index) => (
						<motion.div
							key={folder.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<EntityCardAdapter
								entityType="folder"
								entity={folder}
								onClick={() => handleFolderClick(folder)}
								showVisualConfig={true}
								enableExplode={true}
								options={visualConfig || {}}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
