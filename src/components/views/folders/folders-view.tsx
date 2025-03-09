'use client';

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { FolderCard } from '@/components/features/entity-cards/cards/folder-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger';
import { getFolders } from '@/services/folder.service';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import type { Folder } from '@/types/folders';
import { FolderIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('FoldersView');

export function FoldersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentFolder } = useFileManager();
	const [folders, setFolders] = useState<Folder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<Folder[]>(folders);

	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando carpetas...');
			const data = await getFolders();
			const transformedData = data.map((folder) => ({
				...folder,
				lastIndexed: folder.lastIndexed ? new Date(folder.lastIndexed) : null,
				createdAt: new Date(folder.createdAt),
				updatedAt: new Date(folder.updatedAt),
			}));
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
		(folder: Folder) => {
			viewLogger.info('🖱️ Click en carpeta:', folder.name);
			setCurrentView('folder-content');
			setCurrentFolder(folder.id);
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
							<FolderCard folder={folder} onClick={() => handleFolderClick(folder)} />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
