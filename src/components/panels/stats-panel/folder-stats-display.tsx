import {
	Calendar,
	File,
	FileText,
	Folder,
	Hash,
	Image as ImageIcon,
	Loader2,
	MapPin,
	Music,
	Palette,
	Star,
	Video,
} from 'lucide-react';
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFolderDetails } from '@/hooks/use-folder-details';
import { useFolderStats, useRecentFolderImages } from '@/lib/api/folders';
import { cn, formatFileSize } from '@/lib/utils';
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
	const { data: folderDetails, isLoading: detailsLoading, error: detailsError } = useFolderDetails(folderId);
	const { data: folderStats, isLoading: statsLoading, error: statsError } = useFolderStats(folderId);
	const { data: recentImages, isLoading: recentLoading } = useRecentFolderImages(folderId, 4);
	const { getImagesByFolder } = useImageStore();

	const folderImages = folderId ? getImagesByFolder(folderId) : [];
	const isLoading = detailsLoading || statsLoading || recentLoading;
	const error = detailsError || statsError;

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
			<div className={cn('flex items-center justify-center p-2', className)}>
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					<p className="text-muted-foreground text-sm">Cargando estadísticas...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={cn('flex items-center justify-center p-2', className)}>
				<div className="flex flex-col items-center gap-2 text-center">
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

	// Preparar estadísticas de tipos de archivo
	const fileTypeStats = folderStats
		? [
				{ type: 'Imágenes', count: folderStats.totalImages, icon: ImageIcon, color: 'text-blue-500' },
				{ type: 'Videos', count: folderStats.totalVideos, icon: Video, color: 'text-purple-500' },
				{ type: 'Audio', count: folderStats.totalAudio, icon: Music, color: 'text-green-500' },
				{ type: 'Documentos', count: folderStats.totalDocuments, icon: FileText, color: 'text-orange-500' },
				{ type: 'Otros', count: folderStats.totalOthers, icon: File, color: 'text-gray-500' },
			].filter((stat) => stat.count > 0)
		: [];

	const totalFiles = folderStats
		? [
				folderStats.totalImages,
				folderStats.totalVideos,
				folderStats.totalAudio,
				folderStats.totalDocuments,
				folderStats.totalOthers,
			].reduce((sum, n) => sum + n, 0)
		: 0;

	return (
		<ScrollArea className={cn('h-full w-full', className)}>
			{/* Header de la carpeta */}
			<div className="flex items-start gap-3 p-2">
				<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
					{folderDetails?.emoji ? (
						<span className="text-xl">{folderDetails.emoji}</span>
					) : (
						<Folder className="h-8 w-8 text-primary" />
					)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex h-12 items-center gap-2">
						<h1 className="truncate font-medium text-xl">{displayName}</h1>
						{folderDetails?.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
					</div>

					{folderDetails?.color && (
						<div className="mt-1 flex items-center gap-1">
							<Palette className="h-3 w-3 text-muted-foreground" />
							<span
								className="inline-block h-3 w-3 rounded-full border border-border"
								style={{ backgroundColor: folderDetails.color }}
							/>
						</div>
					)}
				</div>
				{/* Información sobre las imágenes cargadas */}
				{imageCount > 0 && (
					<div className="flex items-center justify-between gap-3 p-2">
						<Badge className="text-xs" variant="secondary">
							<span className="text-muted-foreground text-xs">visibles : </span>
							{imageCount} elemento{imageCount !== 1 ? 's' : ''}
						</Badge>
						{imageCount > 0 && (
							<div className="mt-2">
								<Progress className="h-1" value={100} />
								<p className="mt-1 text-muted-foreground text-xs">Todas las imágenes cargadas</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Grid de imágenes recientes */}
			{recentImages && recentImages.length > 0 && (
				<div className="border-0 p-4">
					<div className="grid grid-cols-8 gap-2">
						{recentImages.slice(0, 8).map((imageObj) => (
							<div
								className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted/50"
								key={imageObj.id}
							>
								{imageObj.thumbnailUrl ? (
									<img alt={imageObj.name} className="h-full w-full object-cover" src={imageObj.thumbnailUrl} />
								) : (
									<ImageIcon className="h-4 w-4 text-muted-foreground" />
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Estadísticas principales */}
			<div className="grid grid-cols-1 gap-3">
				{/* Resumen de archivos por tipo */}
				{folderStats && totalFiles > 0 && (
					<div className="border-0 p-8 pt-0">
						<div className="space-y-4">
							{fileTypeStats.map((stat) => {
								const Icon = stat.icon;
								const percentage = ((stat.count / totalFiles) * 100).toFixed(1);
								return (
									<div className="flex items-center justify-between" key={stat.type}>
										<div className="flex items-center gap-2">
											<Icon className={`h-4 w-4 ${stat.color}`} />
											<span className="text-sm">{stat.type}</span>
										</div>
										<div className="flex items-center gap-2">
											<Badge className="text-xs" variant="secondary">
												{stat.count}
											</Badge>
											<span className="w-10 text-right text-muted-foreground text-xs">{percentage}%</span>
										</div>
									</div>
								);
							})}

							{/* Tamaño total */}
							{folderStats && folderStats.totalSize > 0 && (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Hash className="h-4 w-4 text-indigo-600" />
										<span className="text-sm">Tamaño total</span>
									</div>
									<Badge className="text-xs" variant="outline">
										{formatFileSize(folderStats.totalSize)}
									</Badge>
								</div>
							)}
						</div>

						{/* Información detallada */}
						{folderDetails && (
							<div className="space-y-3 pt-4">
								{/* ID de la carpeta */}
								<div className="flex items-center justify-between border-border/50 border-b py-2">
									<span className="text-muted-foreground text-xs">ID</span>
									<Badge className="font-mono text-xs" variant="outline">
										{folderId}
									</Badge>
								</div>

								{/* Parent ID si existe */}
								{folderDetails.parentId && (
									<div className="flex items-center justify-between border-border/50 border-b py-2">
										<span className="flex items-center gap-1 text-muted-foreground text-xs">
											<Folder className="h-3 w-3" />
											Carpeta padre
										</span>
										<Badge className="font-mono text-xs" variant="secondary">
											{folderDetails.parentId}
										</Badge>
									</div>
								)}

								{/* Featured Image si existe */}
								{folderDetails.featuredImage && (
									<div className="flex items-center justify-between border-border/50 border-b py-2">
										<span className="flex items-center gap-1 text-muted-foreground text-xs">
											<ImageIcon className="h-3 w-3" />
											Imagen destacada
										</span>
										<Badge className="font-mono text-xs" variant="secondary">
											Configurada
										</Badge>
									</div>
								)}

								{/* Preset ID si existe */}
								{folderDetails.presetId && (
									<div className="flex items-center justify-between border-border/50 border-b py-2">
										<span className="text-muted-foreground text-xs">Preset</span>
										<Badge className="font-mono text-xs" variant="secondary">
											{folderDetails.presetId}
										</Badge>
									</div>
								)}

								{/* Total Files desde schema */}
								{folderDetails.totalFiles !== null && folderDetails.totalFiles !== undefined && (
									<div className="flex items-center justify-between border-border/50 border-b py-2">
										<span className="text-muted-foreground text-xs">Archivos (schema)</span>
										<Badge className="text-xs" variant="secondary">
											{folderDetails.totalFiles}
										</Badge>
									</div>
								)}

								{/* Total Size desde schema */}
								{folderDetails.totalSize !== null &&
									folderDetails.totalSize !== undefined &&
									folderDetails.totalSize > 0 && (
										<div className="flex items-center justify-between border-border/50 border-b py-2">
											<span className="text-muted-foreground text-xs">Tamaño (schema)</span>
											<Badge className="text-xs" variant="secondary">
												{formatFileSize(folderDetails.totalSize)}
											</Badge>
										</div>
									)}

								{/* Last Indexed si existe */}
								{folderDetails.lastIndexed && (
									<div className="flex items-center justify-between border-border/50 border-b py-2">
										<span className="flex items-center gap-1 text-muted-foreground text-xs">
											<Calendar className="h-3 w-3" />
											Último indexado
										</span>
										<span className="font-mono text-xs">{formatDate(folderDetails.lastIndexed)}</span>
									</div>
								)}

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

								{/* Última actividad del backend */}
								{folderStats?.lastActivity && (
									<div className="flex items-center justify-between border-border/50 border-b py-2">
										<span className="flex items-center gap-1 text-muted-foreground text-xs">
											<Calendar className="h-3 w-3" />
											Última actividad
										</span>
										<span className="font-mono text-xs">{formatDate(folderStats.lastActivity)}</span>
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
										<p className="mb-1 flex items-center gap-1 text-muted-foreground text-xs">
											<MapPin className="h-3 w-3" />
											Ruta
										</p>
										<code className="rounded bg-background px-2 py-1 font-mono text-xs">{folderDetails.path}</code>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</ScrollArea>
	);
});

export const FolderStatsDisplay = FolderStatsDisplayComponent;
