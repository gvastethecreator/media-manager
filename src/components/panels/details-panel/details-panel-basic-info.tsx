// import { updateMetadata } from '@/services/metadata/metadata.service';
import { Calendar, FileImage, Folder, HardDrive, ImageIcon } from 'lucide-react';
import { useCallback } from 'react';
import { formatBytes } from '@/lib/utils/format.utils';
import { InfoItem } from './details-panel-info-item';
import type { BasicInfoProps } from './details-panel-types';
import { EditableMetadata } from './editable-metadata';

/**
 * Componente que muestra información básica sobre la imagen
 */
export function BasicInfo({ item, metadata }: BasicInfoProps) {
	const hasResolution = metadata?.dimensions || ('width' in item && 'height' in item && item.width && item.height);
	const width = metadata?.dimensions?.width || ('width' in item ? item.width : undefined);
	const height = metadata?.dimensions?.height || ('height' in item ? item.height : undefined);

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

	// Función para actualizar metadatos
	const handleUpdateMetadata = useCallback(async (id: string, data: { title?: string; description?: string }) => {
		try {
			const response = await fetch(`/api/metadata/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Error al actualizar metadatos:', errorData);
				throw new Error(errorData.error || 'Fallo al actualizar metadatos');
			}

			return await response.json();
		} catch (error) {
			console.error('Error de conexión al actualizar metadatos:', error);
			throw error; // Re-lanzo para que el componente que llama pueda manejarlo
		}
	}, []);

	return (
		<div className="space-y-3">
			{/* Título y descripción editables */}
			<EditableMetadata item={item} onUpdate={handleUpdateMetadata} />

			{/* Información técnica */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
				{'path' in item && item.path && (
					<InfoItem icon={<Folder className="h-3 w-3 text-blue-400" />} label="Ubicación" value={item.path} />
				)}

				{hasResolution && (
					<InfoItem
						icon={<ImageIcon className="h-3 w-3 text-green-400" />}
						label="Resolución"
						value={`${width} x ${height}`}
					/>
				)}

				{'fileSize' in item && item.fileSize ? (
					<InfoItem
						icon={<HardDrive className="h-3 w-3 text-amber-400" />}
						label="Tamaño"
						value={formatBytes((item as any).fileSize)}
					/>
				) : null}

				{item.createdAt && (
					<InfoItem
						icon={<Calendar className="h-3 w-3 text-indigo-400" />}
						label="Fecha"
						value={formatDate(item.createdAt)}
					/>
				)}

				{metadata?.mimeType && (
					<InfoItem
						icon={<FileImage className="h-3 w-3 text-purple-400" />}
						label="Tipo"
						value={metadata.mimeType.split('/')[1]?.toUpperCase() || metadata.mimeType}
					/>
				)}

				{metadata?.colorSpace && (
					<InfoItem icon={<FileImage className="h-3 w-3 text-rose-400" />} label="Color" value={metadata.colorSpace} />
				)}
			</div>

			{!hasResolution &&
				!('fileSize' in item && item.fileSize) &&
				!('path' in item && item.path) &&
				!metadata?.mimeType && (
					<div className="p-2 border border-dashed border-muted-foreground/30 rounded-md">
						<p className="text-[10px] text-muted-foreground text-center">
							No se encontró información básica para esta imagen.
						</p>
					</div>
				)}
		</div>
	);
}
