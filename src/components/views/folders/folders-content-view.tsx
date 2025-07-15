import { Folder, FolderPlus, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FolderWithStats } from '@/types/entities/folder';

interface FoldersContentViewProps {
	folders: FolderWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newFolderName: string;
	newFolderPath: string;
	optimisticFolders: FolderWithStats[];
	setShowForm: (show: boolean) => void;
	setNewFolderName: (name: string) => void;
	setNewFolderPath: (path: string) => void;
	handleFolderClick: (folder: FolderWithStats) => void;
	handleCreateFolder: () => void;
	handleManualRetry: () => void;
	className?: string;
}

export default function FoldersContentView({
	folders,
	isLoading,
	error,
	showForm,
	newFolderName,
	newFolderPath,
	optimisticFolders,
	setShowForm,
	setNewFolderName,
	setNewFolderPath,
	handleFolderClick,
	handleCreateFolder,
	handleManualRetry,
	className = '',
}: FoldersContentViewProps) {
	// Combinar carpetas reales con optimísticas evitando duplicados
	const allFolders = [...folders, ...optimisticFolders.filter((opt) => !folders.some((f) => f.id === opt.id))];

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
					{allFolders.map((folder, index) => {
						// Crear key único que diferencia entre carpetas reales y optimísticas
						const isOptimistic = optimisticFolders.some((opt) => opt.id === folder.id);
						const uniqueKey = `${folder.id}-${isOptimistic ? 'optimistic' : 'real'}-${index}`;

						return (
							<button
								key={uniqueKey}
								type="button"
								className="group cursor-pointer rounded-lg border p-4 hover:bg-muted/50 transition-colors text-left w-full"
								onClick={() => handleFolderClick(folder)}
							>
								<div className="flex items-start space-x-3">
									<Folder className="h-8 w-8 text-blue-500 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h3 className="font-medium truncate">{folder.name}</h3>
										<p className="text-sm text-muted-foreground truncate">{folder.path}</p>
										<div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
											<span>{folder.stats?.imageCount || 0} imágenes</span>
											<span>0MB</span>
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}
