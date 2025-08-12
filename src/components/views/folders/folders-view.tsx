import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderCard } from '@/components/cards/folder-card';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateFolder, useFolders } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';

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
	const handleFolderClick = (folder: FolderWithStats) => {
		navigate(`/folders/${folder.id}`);
	};

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
			console.error('Error creating folder:', error);
		}
	};

	// Manejar reintento manual
	const handleManualRetry = () => {
		refetch();
	};

	// Usar las carpetas obtenidas del hook
	const allFolders = folders;

	if (isLoading && folders.length === 0) {
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
		<div className={`m-0 flex h-full flex-col p-0 ${className}`}>
			<ScrollArea className="flex-1">
				<div className="grid grid-cols-4 gap-2 p-0">
					{allFolders.map((folder) => (
						<FolderCard
							className="h-full"
							folder={folder}
							interactive={true}
							key={folder.id}
							onClick={() => handleFolderClick(folder)}
							tcgMode={false}
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
