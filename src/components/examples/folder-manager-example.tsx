'use client';

import { createFolder, deleteFolder } from '@/app/actions/folders/crud.actions';
import { getFolders } from '@/app/actions/folders/query.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { folderService } from '@/services/folder';
import { AlertCircle, FolderPlus, RefreshCw, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import FolderReindexExample from './folder-reindex-example';

export default function FolderManagerExample() {
	const [folders, setFolders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [newFolderPath, setNewFolderPath] = useState('');
	const [newFolderName, setNewFolderName] = useState('');
	const [folderType, setFolderType] = useState('images');
	const [globalProgress, setGlobalProgress] = useState<any>(null);

	// Cargar carpetas al iniciar
	const loadFolders = useCallback(async () => {
		setLoading(true);
		try {
			const result = await getFolders();
			if (result.success) {
				setFolders(result.data || []);
			} else {
				toast.error('Error al cargar carpetas', {
					description: result.error?.message || 'Ocurrió un error inesperado'
				});
			}
		} catch (error: any) {
			toast.error('Error al cargar carpetas', {
				description: error.message || 'Ocurrió un error inesperado'
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadFolders();

		// Suscribirse a eventos globales
		folderService.on('folder:stats:updated', handleFolderUpdated);

		return () => {
			folderService.off('folder:stats:updated', handleFolderUpdated);
		};
	}, [loadFolders]);

	// Manejar actualizaciones de carpetas
	const handleFolderUpdated = useCallback((data: any) => {
		setFolders(prev =>
			prev.map(folder =>
				folder.id === data.folderId
					? { ...folder, stats: data.stats }
					: folder
			)
		);
	}, []);

	// Eliminar carpeta
	const handleDeleteFolder = async (folderId: string) => {
		if (!confirm('¿Estás seguro de eliminar esta carpeta? Esta acción no se puede deshacer.')) {
			return;
		}

		try {
			const result = await deleteFolder(folderId);

			// Actualizar la lista de carpetas
			setFolders(prev => prev.filter(folder => folder.id !== folderId));
			toast.success('Carpeta eliminada correctamente');
		} catch (error: any) {
			toast.error('Error al eliminar carpeta', {
				description: error.message || 'Ocurrió un error inesperado'
			});
		}
	};

	// Crear nueva carpeta
	const handleCreateFolder = async () => {
		if (!newFolderPath || !newFolderName) {
			toast.error('Por favor completa todos los campos');
			return;
		}

		try {
			const result = await createFolder(newFolderPath, {
				name: newFolderName,
				type: folderType as any,
			});

			// Añadir a la lista de carpetas
			setFolders(prev => [...prev, result]);
			setDialogOpen(false);
			setNewFolderPath('');
			setNewFolderName('');
			setFolderType('images');
			toast.success('Carpeta creada correctamente');
		} catch (error: any) {
			toast.error('Error al crear carpeta', {
				description: error.message || 'Ocurrió un error inesperado'
			});
		}
	};

	// Reindexar todas las carpetas
	const reindexAllFolders = async () => {
		try {
			// Estado local para la reindexación global
			const [isReindexingAll, setIsReindexingAll] = useState(false);

			setIsReindexingAll(true);
			setGlobalProgress(null);

			// Crear callbacks para monitoreo global
			const callbacks = {
				onProgress: (status: any) => {
					setGlobalProgress(status);
					toast.info(`Reindexación en progreso: ${status.progress ? `${Math.round(status.progress)}%` : 'Iniciando...'}`);
				},
				onError: (error: any) => {
					setIsReindexingAll(false);
					setGlobalProgress(null);
					toast.error('Error en reindexación', {
						description: error.message || 'Ocurrió un error inesperado'
					});
				},
				onComplete: (data: any) => {
					setIsReindexingAll(false);
					setGlobalProgress(null);
					toast.success(data.cancelled
						? 'Reindexación cancelada'
						: 'Reindexación completa', {
						description: data.cancelled
							? `Se completaron ${data.successful} de ${data.totalFolders} carpetas`
							: `Se procesaron ${data.totalFiles || 0} archivos en total`
					});
					loadFolders(); // Recargar carpetas para obtener estadísticas actualizadas
				}
			};

			// Iniciar reindexación
			await folderService.reindexAll({
				maxConcurrent: 2, // Limitar a 2 carpetas simultáneas
				batchSize: 50,     // Procesar en lotes de 50 archivos
				onGlobalProgress: callbacks.onProgress,
			});
		} catch (error: any) {
			toast.error('Error al iniciar reindexación', {
				description: error.message || 'Ocurrió un error inesperado'
			});
		}
	};

	// Cancelar reindexación global
	const cancelReindexAll = () => {
		folderService.emit('folder:cancel:all', {});
		toast.info('Cancelando reindexación global...');
	};

	return (
		<div className="space-y-8 p-6">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Gestor de Carpetas</h2>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={reindexAllFolders}
						className="flex items-center gap-2"
					>
						<RefreshCw className="h-4 w-4" />
						Reindexar Todo
					</Button>

					{globalProgress && (
						<Button
							variant="destructive"
							onClick={cancelReindexAll}
							className="flex items-center gap-2"
							disabled={!globalProgress?.canCancel}
						>
							<X className="h-4 w-4" />
							Cancelar
						</Button>
					)}

					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button className="flex items-center gap-2">
								<FolderPlus className="h-4 w-4" />
								Nueva Carpeta
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Agregar Nueva Carpeta</DialogTitle>
								<DialogDescription>
									Agrega una nueva carpeta para monitorear y procesar imágenes.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nombre de la carpeta</Label>
									<Input
										id="name"
										value={newFolderName}
										onChange={(e) => setNewFolderName(e.target.value)}
										placeholder="Mis Fotos"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="path">Ruta completa</Label>
									<Input
										id="path"
										value={newFolderPath}
										onChange={(e) => setNewFolderPath(e.target.value)}
										placeholder="C:\Users\Username\Pictures"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="type">Tipo de carpeta</Label>
									<Select value={folderType} onValueChange={setFolderType}>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un tipo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="images">Imágenes</SelectItem>
											<SelectItem value="videos">Videos</SelectItem>
											<SelectItem value="documents">Documentos</SelectItem>
											<SelectItem value="mixed">Contenido mixto</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<DialogFooter>
								<Button variant="outline" onClick={() => setDialogOpen(false)}>
									Cancelar
								</Button>
								<Button onClick={handleCreateFolder}>
									Crear Carpeta
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center items-center py-10">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
				</div>
			) : folders.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">No hay carpetas</h3>
						<p className="text-muted-foreground text-center max-w-sm">
							No se encontraron carpetas configuradas. Agrega una nueva carpeta para comenzar a monitorear tus archivos.
						</p>
						<Button
							className="mt-6"
							onClick={() => setDialogOpen(true)}
						>
							Agregar Primera Carpeta
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{folders.map((folder) => (
						<div key={folder.id} className="relative">
							<Button
								variant="ghost"
								size="icon"
								className="absolute top-2 right-2 z-10 text-destructive hover:text-destructive-foreground hover:bg-destructive"
								onClick={() => handleDeleteFolder(folder.id)}
								title="Eliminar carpeta"
							>
								<Trash2 className="h-4 w-4" />
							</Button>

							<FolderReindexExample
								folderId={folder.id}
								folderName={folder.name}
								folderPath={folder.path}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}