/**
 * @file Panel de detalles V2 - Usa EntityWithStats
 * @module components/features/file-browser/details/details-panel-v2
 */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { EntityWithStats } from '@/types/migration';
import {
	getEntityStatistics,
	getEntityStatsType,
	isAudioWithStats,
	isImageWithStats,
	isVideoWithStats
} from '@/types/migration';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
	Bug,
	Calendar,
	Cpu,
	FileImage,
	FileText,
	HardDrive,
	Hash,
	Image as ImageIcon,
	Info,
	Loader2,
	MapPin,
	Music,
	Package,
	Palette,
	Users,
	Video
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

interface DetailsPanelV2Props {
	selectedItems: EntityWithStats[];
	className?: string;
}

// Componente memoizado para la vista previa
const EntityPreview = memo<{ item: EntityWithStats }>(function EntityPreview({ item }) {
	const type = getEntityStatsType(item);

	if (isImageWithStats(item) && item.thumbnailUrl) {
		return (
			<img
				src={item.thumbnailUrl}
				alt={item.name || 'Imagen'}
				className="w-full h-full object-contain"
			/>
		);
	}

	if (isVideoWithStats(item) && item.thumbnailUrl) {
		return (
			<div className="relative w-full h-full">
				<img
					src={item.thumbnailUrl}
					alt={item.name || 'Video'}
					className="w-full h-full object-contain"
				/>
				<Video className="absolute top-2 right-2 h-6 w-6 text-white drop-shadow-lg" />
			</div>
		);
	}

	// Vista previa genérica por tipo
	const iconMap = {
		audio: Music,
		document: FileText,
		album: Package,
		collection: Package,
		character: Users,
		tag: Hash,
		place: MapPin,
		folder: FileImage,
	};

	const Icon = iconMap[type as keyof typeof iconMap] || FileImage;

	return (
		<div className="flex items-center justify-center w-full h-full bg-muted/30">
			<Icon className="h-12 w-12 text-muted-foreground opacity-50" />
		</div>
	);
});

// Componente para información básica
const BasicInfoSection = memo<{ item: EntityWithStats }>(function BasicInfoSection({ item }) {
	const type = getEntityStatsType(item);
	const stats = getEntityStatistics(item);

	const infoItems = useMemo(() => {
		const items = [];

		// Nombre
		items.push({
			icon: <Info className="h-3 w-3" />,
			label: 'Nombre',
			value: item.name || 'Sin nombre'
		});

		// Tipo
		items.push({
			icon: <Cpu className="h-3 w-3" />,
			label: 'Tipo',
			value: type.charAt(0).toUpperCase() + type.slice(1)
		});

		// Tamaño (para archivos)
		if ('size' in item && typeof item.size === 'number') {
			items.push({
				icon: <HardDrive className="h-3 w-3" />,
				label: 'Tamaño',
				value: formatBytes(item.size)
			});
		}

		// Fecha de actualización
		if ('updatedAt' in item) {
			items.push({
				icon: <Calendar className="h-3 w-3" />,
				label: 'Actualizado',
				value: formatDistanceToNow(new Date(item.updatedAt), {
					addSuffix: true,
					locale: es
				})
			});
		}

		// Estadísticas
		if (stats) {
			if (stats.totalAssociations > 0) {
				items.push({
					icon: <Package className="h-3 w-3" />,
					label: 'Asociaciones',
					value: stats.totalAssociations.toString()
				});
			}

			if (stats.totalItems !== undefined) {
				items.push({
					icon: <FileImage className="h-3 w-3" />,
					label: 'Elementos',
					value: stats.totalItems.toString()
				});
			}
		}

		return items;
	}, [item, type, stats]);

	return (
		<div className="space-y-2">
			{infoItems.map((info, index) => (
				<div key={index} className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						{info.icon}
						<span>{info.label}</span>
					</div>
					<span className="font-medium truncate max-w-[60%]">{info.value}</span>
				</div>
			))}
		</div>
	);
});

// Componente para información técnica (solo para media)
const TechnicalInfoSection = memo<{ item: EntityWithStats }>(function TechnicalInfoSection({ item }) {
	const infoItems = useMemo(() => {
		const items = [];

		if (isImageWithStats(item)) {
			if (item.width && item.height) {
				items.push({
					icon: <Palette className="h-3 w-3" />,
					label: 'Dimensiones',
					value: `${item.width} × ${item.height}`
				});
			}

			if (item.statistics?.aspectRatio) {
				items.push({
					icon: <ImageIcon className="h-3 w-3" />,
					label: 'Aspect Ratio',
					value: item.statistics.aspectRatio.toFixed(2)
				});
			}
		}

		if (isVideoWithStats(item)) {
			if (item.width && item.height) {
				items.push({
					icon: <Video className="h-3 w-3" />,
					label: 'Resolución',
					value: `${item.width} × ${item.height}`
				});
			}

			if (item.duration) {
				const minutes = Math.floor(item.duration / 60);
				const seconds = Math.floor(item.duration % 60);
				items.push({
					icon: <Calendar className="h-3 w-3" />,
					label: 'Duración',
					value: `${minutes}:${seconds.toString().padStart(2, '0')}`
				});
			}
		}

		if (isAudioWithStats(item)) {
			if (item.duration) {
				const minutes = Math.floor(item.duration / 60);
				const seconds = Math.floor(item.duration % 60);
				items.push({
					icon: <Music className="h-3 w-3" />,
					label: 'Duración',
					value: `${minutes}:${seconds.toString().padStart(2, '0')}`
				});
			}
		}

		return items;
	}, [item]);

	if (infoItems.length === 0) return null;

	return (
		<div className="space-y-2 pt-2 border-t">
			<h4 className="text-xs font-medium text-muted-foreground mb-2">Información técnica</h4>
			{infoItems.map((info, index) => (
				<div key={index} className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						{info.icon}
						<span>{info.label}</span>
					</div>
					<span className="font-medium">{info.value}</span>
				</div>
			))}
		</div>
	);
});

// Componente para selección múltiple
const MultipleSelectionView = memo<{ items: EntityWithStats[] }>(function MultipleSelectionView({ items }) {
	// Agrupar por tipo
	const typeGroups = useMemo(() => {
		const groups = new Map<string, number>();
		items.forEach(item => {
			const type = getEntityStatsType(item);
			groups.set(type, (groups.get(type) || 0) + 1);
		});
		return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
	}, [items]);

	// Calcular tamaño total
	const totalSize = useMemo(() => {
		return items.reduce((sum, item) => {
			if ('size' in item && typeof item.size === 'number') {
				return sum + item.size;
			}
			return sum;
		}, 0);
	}, [items]);

	return (
		<div className="space-y-4">
			{/* Resumen */}
			<div className="text-center space-y-1">
				<h3 className="text-lg font-medium">{items.length} elementos seleccionados</h3>
				{totalSize > 0 && (
					<p className="text-sm text-muted-foreground">
						Tamaño total: {formatBytes(totalSize)}
					</p>
				)}
			</div>

			{/* Desglose por tipo */}
			<div className="space-y-2">
				<h4 className="text-sm font-medium">Tipos de elementos</h4>
				<div className="space-y-1">
					{typeGroups.map(([type, count]) => (
						<div key={type} className="flex justify-between text-sm">
							<span className="capitalize text-muted-foreground">{type}</span>
							<span className="font-medium">{count}</span>
						</div>
					))}
				</div>
			</div>

			{/* Grid de miniaturas */}
			<div className="grid grid-cols-3 gap-2">
				{items.slice(0, 9).map((item) => (
					<div key={item.id} className="aspect-square rounded overflow-hidden bg-muted/30">
						<EntityPreview item={item} />
					</div>
				))}
				{items.length > 9 && (
					<div className="aspect-square rounded bg-muted/30 flex items-center justify-center">
						<span className="text-sm text-muted-foreground">+{items.length - 9}</span>
					</div>
				)}
			</div>
		</div>
	);
});

export const DetailsPanelV2 = memo<DetailsPanelV2Props>(function DetailsPanelV2({
	selectedItems,
	className
}) {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const hasMultipleSelection = selectedItems.length > 1;
	const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;

	// Función de depuración
	const handleDebug = useCallback(() => {
		console.group('🔍 Depuración EntityWithStats');
		console.log('Elementos seleccionados:', selectedItems);
		if (singleItem) {
			console.log('Tipo detectado:', getEntityStatsType(singleItem));
			console.log('Estadísticas:', getEntityStatistics(singleItem));
		}
		console.groupEnd();

		toast({
			title: 'Depuración',
			description: 'Información impresa en la consola (F12)',
		});
	}, [selectedItems, singleItem, toast]);

	// Renderizado del contenido
	const renderContent = () => {
		if (selectedItems.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
					<FileImage className="h-12 w-12 mb-4 opacity-20" />
					<p className="text-sm">Selecciona un elemento para ver sus detalles</p>
				</div>
			);
		}

		if (hasMultipleSelection) {
			return <MultipleSelectionView items={selectedItems} />;
		}

		if (isLoading) {
			return (
				<div className="flex items-center justify-center h-full">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			);
		}

		if (!singleItem) return null;

		return (
			<ScrollArea className="h-full">
				<div className="p-4 space-y-4">
					{/* Vista previa */}
					<div className="aspect-video bg-muted/30 rounded-lg overflow-hidden">
						<EntityPreview item={singleItem} />
					</div>

					{/* Información básica */}
					<Card>
						<CardContent className="pt-4">
							<BasicInfoSection item={singleItem} />
						</CardContent>
					</Card>

					{/* Información técnica (si aplica) */}
					{(isImageWithStats(singleItem) || isVideoWithStats(singleItem) || isAudioWithStats(singleItem)) && (
						<Card>
							<CardContent className="pt-4">
								<TechnicalInfoSection item={singleItem} />
							</CardContent>
						</Card>
					)}
				</div>
			</ScrollArea>
		);
	};

	return (
		<Card className={cn("h-full flex flex-col", className)}>
			<CardHeader className="flex-shrink-0 pb-3">
				<CardTitle className="flex items-center justify-between text-base">
					<span>
						{hasMultipleSelection
							? `${selectedItems.length} elementos`
							: 'Detalles'
						}
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={handleDebug}
					>
						<Bug className="h-4 w-4" />
					</Button>
				</CardTitle>
			</CardHeader>

			<CardContent className="flex-1 overflow-hidden p-0">
				{renderContent()}
			</CardContent>
		</Card>
	);
});

/**
 * 📝 Características:
 * - Usa EntityWithStats en lugar de FileItem
 * - Type guards para mostrar información específica por tipo
 * - Vista para selección múltiple con agrupación por tipo
 * - Información técnica adaptativa según el tipo de media
 * - Componentes internos memorizados para rendimiento
 * - Diseño limpio y consistente con el resto de la app
 */