'use client';

import { getUploadedImageStats, uploadImages } from '@/app/actions/uploaded-images/uploaded-images.actions';
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
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import toastService from '@/services/toast';
import type { UploadedImageStats } from '@/types/uploaded-images';
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
import { useCallback, useEffect, useId, useState } from 'react';

const sectionLogger = clientLogger.withContext('UploadedImagesSettings');

export function UploadedImagesSettings() {
	const [activeTab, setActiveTab] = useState('general');
	const [stats, setStats] = useState<UploadedImageStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const idImageUpload = useId();
	const idSearchImages = useId();
	const idTypeFilter = useId();
	const idBulkImageUpload = useId();
	const idImportType = useId();
	const idImportCategory = useId();
	const idOptimizeImport = useId();

	// Cargar estadísticas de imágenes
	const loadStats = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await getUploadedImageStats();

			if (response.success) {
				setStats(response.stats as UploadedImageStats);
			} else {
				toastService.error(response.error || 'No se pudieron cargar las estadísticas de imágenes subidas.');
			}
			setIsLoading(false);
		} catch (error) {
			sectionLogger.error('Error al cargar estadísticas:', error);
			toastService.error('No se pudieron cargar las estadísticas de imágenes subidas.');
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	// Función para manejar la subida de imágenes
	const handleFileUpload = useCallback(
		async (files: FileList) => {
			try {
				setIsUploading(true);

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

				// Usar Server Action para subir las imágenes
				const result = await uploadImages(formData);

				if (result.success && result.items) {
					toastService.success(
						`Se ${result.items.length === 1 ? 'ha subido' : 'han subido'} ${result.items.length} ${result.items.length === 1 ? 'imagen' : 'imágenes'} correctamente.`
					);
					loadStats(); // Recargamos las estadísticas
				} else {
					toastService.error(result.error || 'No se pudieron subir las imágenes.');
				}
				setIsUploading(false);
			} catch (error) {
				sectionLogger.error('Error al subir imágenes:', error);
				toastService.error('No se pudieron subir las imágenes.');
				setIsUploading(false);
			}
		},
		[loadStats]
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
			<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm border-none">
				<CardHeader className="p-2 pb-0 bg-transparent">
					<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
						<span className="flex items-center gap-2 h-7">
							<UploadCloud className="h-5 w-5" /> Imágenes Subidas
						</span>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="h-7 gap-1.5 text-xs"
								onClick={() => setShowFilters(!showFilters)}
							>
								<Filter className="h-3.5 w-3.5" />
								<span>Filtros</span>
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-7 w-7 p-0">
										<SlidersHorizontal className="h-3.5 w-3.5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuItem onClick={loadStats} className="text-xs cursor-pointer">
										<RefreshCw className="h-3.5 w-3.5 mr-2" /> Actualizar estadísticas
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								variant="outline"
								size="sm"
								className="h-7 w-7 p-0"
								onClick={() => document.getElementById('image-upload')?.click()}
								disabled={isUploading}
							>
								{isUploading ? (
									<RefreshCw className="h-3.5 w-3.5 animate-spin" />
								) : (
									<ImagePlus className="h-3.5 w-3.5" />
								)}
							</Button>
							<Input
								id={idImageUpload}
								type="file"
								multiple
								accept="image/*"
								className="hidden"
								onChange={handleFileInput}
							/>
						</div>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />

				{showFilters && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden px-2 pb-2"
					>
						<Card className="bg-background shadow-sm">
							<CardContent className="p-3 space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label htmlFor={idSearchImages} className="text-xs">
											Buscar
										</Label>
										<Input id={idSearchImages} placeholder="Nombre de imagen..." className="h-8 text-xs" />
									</div>
									<div className="space-y-1">
										<Label htmlFor={idTypeFilter} className="text-xs">
											Tipo
										</Label>
										<select
											id={idTypeFilter}
											className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
									<Button variant="outline" size="sm" className="h-7 text-xs">
										Aplicar filtros
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}

				<CardContent className="p-2">
					<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
						<TabsList className="bg-muted h-8 p-0.5">
							<TabsTrigger value="general" className={cn('text-xs h-7', activeTab === 'general' && 'text-primary')}>
								General
							</TabsTrigger>
							<TabsTrigger
								value="categories"
								className={cn('text-xs h-7', activeTab === 'categories' && 'text-primary')}
							>
								Categorías
							</TabsTrigger>
							<TabsTrigger value="import" className={cn('text-xs h-7', activeTab === 'import' && 'text-primary')}>
								Importar
							</TabsTrigger>
						</TabsList>

						<TabsContent value="general" className="space-y-3 mt-2">
							{/* Estadísticas generales */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
								<div className="bg-card rounded-md p-3 shadow-sm">
									<div className="text-xs text-muted-foreground">Total de Imágenes</div>
									<div className="text-lg font-semibold">
										{isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : stats?.total || 0}
									</div>
								</div>
								<div className="bg-card rounded-md p-3 shadow-sm">
									<div className="text-xs text-muted-foreground">Tamaño Total</div>
									<div className="text-lg font-semibold">
										{isLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											`${((stats?.totalSize || 0) / 1024 / 1024).toFixed(2)} MB`
										)}
									</div>
								</div>
								<div className="bg-card rounded-md p-3 shadow-sm">
									<div className="text-xs text-muted-foreground">Tamaño Promedio</div>
									<div className="text-lg font-semibold">
										{isLoading ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											`${((stats?.averageSize || 0) / 1024).toFixed(2)} KB`
										)}
									</div>
								</div>
								<div className="bg-card rounded-md p-3 shadow-sm">
									<div className="text-xs text-muted-foreground">Tipos</div>
									<div className="text-lg font-semibold">
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
									<CardTitle className="text-sm font-semibold">Configuraciones</CardTitle>
								</CardHeader>
								<CardContent className="p-3 space-y-3">
									<div className="flex items-center justify-between">
										<div>
											<Label className="text-sm font-medium">Optimización automática</Label>
											<p className="text-xs text-muted-foreground">Optimizar imágenes al subirlas</p>
										</div>
										<Switch defaultChecked />
									</div>
									<div className="flex items-center justify-between">
										<div>
											<Label className="text-sm font-medium">Formato de conversión</Label>
											<p className="text-xs text-muted-foreground">Formato al que se convertirán las imágenes</p>
										</div>
										<select className="w-24 h-8 rounded-md border text-xs">
											<option value="webp">WebP</option>
											<option value="jpg">JPG</option>
											<option value="png">PNG</option>
											<option value="avif">AVIF</option>
										</select>
									</div>
									<Separator />
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="destructive" size="sm" className="w-full h-8 text-xs">
												<Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar todas las imágenes
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
														loadStats();
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

						<TabsContent value="categories" className="space-y-3 mt-2">
							<Card className="overflow-hidden">
								<CardHeader className="bg-muted/50 p-2">
									<CardTitle className="text-sm font-semibold flex items-center justify-between">
										<span>Tipos de Imágenes</span>
										<Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
											<Plus className="h-3.5 w-3.5" /> Añadir tipo
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent className="p-3 space-y-2">
									{isLoading ? (
										<div className="flex justify-center py-4">
											<RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
										</div>
									) : Object.entries(stats?.byType || {}).length > 0 ? (
										Object.entries(stats?.byType || {}).map(([type, count]) => (
											<div
												key={type}
												className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 transition-colors"
											>
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="h-6 text-xs px-2 py-0.5">
														{type}
													</Badge>
													<span className="text-xs text-muted-foreground">{count} imágenes</span>
												</div>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 w-7 p-0"
													onClick={() => {
														// Lógica para eliminar el tipo
													}}
												>
													<X className="h-3.5 w-3.5 text-muted-foreground" />
												</Button>
											</div>
										))
									) : (
										<div className="text-center py-4">
											<p className="text-sm text-muted-foreground">No hay tipos de imágenes definidos</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="import" className="space-y-3 mt-2">
							<Card className="overflow-hidden">
								<CardHeader className="bg-muted/50 p-2">
									<CardTitle className="text-sm font-semibold">Importar Imágenes</CardTitle>
								</CardHeader>
								<CardContent className="p-3 space-y-3">
									<Button
										variant="ghost"
										className="w-full h-auto p-6 border-2 border-dashed rounded-md hover:bg-muted/50 transition-colors flex flex-col items-center justify-center"
										onClick={() => document.getElementById('bulk-image-upload')?.click()}
									>
										<UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
										<p className="text-sm font-medium">Arrastra y suelta imágenes aquí</p>
										<p className="text-xs text-muted-foreground mt-1">O haz clic para seleccionar archivos</p>
										<Input
											id={idBulkImageUpload}
											type="file"
											multiple
											accept="image/*"
											className="hidden"
											onChange={handleFileInput}
										/>
									</Button>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										<Button variant="outline" size="sm" className="h-9 gap-2 text-xs">
											<FolderUp className="h-4 w-4" /> Importar desde carpeta
										</Button>
										<Button variant="outline" size="sm" className="h-9 gap-2 text-xs">
											<ImportIcon className="h-4 w-4" /> Importar desde URL
										</Button>
									</div>

									<Separator />

									<div className="space-y-2">
										<Label className="text-sm font-medium">Ajustes de importación</Label>
										<div className="grid grid-cols-2 gap-2">
											<div className="space-y-1">
												<Label htmlFor={idImportType} className="text-xs">
													Tipo predeterminado
												</Label>
												<select id={idImportType} className="w-full h-8 rounded-md border text-xs">
													<option value="thumbnail">Miniatura</option>
													<option value="avatar">Avatar</option>
													<option value="icon">Icono</option>
													<option value="background">Fondo</option>
												</select>
											</div>
											<div className="space-y-1">
												<Label htmlFor={idImportCategory} className="text-xs">
													Categoría predeterminada
												</Label>
												<select id={idImportCategory} className="w-full h-8 rounded-md border text-xs">
													<option value="user">Usuario</option>
													<option value="system">Sistema</option>
													<option value="ui">Interfaz</option>
												</select>
											</div>
										</div>
										<div className="flex items-center space-x-2 mt-2">
											<Switch id={idOptimizeImport} />
											<Label htmlFor={idOptimizeImport} className="text-xs">
												Optimizar al importar
											</Label>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="overflow-hidden">
								<CardHeader className="bg-muted/50 p-2">
									<CardTitle className="text-sm font-semibold">Exportar Imágenes</CardTitle>
								</CardHeader>
								<CardContent className="p-3 space-y-3">
									<Button variant="outline" size="sm" className="w-full h-9 gap-2 text-xs">
										<FileSpreadsheet className="h-4 w-4" /> Exportar inventario a CSV
									</Button>
									<Button variant="outline" size="sm" className="w-full h-9 gap-2 text-xs">
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
