import {
	FileSpreadsheet,
	Filter,
	FolderUp,
	Grid3X3,
	ImagePlus,
	ImportIcon,
	Plus,
	RefreshCw,
	SlidersHorizontal,
	Trash2,
	UploadCloud,
	X,
} from 'lucide-react';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useCallback, useId, useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUploadedImageStats, useUploadImages } from '@/lib/api/uploaded-images';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';

const sectionLogger = clientLogger.withContext('UploadedImagesSettings');

export function UploadedImagesSettings() {
	const [activeTab, setActiveTab] = useState('general');
	const [showFilters, setShowFilters] = useState(false);

	// React Query hooks
	const { data: stats, isLoading, error, refetch } = useUploadedImageStats();
	const uploadImagesMutation = useUploadImages();

	const idImageUpload = useId();
	const idSearchImages = useId();
	const idTypeFilter = useId();
	const idBulkImageUpload = useId();
	const idImportType = useId();
	const idImportCategory = useId();
	const idOptimizeImport = useId();

	// Mostrar error si hay problemas al cargar estadísticas
	if (error) {
		sectionLogger.error('Error al cargar estadísticas:', error);
		toastService.error('No se pudieron cargar las estadísticas de imágenes subidas.');
	}

	// Función para manejar la subida de imágenes
	const handleFileUpload = useCallback(
		async (files: FileList) => {
			try {
				// Crear FormData para la carga
				const formData = new FormData();
				for (const file of Array.from(files)) {
					formData.append('files', file);
				}

				// Asignar tipo según el formulario
				const typeSelect = document.getElementById('import-type') as HTMLSelectElement;
				if (typeSelect?.value) {
					formData.append('type', typeSelect.value);
				}

				// Asignar categoría según el formulario
				const categorySelect = document.getElementById('import-category') as HTMLSelectElement;
				if (categorySelect?.value) {
					formData.append('category', categorySelect.value);
				}

				// Usar React Query mutation para subir las imágenes
				const result = await uploadImagesMutation.mutateAsync(formData);

				if (Array.isArray(result) && result.length > 0) {
					toastService.success(
						`Se ${result.length === 1 ? 'ha subido' : 'han subido'} ${result.length} ${result.length === 1 ? 'imagen' : 'imágenes'} correctamente.`
					);
					refetch(); // Recargamos las estadísticas
				} else {
					toastService.error('No se pudieron subir las imágenes.');
				}
			} catch (error) {
				sectionLogger.error('Error al subir imágenes:', error);
				toastService.error('No se pudieron subir las imágenes.');
			}
		},
		[uploadImagesMutation, refetch]
	);

	// Manejador para la entrada de archivos
	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				handleFileUpload(e.target.files);
			}
		},
		[handleFileUpload]
	);

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="flex flex-col gap-2 rounded-sm border-none bg-muted/30">
				<CardHeader className="bg-transparent p-2 pb-0">
					<CardTitle className="flex items-center justify-between pl-1 font-semibold text-base text-muted-foreground">
						<span className="flex h-7 items-center gap-2">
							<UploadCloud className="h-5 w-5" /> Imágenes Subidas
						</span>
						<div className="flex items-center gap-2">
							<Button
								className="h-7 gap-1.5 text-xs"
								onClick={() => setShowFilters(!showFilters)}
								size="sm"
								variant="outline"
							>
								<Filter className="h-3.5 w-3.5" />
								<span>Filtros</span>
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button className="h-7 w-7 p-0" size="sm" variant="outline">
										<SlidersHorizontal className="h-3.5 w-3.5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuItem className="cursor-pointer text-xs" onClick={() => refetch()}>
										<RefreshCw className="mr-2 h-3.5 w-3.5" /> Actualizar estadísticas
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								className="h-7 w-7 p-0"
								disabled={uploadImagesMutation.isPending}
								onClick={() => document.getElementById('image-upload')?.click()}
								size="sm"
								variant="outline"
							>
								{uploadImagesMutation.isPending ? (
									<RefreshCw className="h-3.5 w-3.5 animate-spin" />
								) : (
									<ImagePlus className="h-3.5 w-3.5" />
								)}
							</Button>
							<Input
								accept="image/*"
								className="hidden"
								id={idImageUpload}
								multiple
								onChange={handleFileInput}
								type="file"
							/>
						</div>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />

				{showFilters && (
					<motion.div
						animate={{ height: 'auto', opacity: 1 }}
						className="overflow-hidden px-2 pb-2"
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
					>
						<Card className="bg-background shadow-sm">
							<CardContent className="space-y-3 p-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label className="text-xs" htmlFor={idSearchImages}>
											Buscar
										</Label>
										<Input className="h-8 text-xs" id={idSearchImages} placeholder="Nombre de imagen..." />
									</div>
									<div className="space-y-1">
										<Label className="text-xs" htmlFor={idTypeFilter}>
											Tipo
										</Label>
										<select
											className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											id={idTypeFilter}
										>
											<option value="">Todos los tipos</option>
											<option value="icon">Iconos</option>
											<option value="avatar">Avatares</option>
											<option value="background">Fondos</option>
											<option value="thumbnail">Miniaturas</option>
											<option value="banner">Banners</option>
											<option value="logo">Logos</option>
											<option value="pattern">Patrones</option>
											<option value="texture">Texturas</option>
											<option value="ui">UI</option>
										</select>
									</div>
								</div>
								<div className="flex justify-end">
									<Button className="h-7 text-xs" size="sm" variant="outline">
										Aplicar filtros
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}

				<CardContent className="p-2">
					<Tabs className="space-y-2" onValueChange={setActiveTab} value={activeTab}>
						<TabsList className="h-8 bg-muted p-0.5">
							<TabsTrigger className={cn('h-7 text-xs', activeTab === 'general' && 'text-primary')} value="general">
								General
							</TabsTrigger>
							<TabsTrigger
								className={cn('h-7 text-xs', activeTab === 'categories' && 'text-primary')}
								value="categories"
							>
								Categorías
							</TabsTrigger>
							<TabsTrigger className={cn('h-7 text-xs', activeTab === 'import' && 'text-primary')} value="import">
								Importar
							</TabsTrigger>
						</TabsList>

						<TabsContent className="mt-2 space-y-3" value="general">
							{/* Estadísticas generales */}
							<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
								<div className="rounded-md bg-card p-3 shadow-sm">
									<div className="text-muted-foreground text-xs">Total de Imágenes</div>
									<div className="font-semibold text-lg">
										{isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : stats?.total || 0}
									</div>
								</div>
								<div className="rounded-md bg-card p-3 shadow-sm">
									<div className="text-muted-foreground text-xs">Tamaño Total</div>
									<div className="font-semibold text-lg">
										{isLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											`${((stats?.totalSize || 0) / 1024 / 1024).toFixed(2)} MB`
										)}
									</div>
								</div>
								<div className="rounded-md bg-card p-3 shadow-sm">
									<div className="text-muted-foreground text-xs">Tamaño Promedio</div>
									<div className="font-semibold text-lg">
										{isLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											`${((stats?.averageSize || 0) / 1024).toFixed(2)} KB`
										)}
									</div>
								</div>
								<div className="rounded-md bg-card p-3 shadow-sm">
									<div className="text-muted-foreground text-xs">Tipos</div>
									<div className="font-semibold text-lg">
										{isLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											Object.keys(stats?.byType || {}).length || 0
										)}
									</div>
								</div>
							</div>

							{/* Configuraciones adicionales */}
							<Card className="overflow-hidden">
								<CardHeader className="bg-muted/50 p-2">
									<CardTitle className="font-semibold text-sm">Configuraciones</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 p-3">
									<div className="flex items-center justify-between">
										<div>
											<Label className="font-medium text-sm">Optimización automática</Label>
											<p className="text-muted-foreground text-xs">Optimizar imágenes al subirlas</p>
										</div>
										<Switch defaultChecked />
									</div>
									<div className="flex items-center justify-between">
										<div>
											<Label className="font-medium text-sm">Formato de conversión</Label>
											<p className="text-muted-foreground text-xs">Formato al que se convertirán las imágenes</p>
										</div>
										<select className="h-8 w-24 rounded-md border text-xs">
											<option value="webp">WebP</option>
											<option value="jpg">JPG</option>
											<option value="png">PNG</option>
											<option value="avif">AVIF</option>
										</select>
									</div>
									<Separator />
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button className="h-8 w-full text-xs" size="sm" variant="destructive">
												<Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar todas las imágenes
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
												<AlertDialogDescription>
													Esta acción eliminará todas las imágenes subidas y no se puede deshacer.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
													onClick={() => {
														toastService.success('Se han eliminado todas las imágenes subidas.');
														refetch();
													}}
												>
													Eliminar
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent className="mt-2 space-y-3" value="categories">
							<Card className="overflow-hidden">
								<CardHeader className="bg-muted/50 p-2">
									<CardTitle className="flex items-center justify-between font-semibold text-sm">
										<span>Tipos de Imágenes</span>
										<Button className="h-7 gap-1 text-xs" size="sm" variant="ghost">
											<Plus className="h-3.5 w-3.5" /> Añadir tipo
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 p-3">
									{isLoading ? (
										<div className="flex justify-center py-4">
											<RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
										</div>
									) : Object.entries(stats?.byType || {}).length > 0 ? (
										Object.entries(stats?.byType || {}).map(([type, count]) => (
											<div
												className="flex items-center justify-between rounded-md border p-2 transition-colors hover:bg-muted/50"
												key={type}
											>
												<div className="flex items-center gap-2">
													<Badge className="h-6 px-2 py-0.5 text-xs" variant="outline">
														{type}
													</Badge>
													<span className="text-muted-foreground text-xs">{count} imágenes</span>
												</div>
												<Button
													className="h-7 w-7 p-0"
													onClick={() => {
														// Lógica para eliminar el tipo
													}}
													size="sm"
													variant="ghost"
												>
													<X className="h-3.5 w-3.5 text-muted-foreground" />
												</Button>
											</div>
										))
									) : (
										<div className="py-4 text-center">
											<p className="text-muted-foreground text-sm">No hay tipos de imágenes definidos</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent className="mt-2 space-y-3" value="import">
							<Card className="overflow-hidden">
								<CardHeader className="bg-muted/50 p-2">
									<CardTitle className="font-semibold text-sm">Importar Imágenes</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 p-3">
									<Button
										className="flex h-auto w-full flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors hover:bg-muted/50"
										onClick={() => document.getElementById('bulk-image-upload')?.click()}
										variant="ghost"
									>
										<UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
										<p className="font-medium text-sm">Arrastra y suelta imágenes aquí</p>
										<p className="mt-1 text-muted-foreground text-xs">O haz clic para seleccionar archivos</p>
										<Input
											accept="image/*"
											className="hidden"
											id={idBulkImageUpload}
											multiple
											onChange={handleFileInput}
											type="file"
										/>
									</Button>

									<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
										<Button className="h-9 gap-2 text-xs" size="sm" variant="outline">
											<FolderUp className="h-4 w-4" /> Importar desde carpeta
										</Button>
										<Button className="h-9 gap-2 text-xs" size="sm" variant="outline">
											<ImportIcon className="h-4 w-4" /> Importar desde URL
										</Button>
									</div>

									<Separator />

									<div className="space-y-2">
										<Label className="font-medium text-sm">Ajustes de importación</Label>
										<div className="grid grid-cols-2 gap-2">
											<div className="space-y-1">
												<Label className="text-xs" htmlFor={idImportType}>
													Tipo predeterminado
												</Label>
												<select className="h-8 w-full rounded-md border text-xs" id={idImportType}>
													<option value="thumbnail">Miniatura</option>
													<option value="avatar">Avatar</option>
													<option value="icon">Icono</option>
													<option value="background">Fondo</option>
												</select>
											</div>
											<div className="space-y-1">
												<Label className="text-xs" htmlFor={idImportCategory}>
													Categoría predeterminada
												</Label>
												<select className="h-8 w-full rounded-md border text-xs" id={idImportCategory}>
													<option value="user">Usuario</option>
													<option value="system">Sistema</option>
													<option value="ui">Interfaz</option>
												</select>
											</div>
										</div>
										<div className="mt-2 flex items-center space-x-2">
											<Switch id={idOptimizeImport} />
											<Label className="text-xs" htmlFor={idOptimizeImport}>
												Optimizar al importar
											</Label>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="overflow-hidden">
								<CardHeader className="bg-muted/50 p-2">
									<CardTitle className="font-semibold text-sm">Exportar Imágenes</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 p-3">
									<Button className="h-9 w-full gap-2 text-xs" size="sm" variant="outline">
										<FileSpreadsheet className="h-4 w-4" /> Exportar inventario a CSV
									</Button>
									<Button className="h-9 w-full gap-2 text-xs" size="sm" variant="outline">
										<Grid3X3 className="h-4 w-4" /> Exportar galería de imágenes
									</Button>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</ScrollArea>
	);
}
