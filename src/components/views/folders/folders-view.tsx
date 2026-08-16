import { FolderOpen, RefreshCw } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderCard } from '@/components/cards/folder-card/folder-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { useFolders } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';

interface FoldersViewProps {
	className?: string;
}

export default function FoldersView({ className = '' }: FoldersViewProps) {
	const navigate = useNavigate();
	const { data: foldersResponse, isLoading, error, refetch } = useFolders();
	const folders = foldersResponse?.data || [];

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

	// Manejar reintento manual
	const handleManualRetry = () => {
		refetch();
	};

	// Usar las carpetas obtenidas del hook
	const allFolders = folders;

	if (isLoading && (!folders || folders.length === 0)) {
		return <LoadingScreen message="Loading folders..." />;
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-6">
				<div className="flex h-16 w-16 items-center justify-center rounded-dt-lg bg-destructive/10">
					<RefreshCw className="h-8 w-8 text-destructive" />
				</div>
				<div className="stack-xs text-center">
					<h3 className="heading-lg text-destructive">Could not load folders</h3>
					<p className="body-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
				</div>
				<Button className="mt-2" onClick={handleManualRetry} variant="outline">
					<RefreshCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			</div>
		);
	}

	// Estado vacío: no hay carpetas
	if (!isLoading && allFolders.length === 0) {
		return (
			<EmptyState
				description="No folders are configured. Add a folder to start organizing your files."
				icon={FolderOpen}
				title="No folders"
			/>
		);
	}

	return (
		<div aria-label="Folder list" className={`flex h-full flex-col overflow-auto ${className}`} role="region">
			<div
				aria-label={`${allFolders.length} folders found`}
				className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
				role="list"
			>
				{allFolders.map((folder) => (
					<div key={folder.id} role="listitem">
						<FolderCard
							aria-label={`Folder: ${folder.name}`}
							className="h-full"
							folder={folder}
							interactive={true}
							onClick={folderClickHandlers.get(folder.id)}
							tcgMode={false}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
