import { AlertTriangle, FolderSync, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { motion } from '@/components/ui/animejs-shim';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ImageWithStats } from '@/types/entities/image';

interface AllImagesContentViewProps {
	images: ImageWithStats[];
	isLoading: boolean;
	error: string | null;
	indexingStatus: {
		indexedFolders: number;
		totalFolders: number;
		currentFolder: string | null;
		errors: Array<{ folderId: string; message: string }>;
	};
	isIndexing: boolean;
	progress: number;
	startIndexing: () => void;
	handleImageClick: (item: AnyEntityWithStats) => void;
	handleImageDoubleClick: (item: AnyEntityWithStats) => void;
	handleFileUpload: (files: File[]) => Promise<void>;
	handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
	handleFileUpload,
	handleFileSelect,
}) => {
	const { toast } = useToast();

	// Estados para el upload de imágenes
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
	const [uploadFiles, setUploadFiles] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	// Función para manejar el upload de archivos
	const handleFileUploadInternal = useCallback(
		async (files: File[]) => {
			setIsUploading(true);
			setUploadProgress(0);

			try {
				const formData = new FormData();
				for (const file of files) {
					formData.append('images', file);
				}

				const response = await fetch('/api/images/upload', {
					method: 'POST',
					body: formData,
				});

				if (!response.ok) {
					throw new Error('Error al subir las imágenes');
				}

				const result = await response.json();

				toast({
					title: '✅ Imágenes subidas exitosamente',
					description: `${result.uploaded} imágenes agregadas`,
				});

				handleFileUpload(files); // Call the prop function to trigger data reload
			} catch (error) {
				clientLogger.error('Error al subir imágenes:', error);
				toast({
					title: '❌ Error al subir imágenes',
					description: error instanceof Error ? error.message : 'Error desconocido',
					variant: 'destructive',
				});
			} finally {
				setIsUploading(false);
				setUploadProgress(0);
				setUploadFiles([]);
				setIsUploadDialogOpen(false);
			}
		},
		[toast, handleFileUpload]
	);

	const handleFileSelectInternal = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (event.target.files) {
				const files = Array.from(event.target.files);
				const imageFiles = files.filter((file) => file.type.startsWith('image/'));

				if (imageFiles.length !== files.length) {
					toast({
						title: '⚠️ Algunos archivos no son imágenes',
						description: 'Solo se procesarán los archivos de imagen válidos',
					});
				}

				setUploadFiles(imageFiles);
				handleFileSelect(event); // Call the prop function
			}
		},
		[toast, handleFileSelect]
	);

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

			{/* Dialog para upload de imágenes */}
			<Dialog onOpenChange={setIsUploadDialogOpen} open={isUploadDialogOpen}>
				<DialogTrigger asChild>
					<Button className="fixed right-4 bottom-4 z-50" onClick={() => setIsUploadDialogOpen(true)} variant="primary">
						<Upload className="mr-2 h-4 w-4" />
						Subir Imágenes
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-106">
					<DialogHeader>
						<DialogTitle>Subir Imágenes</DialogTitle>
					</DialogHeader>

					<div className="grid gap-4 py-2">
						{/* Instrucciones */}
						<Card>
							<CardHeader>
								<CardTitle className="font-semibold text-base">Instrucciones</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm">
									1. Selecciona las imágenes que deseas subir desde tu dispositivo.
								</p>
								<p className="text-muted-foreground text-sm">
									2. Asegúrate de que las imágenes cumplan con los requisitos de tamaño y formato.
								</p>
								<p className="text-muted-foreground text-sm">
									3. Haz clic en "Subir Imágenes" para iniciar el proceso de carga.
								</p>
							</CardContent>
						</Card>

						{/* Selector de archivos */}
						<div>
							<Label className="block font-medium text-sm" htmlFor="image-upload">
								Seleccionar Imágenes
							</Label>
							<Input
								accept="image/*"
								className="mt-1"
								id="image-upload"
								multiple
								onChange={handleFileSelectInternal}
								type="file"
							/>
						</div>

						{/* Progreso de carga */}
						{isUploading && (
							<div className="flex flex-col gap-2">
								<Progress className="h-2" value={uploadProgress} />
								<span className="text-muted-foreground text-xs">Cargando... {uploadProgress}%</span>
							</div>
						)}

						{/* Botones de acción */}
						<div className="flex justify-end gap-2">
							<Button className="h-9" onClick={() => setIsUploadDialogOpen(false)} variant="outline">
								Cancelar
							</Button>
							<Button
								className="h-9"
								disabled={isUploading || !uploadFiles || uploadFiles.length === 0}
								onClick={() => handleFileUploadInternal(uploadFiles)}
							>
								{isUploading ? 'Subiendo...' : 'Subir Imágenes'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AllImagesContentView;
