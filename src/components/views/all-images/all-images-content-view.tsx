import { FolderUp } from 'lucide-react';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { Button } from '@/components/ui/button';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ImageWithStats } from '@/types/entities/image';

interface AllImagesContentViewProps {
	error: string | null;
	handleImageClick: (item: AnyEntityWithStats) => void;
	handleImageDoubleClick: (item: AnyEntityWithStats) => void;
	images: ImageWithStats[];
	isLoading: boolean;
}

const AllImagesContentView: React.FC<AllImagesContentViewProps> = ({
	images,
	isLoading,
	error,
	handleImageClick,
	handleImageDoubleClick,
}) => {
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
					<Button asChild variant="outline">
						<a href="/files">
							<FolderUp aria-hidden="true" className="mr-2 h-4 w-4" />
							Gestionar reindexado
						</a>
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
