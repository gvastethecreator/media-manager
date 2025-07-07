import { useCallback, useEffect, useState } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useFileStoreBase } from '@/store/entities/file';
import { useFolderStore } from '@/store/entities/folder';
import type { FolderWithStats } from '@/types/entities/folder';
import type { ViewProps } from '../../types';

// Componentes simplificados para diagnosticar
const SimpleEmptyState = ({ title, description }: { title: string; description: string }) => (
	<div className="h-full w-full flex flex-col items-center justify-center p-6">
		<div className="text-6xl mb-4">📁</div>
		<h2 className="text-xl font-semibold mb-2">{title}</h2>
		<p className="text-muted-foreground">{description}</p>
	</div>
);

const SimpleLoadingScreen = () => (
	<div className="h-full w-full flex flex-col items-center justify-center p-6">
		<div className="text-6xl mb-4">⏳</div>
		<h2 className="text-xl font-semibold mb-2">Cargando...</h2>
		<p className="text-muted-foreground">Obteniendo carpetas</p>
	</div>
);

export function FoldersViewDiagnostic(_props: ViewProps) {
	const { setCurrentView, setCurrentItem } = useNavigationStore();
	const { selectFolder, getFolder } = useFolderStore();
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);

	const [folders, setFolders] = useState<FolderWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true);
			// Simular carga de carpetas sin hacer la llamada real a la API
			setTimeout(() => {
				setFolders([]);
				setIsLoading(false);
			}, 1000);
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Error desconocido');
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadFolders();
	}, [loadFolders]);

	const handleFolderClick = useCallback(
		(folder: FolderWithStats) => {
			try {
				console.log('🖱️ Click en carpeta:', folder.name);
				deselectAllFiles();
				selectFolder(folder.id);
				setCurrentItem({
					id: folder.id,
					name: folder.name,
					path: folder.path,
					description: folder.description || undefined,
					itemType: 'folder',
				});
				setCurrentView('folder-content');
			} catch (error) {
				console.error('❌ Error al cambiar a la carpeta:', error);
			}
		},
		[setCurrentView, setCurrentItem, deselectAllFiles, selectFolder]
	);

	if (error) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center p-6">
				<div className="text-6xl mb-4">❌</div>
				<h2 className="text-xl font-semibold mb-2">Error</h2>
				<p className="text-muted-foreground">{error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <SimpleLoadingScreen />;
	}

	if (folders.length === 0) {
		return (
			<SimpleEmptyState
				title="No hay carpetas indexadas"
				description="Agrega carpetas desde el panel de configuración para comenzar a indexar tus imágenes."
			/>
		);
	}

	return (
		<div className="h-full w-full flex flex-col items-center justify-center p-6">
			<div className="max-w-md w-full bg-card rounded-lg border border-border p-6 text-center">
				<div className="text-6xl mb-4">📁</div>
				<h2 className="text-xl font-semibold mb-2">Vista de Carpetas - Diagnóstico</h2>
				<p className="text-muted-foreground mb-2">Stores funcionando: ✅</p>
				<p className="text-muted-foreground mb-4">API simulada: ✅</p>
				<div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm">
					<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
					Diagnóstico completo
				</div>
			</div>
		</div>
	);
}
