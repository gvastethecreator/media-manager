import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FolderPlus, RefreshCw } from 'lucide-react';
import { FolderCard } from '@/components/cards/folder-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFolders } from '@/lib/api/folders';
import { useCreateFolder } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';

interface FoldersViewProps {
	className?: string;
}

export default function FoldersView({
	className = '',
}: FoldersViewProps) {
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
		if (!newFolderName.trim() || !newFolderPath.trim()) return;

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
					<h3 className="text-lg font-semibold text-destructive">Error al cargar carpetas</h3>
					<p className="text-sm text-muted-foreground">{error}</p>
				</div>
				<Button onClick={handleManualRetry} variant="outline">
					<RefreshCw className="mr-2 h-4 w-4" />
					Reintentar
				</Button>
			</div>
		);
	}

	if (allFolders.length === 0) {
		return (
			<div className={`h-full ${className}`}>
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-xl font-semibold">Carpetas</h2>
					<Button onClick={() => setShowForm(true)} size="sm">
						<FolderPlus className="mr-2 h-4 w-4" />
						Nueva Carpeta
					</Button>
				</div>

				{showForm && (
					<div className="p-4 border-b bg-muted/50">
						<div className="space-y-3">
							<Input
								placeholder="Nombre de la carpeta"
								value={newFolderName}
								onChange={(e) => setNewFolderName(e.target.value)}
							/>
							<Input
								placeholder="Ruta de la carpeta"
								value={newFolderPath}
								onChange={(e) => setNewFolderPath(e.target.value)}
							/>
							<div className="flex gap-2">
								<Button onClick={handleCreateFolder} size="sm">
									Crear
								</Button>
								<Button onClick={() => setShowForm(false)} variant="outline" size="sm">
									Cancelar
								</Button>
							</div>
						</div>
					</div>
				)}

				<EmptyState
					icon={Folder}
					title="No hay carpetas"
					description="Agrega tu primera carpeta para organizar tus archivos."
				/>
			</div>
		);
	}

	return (
		<div className={`h-full flex flex-col ${className}`}>
			<div className="flex items-center justify-between p-4 border-b">
				<h2 className="text-xl font-semibold">Carpetas ({allFolders.length})</h2>
				<Button onClick={() => setShowForm(true)} size="sm">
					<FolderPlus className="mr-2 h-4 w-4" />
					Nueva Carpeta
				</Button>
			</div>

			{showForm && (
				<div className="p-4 border-b bg-muted/50">
					<div className="space-y-3">
						<Input
							placeholder="Nombre de la carpeta"
							value={newFolderName}
							onChange={(e) => setNewFolderName(e.target.value)}
						/>
						<Input
							placeholder="Ruta de la carpeta"
							value={newFolderPath}
							onChange={(e) => setNewFolderPath(e.target.value)}
						/>
						<div className="flex gap-2">
							<Button onClick={handleCreateFolder} size="sm">
								Crear
							</Button>
							<Button onClick={() => setShowForm(false)} variant="outline" size="sm">
								Cancelar
							</Button>
						</div>
					</div>
				</div>
			)}

			<ScrollArea className="flex-1">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
					{allFolders.map((folder) => (
						<FolderCard
							key={folder.id}
							folder={folder}
							onClick={() => handleFolderClick(folder)}
							interactive={true}
							tcgMode={false}
							className="h-full"
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
