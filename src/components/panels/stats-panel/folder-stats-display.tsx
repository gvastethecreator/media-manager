import { Calendar, File, Folder, Hash, Image as ImageIcon, Loader2 } from 'lucide-react';
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFolderDetails } from '@/hooks/use-folder-details';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/store/entities/image';

interface FolderStatsDisplayProps {
	folderId: string;
	folderName?: string;
	className?: string;
}

export const FolderStatsDisplay = memo(function FolderStatsDisplay({
	folderId,
	folderName,
	className,
}: FolderStatsDisplayProps) {
	const { data: folderDetails, isLoading, error } = useFolderDetails(folderId);
	const { getImagesByFolder } = useImageStore();
	const folderImages = folderId ? getImagesByFolder(folderId) : [];

	// Función auxiliar para formatear tamaño de archivo
	const formatSize = (bytes?: number) => {
		if (!bytes || bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	// Función auxiliar para formatear fecha
	const formatDate = (date?: Date | string) => {
		if (!date) return 'No disponible';
		const d = date instanceof Date ? date : new Date(date);
		return d.toLocaleString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	if (isLoading) {
		return (
			<div className={cn('flex items-center justify-center p-8', className)}>
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={cn('flex items-center justify-center p-8', className)}>
				<div className="flex flex-col items-center gap-3 text-center">
					<div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
						<Folder className="h-6 w-6 text-destructive" />
					</div>
					<div>
						<p className="text-sm font-medium text-destructive">Error al cargar estadísticas</p>
						<p className="text-xs text-muted-foreground">No se pudieron obtener los datos de la carpeta</p>
					</div>
				</div>
			</div>
		);
	}

	const folder = folderDetails;
	const displayName = folder?.name || folderName || folderId;
	const imageCount = folderImages.length;

	return (
		<ScrollArea className={cn('h-full', className)}>
			<div className="p-4 space-y-4">
				{/* Header de la carpeta */}
				<div className="flex items-start gap-3">
					<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
						<Folder className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-sm truncate">{displayName}</h3>
						<p className="text-xs text-muted-foreground">Información de la carpeta</p>
					</div>
				</div>

				{/* Estadísticas principales */}
				<div className="grid grid-cols-2 gap-3">
					<Card className="border-0 bg-muted/30">
						<CardContent className="p-3">
							<div className="flex items-center gap-2">
								<ImageIcon className="h-4 w-4 text-green-600" />
								<div>
									<p className="text-xs text-muted-foreground">Imágenes</p>
									<p className="text-lg font-semibold">{imageCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 bg-muted/30">
						<CardContent className="p-3">
							<div className="flex items-center gap-2">
								<File className="h-4 w-4 text-blue-600" />
								<div>
									<p className="text-xs text-muted-foreground">Total</p>
									<p className="text-lg font-semibold">{imageCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Información detallada */}
				{folderDetails && (
					<Card className="border-0 bg-muted/30">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Hash className="h-4 w-4" />
								Detalles
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0 space-y-3">
							{/* ID de la carpeta */}
							<div className="flex justify-between items-center py-2 border-b border-border/50">
								<span className="text-xs text-muted-foreground">ID</span>
								<Badge variant="outline" className="text-xs font-mono">
									{folderId}
								</Badge>
							</div>

							{/* Fecha de creación */}
							{folderDetails.createdAt && (
								<div className="flex justify-between items-center py-2 border-b border-border/50">
									<span className="text-xs text-muted-foreground flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										Creada
									</span>
									<span className="text-xs font-mono">{formatDate(folderDetails.createdAt)}</span>
								</div>
							)}

							{/* Fecha de actualización */}
							{folderDetails.updatedAt && (
								<div className="flex justify-between items-center py-2 border-b border-border/50">
									<span className="text-xs text-muted-foreground flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										Actualizada
									</span>
									<span className="text-xs font-mono">{formatDate(folderDetails.updatedAt)}</span>
								</div>
							)}

							{/* Descripción si existe */}
							{folderDetails.description && (
								<div className="py-2">
									<p className="text-xs text-muted-foreground mb-1">Descripción</p>
									<p className="text-xs">{folderDetails.description}</p>
								</div>
							)}

							{/* Path si existe */}
							{folderDetails.path && (
								<div className="py-2">
									<p className="text-xs text-muted-foreground mb-1">Ruta</p>
									<code className="text-xs bg-background px-2 py-1 rounded font-mono">{folderDetails.path}</code>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Información sobre las imágenes cargadas */}
				{imageCount > 0 && (
					<Card className="border-0 bg-muted/30">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<ImageIcon className="h-4 w-4" />
								Contenido Actual
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="flex justify-between items-center">
								<span className="text-xs text-muted-foreground">Imágenes visibles</span>
								<Badge variant="secondary" className="text-xs">
									{imageCount} elemento{imageCount !== 1 ? 's' : ''}
								</Badge>
							</div>
							{imageCount > 0 && (
								<div className="mt-2">
									<Progress value={100} className="h-1" />
									<p className="text-xs text-muted-foreground mt-1">Todas las imágenes cargadas</p>
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</ScrollArea>
	);
});
