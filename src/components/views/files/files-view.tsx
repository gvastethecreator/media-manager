import { useCallback, useEffect, useState } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFileStoreBase } from '@/store/entities/file';
import type { FileWithStats } from '@/types/entities/file';
import type { ViewProps } from '../types';
import FilesContentView from './files-content-view';

const viewLogger = clientLogger.withContext('FilesView');

/**
 * Vista principal de todos los archivos
 * Muestra una galería con todos los archivos (imágenes, documentos, etc.)
 */
export function FilesView({ className }: ViewProps) {
	const files = useFileStoreBase((state) => state.files);
	const isLoading = useFileStoreBase((state) => state.isLoading);
	const error = useFileStoreBase((state) => state.error);
	const navigateToDirectory = useFileStoreBase((state) => state.navigateToDirectory);
	const fileCount = useFileStoreBase((state) => state.fileCount);
	const { setCurrentView, setCurrentItem } = useNavigationStore();

	// Estados para el upload de archivos
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
	const [uploadFiles, setUploadFiles] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		// Cargar el directorio raíz al montar el componente
		if (files.length === 0 && !isLoading) {
			viewLogger.info('Store de archivos vacío, cargando directorio raíz...');
			navigateToDirectory('/');
		}
	}, [files.length, isLoading, navigateToDirectory]);

	const handleFileClick = useCallback(
		(file: FileWithStats) => {
			viewLogger.info('🖱️ Click en archivo:', file.name);

			// Navegar a la vista de detalle del archivo
			setCurrentItem({
				id: file.id,
				name: file.name || '',
				path: file.path || '',
				description: undefined,
				count: 1,
				createdAt: file.createdAt,
				itemType: 'file',
			});

			// Abrir el archivo según su tipo
			if (file.type === 'image') {
				setCurrentView('all-images');
			} else {
				// Para otros tipos de archivo, podemos implementar un visor genérico
				viewLogger.info('Abriendo archivo:', file.name);
			}
		},
		[setCurrentView, setCurrentItem]
	);

	// Función para manejar el upload de archivos
	const handleFileUpload = useCallback(
		async (files: File[]) => {
			// Esto debería ser manejado por el content view, pero aquí se recargan los archivos
			navigateToDirectory('/');
		},
		[navigateToDirectory]
	);

	const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		// Esto debería ser manejado por el content view
	}, []);

	return (
		<FilesContentView
			files={files}
			isLoading={isLoading}
			error={error}
			fileCount={fileCount}
			isUploadDialogOpen={isUploadDialogOpen}
			uploadFiles={uploadFiles}
			uploadProgress={uploadProgress}
			isUploading={isUploading}
			setIsUploadDialogOpen={setIsUploadDialogOpen}
			setUploadFiles={setUploadFiles}
			setUploadProgress={setUploadProgress}
			setIsUploading={setIsUploading}
			handleFileClick={handleFileClick}
			handleFileUpload={handleFileUpload}
			handleFileSelect={handleFileSelect}
		/>
	);
}
