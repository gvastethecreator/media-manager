/**
 * @file Componente optimizado para detalles de selección múltiple
 * @module components/panels/details-panel/entities/multi-selection-details
 */

import {
    BarChart3,
    FileImage,
    Folder,
    HardDrive,
    Layers,
    Video,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils/format.utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface MultiSelectionDetailsProps {
	items: AnyEntityWithStats[];
	onAction?: (action: string, data?: any) => void;
}

/**
 * Componente principal para mostrar detalles de selección múltiple
 */
export const MultiSelectionDetails = memo<MultiSelectionDetailsProps>(function MultiSelectionDetails({
	items,
}) {
	// Análisis de la selección
	const analysis = useMemo(() => {
		if (!items.length) {
			return {
				totalCount: 0,
				totalSize: 0,
				types: {},
				breakdown: [],
			};
		}

		let totalSize = 0;
		const types: Record<string, number> = {};

		// Analizar cada item
		for (const item of items) {
			// Determinar tipo
			let itemType = 'other';
			if ('width' in item && 'height' in item) itemType = 'image';
			else if ('duration' in item) itemType = 'video';
			else if ('path' in item && !('size' in item)) itemType = 'folder';

			// Contar tipos
			types[itemType] = (types[itemType] || 0) + 1;

			// Sumar tamaño
			if ('size' in item && typeof item.size === 'number') {
				totalSize += item.size;
			} else if ('totalSize' in item && typeof item.totalSize === 'number') {
				totalSize += item.totalSize;
			}
		}

		// Crear breakdown para display
		const breakdown = Object.entries(types).map(([type, count]) => {
			const icons = {
				image: <FileImage className="h-4 w-4 text-blue-500" />,
				video: <Video className="h-4 w-4 text-purple-500" />,
				folder: <Folder className="h-4 w-4 text-amber-500" />,
				other: <Layers className="h-4 w-4 text-gray-500" />,
			};

			const labels = {
				image: 'Imágenes',
				video: 'Videos',
				folder: 'Carpetas',
				other: 'Otros',
			};

			return {
				type,
				count,
				percentage: (count / items.length) * 100,
				icon: icons[type as keyof typeof icons] || icons.other,
				label: labels[type as keyof typeof labels] || 'Otros',
			};
		}).sort((a, b) => b.count - a.count);

		return {
			totalCount: items.length,
			totalSize,
			types,
			breakdown,
		};
	}, [items]);

	if (!items.length) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				<Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
				<p className="text-sm">No hay elementos seleccionados</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* Header con resumen */}
			<div className="flex items-center gap-2">
				<Layers className="h-4 w-4 text-primary" />
				<div>
					<h3 className="font-medium text-sm">Selección múltiple</h3>
					<p className="text-xs text-muted-foreground">
						{analysis.totalCount} elemento{analysis.totalCount !== 1 ? 's' : ''} seleccionado{analysis.totalCount !== 1 ? 's' : ''}
					</p>
				</div>
			</div>

			{/* Resumen general */}
			<Card>
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm flex items-center gap-2">
						<BarChart3 className="h-4 w-4" />
						Resumen de la selección
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0">
					<div className="grid grid-cols-2 gap-3">
						<div className="text-center">
							<div className="text-lg font-bold text-primary">{analysis.totalCount}</div>
							<div className="text-xs text-muted-foreground">Elementos</div>
						</div>
						<div className="text-center">
							<div className="text-lg font-bold text-primary">{formatBytes(analysis.totalSize)}</div>
							<div className="text-xs text-muted-foreground">Tamaño total</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Desglose por tipo */}
			<Card>
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Distribución por tipo</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0">
					<div className="space-y-2">
						{analysis.breakdown.map((item) => (
							<div key={item.type} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{item.icon}
									<span className="text-sm">{item.label}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">{item.count}</span>
									<div className="w-16">
										<Progress value={item.percentage} className="h-1.5" />
									</div>
									<span className="text-xs text-muted-foreground w-8 text-right">
										{item.percentage.toFixed(0)}%
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Información técnica */}
			<Card>
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm flex items-center gap-2">
						<HardDrive className="h-4 w-4" />
						Información técnica
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0">
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tamaño promedio:</span>
							<span className="font-medium">
								{analysis.totalCount > 0 ? formatBytes(analysis.totalSize / analysis.totalCount) : '0 B'}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tipos únicos:</span>
							<span className="font-medium">{Object.keys(analysis.types).length}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Selección ID:</span>
							<span className="font-mono text-xs bg-muted px-1 rounded">
								{Date.now().toString(36)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Vista de muestra (primeros elementos) */}
			{items.length > 0 && (
				<Card>
					<CardHeader className="p-3 pb-2">
						<CardTitle className="text-sm">Elementos de muestra</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0">
						<div className="space-y-1 max-h-24 overflow-y-auto">
							{items.slice(0, 5).map((item, index) => (
								<div key={item.id || `item-${index}`} className="flex items-center gap-2 text-xs">
									<div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
									<span className="truncate flex-1">
										{'name' in item ? item.name : `Item ${index + 1}`}
									</span>
									<span className="text-muted-foreground flex-shrink-0">
										{('size' in item && typeof item.size === 'number') ? formatBytes(item.size) :
										 ('totalSize' in item && typeof item.totalSize === 'number') ? formatBytes(item.totalSize) : '—'}
									</span>
								</div>
							))}
							{items.length > 5 && (
								<div className="text-xs text-muted-foreground text-center pt-1">
									... y {items.length - 5} más
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
});
