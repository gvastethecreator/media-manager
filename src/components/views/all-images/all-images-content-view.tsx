import { AlertTriangle, FolderSync, FolderUp } from 'lucide-react';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from '@/components/ui/motion-shim';
import { Progress } from '@/components/ui/progress';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ImageWithStats } from '@/types/entities/image';

interface AllImagesContentViewProps {
	error: string | null;
	handleImageClick: (item: AnyEntityWithStats) => void;
	handleImageDoubleClick: (item: AnyEntityWithStats) => void;
	images: ImageWithStats[];
	indexingStatus: {
		indexedFolders: number;
		totalFolders: number;
		currentFolder: string | null;
		errors: Array<{ folderId: string; message: string }>;
	};
	isIndexing: boolean;
	isLoading: boolean;
	progress: number;
	startIndexing: () => void;
}

const AllImagesContentView: React.FC<AllImagesContentViewProps> = ({
	images,
	isLoading,
	error,
	indexingStatus,
	isIndexing,
	progress,
	startIndexing,
	handleImageClick,
	handleImageDoubleClick,
}) => {
	// Renderizar barra de estado de indexación
	const renderIndexingStatus = () => {
		if (!indexingStatus || (!isIndexing && indexingStatus.indexedFolders === 0)) {
			return null;
		}

		return (
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="mb-4 rounded-lg border-ui-info-border bg-ui-info p-3"
				initial={{ opacity: 0, y: -20 }}
			>
				<div className="mb-2 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FolderSync className={`h-4 w-4 text-primary ${isIndexing ? 'animate-spin' : ''}`} />
						<span className="font-medium text-blue-900 text-sm dark:text-blue-100">
							{isIndexing ? 'Indexando carpetas...' : 'Indexación completada'}
						</span>
					</div>
					{!isIndexing && (
						<Button className="h-7 text-xs" onClick={startIndexing} size="sm" variant="outline">
							Reindexar
						</Button>
					)}
				</div>

				{isIndexing && (
					<>
						<Progress className="mb-2 h-2" value={progress * 100} />
						<div className="flex items-center justify-between text-primary text-xs dark:text-blue-300">
							<span>
								{indexingStatus?.indexedFolders || 0} de {indexingStatus?.totalFolders || 0} carpetas
							</span>
							{indexingStatus?.currentFolder && (
								<span className="max-w-40 truncate">Procesando: {indexingStatus.currentFolder}</span>
							)}
						</div>
					</>
				)}

				{indexingStatus?.errors && indexingStatus.errors.length > 0 && (
					<div className="mt-2 flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 text-warning" />
						<Badge className="border-ui-warning-border text-ui-warning-text" variant="outline">
							{indexingStatus.errors.length} errores
						</Badge>
					</div>
				)}
			</motion.div>
		);
	};

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && (!images || images.length === 0)) {
		return <LoadingScreen />;
	}

	// El FileBrowser maneja el estado vacío internamente
	return (
		<div className="h-full">
			{/* Barra de estado de indexación */}
			{renderIndexingStatus()}

			{/* Toolbar con controles superiores */}
			<div className="flex items-center justify-between gap-3 border-border border-b bg-background/40 px-3 py-2 backdrop-blur-sm">
				<div className="flex min-w-0 items-center gap-3">
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-foreground text-sm leading-tight">Todas las Imágenes</h2>
						<p className="truncate text-muted-foreground text-xs leading-tight">
							{images?.length || 0} {(images?.length || 0) === 1 ? 'imagen' : 'imágenes'} en total
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{isIndexing && (
						<Badge className="animate-pulse" variant="secondary">
							<FolderSync className="mr-1 h-3 w-3 animate-spin" />
							Indexando
						</Badge>
					)}
					<Button onClick={startIndexing} variant="outline">
						<FolderSync className="mr-2 h-4 w-4" />
						Reindexar
					</Button>
				</div>
			</div>

			{/* FileBrowser para mostrar todas las imágenes */}
			<div className="min-h-0 flex-1 overflow-hidden">
				<FileBrowser
					className="h-full"
					items={images.map((img) => toBrowserItem(img as unknown as Record<string, unknown>))}
					onItemClick={(it: BrowserItem) => {
						const entity = it.raw as unknown as AnyEntityWithStats | undefined;
						if (entity) handleImageClick(entity);
					}}
					onItemDoubleClick={(it: BrowserItem) => {
						const entity = it.raw as unknown as AnyEntityWithStats | undefined;
						if (entity) handleImageDoubleClick(entity);
					}}
				/>
			</div>

			{/* Footer con información adicional */}
			{images && images.length > 0 && (
				<div className="border-border border-t bg-background/40 px-3 py-2">
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>
							Mostrando {images?.length || 0} {(images?.length || 0) === 1 ? 'imagen' : 'imágenes'}
						</span>
						{indexingStatus?.indexedFolders && indexingStatus.indexedFolders > 0 && (
							<span className="text-success dark:text-green-400">
								✅ {indexingStatus.indexedFolders} carpetas indexadas automáticamente
							</span>
						)}
					</div>
				</div>
			)}

			<Button asChild className="fixed right-4 bottom-4 z-50" variant="primary">
				<a href="/files">
					<FolderUp aria-hidden="true" className="mr-2 h-4 w-4" />
					Abrir explorador de archivos
				</a>
			</Button>
		</div>
	);
};

export default AllImagesContentView;
