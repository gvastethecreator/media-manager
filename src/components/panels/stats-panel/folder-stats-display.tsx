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

const FolderStatsDisplayComponent = memo(function FolderStatsDisplayImpl({
	folderId,
	folderName,
	className,
}: FolderStatsDisplayProps) {
	const { data: folderDetails, isLoading, error } = useFolderDetails(folderId);
	const { getImagesByFolder } = useImageStore();
	const folderImages = folderId ? getImagesByFolder(folderId) : [];

	// Función auxiliar para formatear tamaño de archivo
	const formatSize = (bytes?: number) => {
		if (!bytes || bytes === 0) {
			return '0 B';
		}
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	// Función auxiliar para formatear fecha
	const formatDate = (date?: Date | string) => {
		if (!date) {
			return 'No disponible';
		}
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
					<p className="text-muted-foreground text-sm">Cargando estadísticas...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={cn('flex items-center justify-center p-8', className)}>
				<div className="flex flex-col items-center gap-3 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
						<Folder className="h-6 w-6 text-destructive" />
					</div>
					<div>
						<p className="font-medium text-destructive text-sm">Error al cargar estadísticas</p>
						<p className="text-muted-foreground text-xs">No se pudieron obtener los datos de la carpeta</p>
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
			<div className="space-y-4 p-4">
				{/* Header de la carpeta */}
				<div className="flex items-start gap-3">
					<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<Folder className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="truncate font-medium text-sm">{displayName}</h3>
						<p className="text-muted-foreground text-xs">Información de la carpeta</p>
					</div>
				</div>

				{/* Estadísticas principales */}
				<div className="grid grid-cols-2 gap-3">
					<Card className="border-0 bg-muted/30">
						<CardContent className="p-3">
							<div className="flex items-center gap-2">
								<ImageIcon className="h-4 w-4 text-green-600" />
								<div>
									<p className="text-muted-foreground text-xs">Imágenes</p>
									<p className="font-semibold text-lg">{imageCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 bg-muted/30">
						<CardContent className="p-3">
							<div className="flex items-center gap-2">
								<File className="h-4 w-4 text-blue-600" />
								<div>
									<p className="text-muted-foreground text-xs">Total</p>
									<p className="font-semibold text-lg">{imageCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Información detallada */}
				{folderDetails && (
					<Card className="border-0 bg-muted/30">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-sm">
								<Hash className="h-4 w-4" />
								Detalles
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 pt-0">
							{/* ID de la carpeta */}
							<div className="flex items-center justify-between border-border/50 border-b py-2">
								<span className="text-muted-foreground text-xs">ID</span>
								<Badge className="font-mono text-xs" variant="outline">
									{folderId}
								</Badge>
							</div>

							{/* Fecha de creación */}
							{folderDetails.createdAt && (
								<div className="flex items-center justify-between border-border/50 border-b py-2">
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Calendar className="h-3 w-3" />
										Creada
									</span>
									<span className="font-mono text-xs">{formatDate(folderDetails.createdAt)}</span>
								</div>
							)}

							{/* Fecha de actualización */}
							{folderDetails.updatedAt && (
								<div className="flex items-center justify-between border-border/50 border-b py-2">
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Calendar className="h-3 w-3" />
										Actualizada
									</span>
									<span className="font-mono text-xs">{formatDate(folderDetails.updatedAt)}</span>
								</div>
							)}

							{/* Descripción si existe */}
							{folderDetails.description && (
								<div className="py-2">
									<p className="mb-1 text-muted-foreground text-xs">Descripción</p>
									<p className="text-xs">{folderDetails.description}</p>
								</div>
							)}

							{/* Path si existe */}
							{folderDetails.path && (
								<div className="py-2">
									<p className="mb-1 text-muted-foreground text-xs">Ruta</p>
									<code className="rounded bg-background px-2 py-1 font-mono text-xs">{folderDetails.path}</code>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Información sobre las imágenes cargadas */}
				{imageCount > 0 && (
					<Card className="border-0 bg-muted/30">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-sm">
								<ImageIcon className="h-4 w-4" />
								Contenido Actual
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Imágenes visibles</span>
								<Badge className="text-xs" variant="secondary">
									{imageCount} elemento{imageCount !== 1 ? 's' : ''}
								</Badge>
							</div>
							{imageCount > 0 && (
								<div className="mt-2">
									<Progress className="h-1" value={100} />
									<p className="mt-1 text-muted-foreground text-xs">Todas las imágenes cargadas</p>
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</ScrollArea>
	);
});

export const FolderStatsDisplay = FolderStatsDisplayComponent;
