import { FileIcon, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { FileWithStats } from '@/types/entities/file';

interface FilesContentViewProps {
	files: FileWithStats[];
	isLoading: boolean;
	error: string | null;
	fileCount: number;
	isUploadDialogOpen: boolean;
	uploadFiles: File[];
	uploadProgress: number;
	isUploading: boolean;
	setIsUploadDialogOpen: (isOpen: boolean) => void;
	setUploadFiles: (files: File[]) => void;
	setUploadProgress: (progress: number) => void;
	setIsUploading: (isUploading: boolean) => void;
	handleFileClick: (file: FileWithStats) => void;
	handleFileUpload: (files: File[]) => Promise<void>;
	handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MemoizedEntityCard = React.memo(
	({ file, onFileClick }: { file: FileWithStats; onFileClick: () => void }) => (
		<button
			className="p-4 border rounded-lg shadow-sm h-full w-full text-left hover:bg-gray-50"
			onClick={onFileClick}
			type="button"
		>
			<h3 className="font-medium">{file.name}</h3>
			<p className="text-sm text-gray-600">{file.path}</p>
		</button>
	),
	(prevProps, nextProps) =>
		prevProps.file.id === nextProps.file.id &&
		prevProps.file.name === nextProps.file.name &&
		prevProps.file.updatedAt === nextProps.file.updatedAt
);
MemoizedEntityCard.displayName = 'MemoizedEntityCard';

const FilesContentView: React.FC<FilesContentViewProps> = ({
	files,
	isLoading,
	error,
	fileCount,
	isUploadDialogOpen,
	uploadFiles,
	uploadProgress,
	isUploading,
	setIsUploadDialogOpen,
	setUploadFiles,
	setUploadProgress,
	setIsUploading,
	handleFileClick,
	handleFileUpload,
	handleFileSelect,
}) => {
	const { toast } = useToast();

	// Función para manejar el upload de archivos
	const handleFileUploadInternal = useCallback(
		async (files: File[]) => {
			setIsUploading(true);
			setUploadProgress(0);

			try {
				const formData = new FormData();
				for (const file of files) {
					formData.append('files', file);
				}

				const response = await fetch('/api/files/upload', {
					method: 'POST',
					body: formData,
				});

				if (!response.ok) {
					throw new Error('Error al subir los archivos');
				}

				const result = await response.json();

				toast({
					title: '✅ Archivos subidos exitosamente',
					description: `${result.uploaded} archivos agregados`,
				});

				handleFileUpload(files); // Call the prop function to trigger data reload
			} catch (error) {
				console.error('Error al subir archivos:', error);
				toast({
					title: '❌ Error al subir archivos',
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
		[toast, handleFileUpload, setIsUploading, setUploadProgress, setUploadFiles, setIsUploadDialogOpen]
	);

	const handleFileSelectInternal = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (event.target.files) {
				const files = Array.from(event.target.files);
				setUploadFiles(files);
				handleFileSelect(event); // Call the prop function
			}
		},
		[handleFileSelect, setUploadFiles]
	);

	if (isLoading) {
		return <LoadingScreen message="Cargando archivos..." />;
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (!files || files.length === 0) {
		return (
			<EmptyState
				icon={FileIcon}
				title="No hay archivos"
				description="No se encontraron archivos. Asegúrate de que las carpetas estén indexadas."
			/>
		);
	}

	return (
		<div className="h-full w-full">
			<ScrollArea className="h-full">
				<div className="container mx-auto p-6">
					{/* Header con estadísticas */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-6"
					>
						<h1 className="text-3xl font-bold text-foreground mb-2">📁 Todos los Archivos</h1>
						<p className="text-muted-foreground text-lg">{fileCount} archivos encontrados</p>
					</motion.div>

					{/* Grid de archivos */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
					>
						{files?.map((file: FileWithStats, index: number) => (
							<motion.div
								key={file.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<MemoizedEntityCard file={file} onFileClick={() => handleFileClick(file)} />
							</motion.div>
						)) || []}
					</motion.div>

					{/* Dialog para upload de archivos */}
					<Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
						<DialogTrigger asChild>
							<Button
						variant="primary"
						className="fixed bottom-4 right-4 z-50"
						onClick={() => setIsUploadDialogOpen(true)}
					>
								<Upload className="w-4 h-4 mr-2" />
								Subir Archivos
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Subir Archivos</DialogTitle>
							</DialogHeader>

							<div className="grid gap-4 py-2">
								{/* Instrucciones */}
								<Card>
									<CardHeader>
										<CardTitle className="text-base font-semibold">Instrucciones</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											1. Selecciona los archivos que deseas subir desde tu dispositivo.
										</p>
										<p className="text-sm text-muted-foreground">
											2. Puedes subir imágenes, documentos, videos y otros tipos de archivos.
										</p>
										<p className="text-sm text-muted-foreground">
											3. Haz clic en "Subir Archivos" para iniciar el proceso de carga.
										</p>
									</CardContent>
								</Card>

								{/* Selector de archivos */}
								<div>
									<Label htmlFor="file-upload" className="block text-sm font-medium">
										Seleccionar Archivos
									</Label>
									<Input id="file-upload" type="file" multiple onChange={handleFileSelectInternal} className="mt-1" />
								</div>

								{/* Progreso de carga */}
								{isUploading && (
									<div className="flex flex-col gap-2">
										<Progress value={uploadProgress} className="h-2" />
										<span className="text-xs text-muted-foreground">Cargando... {uploadProgress}%</span>
									</div>
								)}

								{/* Botones de acción */}
								<div className="flex justify-end gap-2">
									<Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} className="h-9">
										Cancelar
									</Button>
									<Button
										onClick={() => handleFileUploadInternal(uploadFiles)}
										className="h-9"
										disabled={isUploading || !uploadFiles || uploadFiles.length === 0}
									>
										{isUploading ? 'Subiendo...' : 'Subir Archivos'}
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</ScrollArea>
		</div>
	);
};

export default FilesContentView;
