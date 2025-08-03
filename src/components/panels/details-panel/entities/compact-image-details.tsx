/**
 * @file Componente compacto y optimizado para detalles de imágenes
 * @module components/panels/details-panel/entities/compact-image-details
 */

import {
    Calendar,
    Camera,
    Eye,
    FileImage,
    Folder,
    HardDrive,
    Heart,
    Image as ImageIcon,
    MapPin,
    Star,
    Tag,
    User,
    Zap,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { ImageWithStats } from '@/types/entities/image';
import { isImageWithStats } from '@/types/migration';
import type { EntityDetailsProps } from '../entity-details-registry';

/**
 * Componente compacto para mostrar detalles completos de una imagen
 * Elimina duplicaciones y muestra toda la metadata disponible
 */
export const CompactImageDetails = memo<EntityDetailsProps<ImageWithStats>>(function CompactImageDetails({
	entity,
}) {
	// Datos derivados y cálculos
	const derivedData = useMemo(() => {
		const fileExt = entity.path?.split('.').pop()?.toUpperCase() || 'Unknown';
		const aspectRatio = entity.width && entity.height ? entity.width / entity.height : 1;
		const resolution = entity.width && entity.height ? entity.width * entity.height : 0;
		const megapixels = resolution > 0 ? (resolution / 1000000).toFixed(1) : '0';

		// Calidad basada en resolución
		let qualityScore = 0;
		if (resolution >= 2073600) qualityScore = 100; // 1920x1080+
		else if (resolution >= 921600) qualityScore = 80; // 1280x720+
		else if (resolution >= 307200) qualityScore = 60; // 640x480+
		else if (resolution >= 76800) qualityScore = 40; // 320x240+
		else qualityScore = 20;

		// Formato de fecha más compacto
		const formatDate = (date: string | Date) => {
			const d = new Date(date);
			return d.toLocaleDateString('es', {
				day: '2-digit',
				month: 'short',
				year: '2-digit'
			});
		};

		return {
			fileExt,
			aspectRatio,
			resolution,
			megapixels,
			qualityScore,
			formatDate,
		};
	}, [entity]);

	// Información principal organizada
	const mainInfo = useMemo(() => [
		{
			id: 'resolution',
			icon: <ImageIcon className="h-3 w-3 text-blue-500" />,
			label: 'Resolución',
			value: `${entity.width} × ${entity.height}`,
			secondary: `${derivedData.megapixels} MP`,
		},
		{
			id: 'size',
			icon: <HardDrive className="h-3 w-3 text-amber-500" />,
			label: 'Tamaño',
			value: formatBytes(entity.size || 0),
			secondary: derivedData.fileExt,
		},
		{
			id: 'created',
			icon: <Calendar className="h-3 w-3 text-green-500" />,
			label: 'Creada',
			value: derivedData.formatDate(entity.createdAt),
			secondary: entity.updatedAt ? derivedData.formatDate(entity.updatedAt) : undefined,
		},
		{
			id: 'location',
			icon: <Folder className="h-3 w-3 text-purple-500" />,
			label: 'Ubicación',
			value: entity.path?.split('/').pop() || entity.name,
			secondary: entity.path ? `.../${entity.path.split('/').slice(-2, -1)[0]}` : undefined,
		},
	], [entity, derivedData]);

	// Estadísticas y metadata adicional
	const stats = entity.statistics;
	const counts = entity._count;
	const additionalInfo = useMemo(() => {
		const info = [];

		if (stats?.views !== undefined) {
			info.push({
				id: 'views',
				icon: <Eye className="h-3 w-3 text-indigo-500" />,
				label: 'Vistas',
				value: stats.views.toString(),
			});
		}

		if (stats?.likes !== undefined) {
			info.push({
				id: 'likes',
				icon: <Heart className="h-3 w-3 text-pink-500" />,
				label: 'Me gusta',
				value: stats.likes.toString(),
			});
		}

		if (entity.isFavorite) {
			info.push({
				id: 'favorite',
				icon: <Star className="h-3 w-3 text-yellow-500" />,
				label: 'Favorita',
				value: 'Sí',
			});
		}

		if (counts?.tags !== undefined && counts.tags > 0) {
			info.push({
				id: 'tags',
				icon: <Tag className="h-3 w-3 text-cyan-500" />,
				label: 'Tags',
				value: counts.tags.toString(),
			});
		}

		return info;
	}, [stats, counts, entity.isFavorite]);

	// Información técnica extendida
	const technicalInfo = useMemo(() => {
		const info = [];

		info.push({
			id: 'aspect-ratio',
			label: 'Proporción',
			value: `${derivedData.aspectRatio.toFixed(2)}:1`,
		});

		// Usar metadata parseado si está disponible
		let parsedMetadata = null;
		if (entity.metadata) {
			try {
				parsedMetadata = JSON.parse(entity.metadata);
			} catch {
				// Ignorar errores de parsing
			}
		}

		if (parsedMetadata?.dpi) {
			info.push({
				id: 'dpi',
				label: 'DPI',
				value: typeof parsedMetadata.dpi === 'object'
					? `${parsedMetadata.dpi.x}×${parsedMetadata.dpi.y}`
					: parsedMetadata.dpi.toString(),
			});
		}

		if (parsedMetadata?.colorSpace) {
			info.push({
				id: 'color-space',
				label: 'Color',
				value: parsedMetadata.colorSpace,
			});
		}

		if (parsedMetadata?.compression) {
			info.push({
				id: 'compression',
				label: 'Compresión',
				value: parsedMetadata.compression,
			});
		}

		return info;
	}, [entity, derivedData]);

	if (!isImageWithStats(entity)) {
		return <div>Error: Entidad no es una imagen válida</div>;
	}

	return (
		<div className="space-y-3">
			{/* Header compacto con nombre y acciones */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-sm truncate flex items-center gap-2">
						<FileImage className="h-4 w-4 text-blue-500 flex-shrink-0" />
						{entity.name}
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						{derivedData.fileExt} • {formatBytes(entity.size || 0)}
					</p>
				</div>
				{entity.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
			</div>

			{/* Grid de información principal */}
			<Card>
				<CardContent className="p-3">
					<div className="grid grid-cols-2 gap-2">
						{mainInfo.map((info) => (
							<div key={info.id} className="flex items-start gap-2">
								{info.icon}
								<div className="flex-1 min-w-0">
									<div className="text-xs text-muted-foreground">{info.label}</div>
									<div className="text-sm font-medium truncate">{info.value}</div>
									{info.secondary && (
										<div className="text-xs text-muted-foreground/70 truncate">{info.secondary}</div>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Calidad y estadísticas */}
			<Card>
				<CardHeader className="p-2 pb-1">
					<CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
						<Zap className="h-3 w-3" />
						Calidad & Actividad
					</CardTitle>
				</CardHeader>
				<CardContent className="p-2 pt-0">
					<div className="space-y-2">
						{/* Barra de calidad */}
						<div className="space-y-1">
							<div className="flex justify-between text-xs">
								<span>Calidad de imagen</span>
								<span className={cn(
									"font-medium",
									derivedData.qualityScore >= 80 ? "text-green-600" :
									derivedData.qualityScore >= 60 ? "text-yellow-600" : "text-red-600"
								)}>
									{derivedData.qualityScore}%
								</span>
							</div>
							<Progress value={derivedData.qualityScore} className="h-1.5" />
						</div>

						{/* Estadísticas en grid compacto */}
						{additionalInfo.length > 0 && (
							<div className="grid grid-cols-2 gap-1.5 pt-1">
								{additionalInfo.map((info) => (
									<div key={info.id} className="flex items-center gap-1.5">
										{info.icon}
										<span className="text-xs text-muted-foreground">{info.label}:</span>
										<span className="text-xs font-medium">{info.value}</span>
									</div>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Información técnica */}
			{technicalInfo.length > 0 && (
				<Card>
					<CardHeader className="p-2 pb-1">
						<CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
							<Camera className="h-3 w-3" />
							Información Técnica
						</CardTitle>
					</CardHeader>
					<CardContent className="p-2 pt-0">
						<div className="grid grid-cols-2 gap-1.5">
							{technicalInfo.map((info) => (
								<div key={info.id} className="flex justify-between text-xs">
									<span className="text-muted-foreground">{info.label}:</span>
									<span className="font-medium">{info.value}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Relaciones y conexiones */}
			{(counts?.albums || counts?.collections || counts?.tags) && (
				<Card>
					<CardHeader className="p-2 pb-1">
						<CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
							<MapPin className="h-3 w-3" />
							Relaciones
						</CardTitle>
					</CardHeader>
					<CardContent className="p-2 pt-0">
						<div className="flex flex-wrap gap-1">
							{counts.albums && counts.albums > 0 && (
								<div className="text-xs px-2 py-0.5 bg-muted rounded-md">
									{counts.albums} álbum{counts.albums !== 1 ? 'es' : ''}
								</div>
							)}
							{counts.collections && counts.collections > 0 && (
								<div className="text-xs px-2 py-0.5 bg-muted rounded-md">
									{counts.collections} colección{counts.collections !== 1 ? 'es' : ''}
								</div>
							)}
							{counts.tags && counts.tags > 0 && (
								<div className="text-xs px-2 py-0.5 bg-muted rounded-md">
									{counts.tags} etiqueta{counts.tags !== 1 ? 's' : ''}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Metadatos del sistema */}
			<Card>
				<CardHeader className="p-2 pb-1">
					<CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
						<User className="h-3 w-3" />
						Sistema
					</CardTitle>
				</CardHeader>
				<CardContent className="p-2 pt-0">
					<div className="space-y-1">
						<div className="flex justify-between text-xs">
							<span className="text-muted-foreground">ID:</span>
							<span className="font-mono text-xs bg-muted px-1 rounded">{entity.id.slice(0, 8)}...</span>
						</div>
						{entity.addedAt && (
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Agregada:</span>
								<span className="font-medium">{derivedData.formatDate(entity.addedAt)}</span>
							</div>
						)}
						{entity.folderId && (
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Carpeta:</span>
								<span className="font-mono text-xs bg-muted px-1 rounded">{entity.folderId.slice(0, 8)}...</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
});
