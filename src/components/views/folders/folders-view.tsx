import { RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderCard } from '@/components/cards/folder-card';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { useCreateFolder, useFolders } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';
import { clientLogger } from '@/lib/logger/client-logger';

interface FoldersViewProps {
	className?: string;
}

export default function FoldersView({ className = '' }: FoldersViewProps) {
	const navigate = useNavigate();
	const { data: foldersResponse, isLoading, error, refetch } = useFolders();
	const folders = foldersResponse?.data || [];
	const { mutate: createFolder, isPending: isCreating } = useCreateFolder();

	// Estado para el formulario de nueva carpeta
	const [showForm, setShowForm] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderPath, setNewFolderPath] = useState('');

	// Manejar clic en carpeta - navegar a la vista de contenido
	const handleFolderClick = useCallback(
		(folder: FolderWithStats) => {
			navigate(`/folders/${folder.id}`);
		},
		[navigate]
	);

	// Memoized folder click handlers to prevent recreating functions
	const folderClickHandlers = useMemo(() => {
		return new Map(folders.map((folder) => [folder.id, () => handleFolderClick(folder)]));
	}, [folders, handleFolderClick]);

	// Manejar creación de carpeta
	const handleCreateFolder = async () => {
		if (!(newFolderName.trim() && newFolderPath.trim())) {
			return;
		}

		try {
			await createFolder({
				name: newFolderName.trim(),
				path: newFolderPath.trim(),
			});

			// Limpiar formulario y cerrarlo
			setNewFolderName('');
			setNewFolderPath('');
			setShowForm(false);
		} catch (error) {
			clientLogger.error('Error creating folder:', error);
		}
	};

	// Manejar reintento manual
	const handleManualRetry = () => {
		refetch();
	};

	// Usar las carpetas obtenidas del hook
	const allFolders = folders;

	if (isLoading && !folders) {
		return <LoadingScreen message="Cargando carpetas..." />;
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center space-y-4">
				<div className="text-center">
					<h3 className="font-semibold text-destructive text-lg">Error al cargar carpetas</h3>
					<p className="text-muted-foreground text-sm">{error instanceof Error ? error.message : String(error)}</p>
				</div>
				<Button onClick={handleManualRetry} variant="outline">
					<RefreshCw className="mr-2 h-4 w-4" />
					Reintentar
				</Button>
			</div>
		);
	}

	return (
		<div className={`m-0 flex h-full flex-col overflow-auto p-0 ${className}`}>
			<div className="grid grid-cols-4 gap-2 p-2">
				{allFolders.map((folder) => (
					<FolderCard
						className="h-full"
						folder={folder}
						interactive={true}
						key={folder.id}
						onClick={folderClickHandlers.get(folder.id)}
						tcgMode={false}
					/>
				))}
			</div>
		</div>
	);
}
