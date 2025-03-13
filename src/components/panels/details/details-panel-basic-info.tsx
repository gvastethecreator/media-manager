'use client';

import { formatBytes, formatDate } from '@/lib/utils/format.utils';
import type { ImageItem } from '@/types/image-item';
import { Calendar, FileImage, FileText, Folder, HardDrive, ImageIcon, Layers } from 'lucide-react';
import { InfoItem } from './details-panel-info-item';
import type { MetadataComponentProps } from './details-panel-types';
import type { BasicInfoProps } from './details-panel-types';

/**
 * Componente que muestra información básica sobre la imagen
 */
export function BasicInfo({ item, metadata }: BasicInfoProps) {
	const hasResolution = metadata?.dimensions || (item.width && item.height);
	const width = metadata?.dimensions?.width || item.width;
	const height = metadata?.dimensions?.height || item.height;

	// Función para formatear fecha
	const formatDate = (dateString: string | number | Date | undefined) => {
		if (!dateString) {
			return 'No disponible';
		}

		try {
			// Intentar parsear la fecha
			const date = new Date(dateString);

			// Verificar si la fecha es válida - usando Number.isNaN en lugar de isNaN
			if (Number.isNaN(date.getTime())) {
				return 'Fecha desconocida';
			}

			// Formatear fecha: DD/MM/YYYY HH:MM
			return date.toLocaleString(undefined, {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch (error) {
			console.error('Error al formatear fecha:', error);
			return 'Fecha desconocida';
		}
	};

	return (
		<div className="space-y-2">
			<div className="grid grid-cols-2 gap-2">
				{item.path && (
					<InfoItem icon={<Folder className="h-4 w-4 text-blue-400" />} label="Ubicación" value={item.path} />
				)}

				{hasResolution && (
					<InfoItem
						icon={<ImageIcon className="h-4 w-4 text-green-400" />}
						label="Resolución"
						value={`${width} x ${height}`}
					/>
				)}

				{item.fileSize && (
					<InfoItem
						icon={<HardDrive className="h-4 w-4 text-amber-400" />}
						label="Tamaño"
						value={formatBytes(item.fileSize)}
					/>
				)}

				{item.createdAt && (
					<InfoItem
						icon={<Calendar className="h-4 w-4 text-indigo-400" />}
						label="Fecha"
						value={formatDate(item.createdAt)}
					/>
				)}

				{metadata?.mimeType && (
					<InfoItem
						icon={<FileImage className="h-4 w-4 text-purple-400" />}
						label="Tipo MIME"
						value={metadata.mimeType}
					/>
				)}

				{metadata?.colorSpace && (
					<InfoItem
						icon={<FileImage className="h-4 w-4 text-rose-400" />}
						label="Espacio de color"
						value={metadata.colorSpace}
					/>
				)}
			</div>

			{!hasResolution && !item.fileSize && !item.path && !metadata?.mimeType && (
				<div className="p-3 border border-dashed border-muted-foreground/30 rounded-md">
					<p className="text-xs text-muted-foreground text-center">
						No se encontró información básica para esta imagen.
					</p>
				</div>
			)}
		</div>
	);
}
