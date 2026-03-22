import { FileAudio, FileBox, FileCode, FileImage, FileText, FileVideo, Folder } from 'lucide-react';
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ImageItem } from './file-viewer.types';

interface FileInfoPanelProps {
	className?: string;
	item: ImageItem;
}

/**
 * Formatear tamaño de archivo
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Panel de información de archivo
 * Muestra metadata según el tipo de archivo
 */
export const FileInfoPanel = memo(function FileInfoPanel({ item, className }: FileInfoPanelProps) {
	const ext = item.name?.split('.').pop()?.toLowerCase() || '';
	const mimeType = item.mimeType || 'Unknown';

	// Determinar icono según tipo
	const getIcon = () => {
		if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5 text-dt-primary-400" />;
		if (mimeType.startsWith('video/')) return <FileVideo className="h-5 w-5 text-dt-danger-400" />;
		if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-dt-warning-400" />;
		if (ext === 'json') return <FileCode className="h-5 w-5 text-dt-success-400" />;
		if (['obj', 'fbx', 'gltf', 'glb'].includes(ext)) return <FileBox className="h-5 w-5 text-dt-primary-500" />;
		if (ext === 'pdf') return <FileText className="h-5 w-5 text-dt-danger-500" />;
		return <Folder className="h-5 w-5 text-dt-neutral-400" />;
	};

	return (
		<Card className={cn('absolute top-20 right-4 z-50 w-64 bg-background/95 p-4 backdrop-blur', className)}>
			<div className="mb-3 flex items-center gap-3">
				{getIcon()}
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-semibold text-sm">{item.name}</h4>
					<p className="text-muted-foreground text-xs uppercase">{ext || 'FILE'}</p>
				</div>
			</div>

			<div className="space-y-2 border-t pt-3 text-sm">
				{/* Tamaño */}
				<div className="flex justify-between">
					<span className="text-muted-foreground">Tamaño:</span>
					<span className="font-medium">{formatFileSize(item.size || 0)}</span>
				</div>

				{/* MIME Type */}
				<div className="flex justify-between">
					<span className="text-muted-foreground">Tipo:</span>
					<span className="max-w-[120px] truncate font-medium" title={mimeType}>
						{mimeType.split('/')[1] || mimeType}
					</span>
				</div>

				{/* Dimensiones (para imágenes y videos) */}
				{(item.width || item.parsedMetadata?.dimensions?.width) && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">Dimensiones:</span>
						<span className="font-medium">
							{item.width || item.parsedMetadata?.dimensions?.width} ×{' '}
							{item.height || item.parsedMetadata?.dimensions?.height} px
						</span>
					</div>
				)}

				{/* Metadata adicional si existe */}
				{item.metadata && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">Info:</span>
						<span className="max-w-[120px] truncate font-medium" title={item.metadata}>
							{item.metadata}
						</span>
					</div>
				)}
			</div>
		</Card>
	);
});

export default FileInfoPanel;
