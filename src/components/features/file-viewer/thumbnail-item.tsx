import { Box, File, FileJson, FileText, Image as ImageIcon, Music, Video } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import type { ImageItem } from './file-viewer.types';
import { isValidSrc, THUMBNAIL_SIZES } from './file-viewer.types';

/**
 * Detecta el tipo de archivo basado en mimeType, type, o extensión
 */
function detectFileType(item: ImageItem): 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d' | 'unknown' {
	const mimeType = item.mimeType?.toLowerCase() || '';
	const type = item.type?.toLowerCase() || '';
	const ext = item.name?.toLowerCase().split('.').pop() || '';

	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
	if (mimeType.includes('json')) return 'json';
	if (mimeType.includes('model') || mimeType.includes('gltf') || mimeType.includes('obj')) return 'file3d';

	if (type === 'image') return 'image';
	if (type === 'video') return 'video';
	if (type === 'audio') return 'audio';
	if (type === 'document') return 'document';
	if (type === 'json' || type === 'jsonfile') return 'json';
	if (type === 'file3d' || type === '3d') return 'file3d';

	const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'svg', 'ico'];
	const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg', '3gp'];
	const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'aiff'];
	const docExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'pages', 'epub', 'mobi'];
	const jsonExts = ['json'];
	const file3dExts = ['obj', 'fbx', 'gltf', 'glb', 'dae', '3ds', 'blend', 'stl', 'ply', 'x3d'];

	if (imageExts.includes(ext)) return 'image';
	if (videoExts.includes(ext)) return 'video';
	if (audioExts.includes(ext)) return 'audio';
	if (docExts.includes(ext)) return 'document';
	if (jsonExts.includes(ext)) return 'json';
	if (file3dExts.includes(ext)) return 'file3d';

	return 'unknown';
}

/**
 * Icono según tipo de archivo con colores consistentes
 */
function FileTypeIcon({ type, className }: { type: ReturnType<typeof detectFileType>; className?: string }) {
	const iconClass = cn('h-6 w-6', className);

	switch (type) {
		case 'image':
			return (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
					<ImageIcon className={cn(iconClass, 'text-white')} />
				</div>
			);
		case 'video':
			return (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-400 to-red-600">
					<Video className={cn(iconClass, 'text-white')} />
				</div>
			);
		case 'audio':
			return (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
					<Music className={cn(iconClass, 'text-white')} />
				</div>
			);
		case 'document':
			return (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-500 to-red-700">
					<FileText className={cn(iconClass, 'text-white')} />
				</div>
			);
		case 'json':
			return (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
					<FileJson className={cn(iconClass, 'text-white')} />
				</div>
			);
		case 'file3d':
			return (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600">
					<Box className={cn(iconClass, 'text-white')} />
				</div>
			);
		default:
			return (
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
					<File className={cn(iconClass, 'text-white')} />
				</div>
			);
	}
}

export const ThumbnailItem = memo(function ThumbnailItemImpl({
	image,
	isActive,
	onClick,
}: {
	image: ImageItem;
	isActive: boolean;
	onClick: () => void;
}) {
	const [error, setError] = useState(false);
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const fileType = useMemo(() => detectFileType(image), [image]);

	// Obtener la miniatura de forma optimizada
	useEffect(() => {
		let url = image.thumbnailUrl;

		if (!url && image.id) {
			if (fileType === 'video') {
				url = `/api/videos/${image.id}/thumbnail`;
			} else if (fileType === 'image') {
				url = `/api/images/${image.id}/thumbnail`;
			}
		}

		if (url && url !== thumbnail) {
			setThumbnail(url);
			setError(false);
		}
	}, [image.id, image.thumbnailUrl, fileType, thumbnail]);

	// Memoizar la clase base
	const baseClassName = useMemo(
		() =>
			cn(
				'relative mr-2 cursor-pointer overflow-hidden rounded-md',
				isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'
			),
		[isActive]
	);

	// Renderizado condicional memoizado
	const thumbnailContent = useMemo(() => {
		// Si hay error al cargar thumbnail o no hay thumbnail disponible, mostrar icono según tipo
		if (error || !thumbnail) {
			return <FileTypeIcon type={fileType} />;
		}

		// Para imágenes y videos, mostrar thumbnail
		return (
			<div className="h-full w-full">
				{isValidSrc(thumbnail) ? (
					<img
						alt={image.name}
						className="h-full w-full object-cover"
						loading="lazy"
						onError={() => setError(true)}
						src={thumbnail}
					/>
				) : (
					<FileTypeIcon type={fileType} />
				)}
			</div>
		);
	}, [error, thumbnail, image.name, fileType]);

	// Memoizar los estilos de animación
	const animateStyles = useMemo(
		() => ({
			scale: isActive ? 1.07 : 1,
			opacity: isActive ? 1 : 0.9,
		}),
		[isActive]
	);

	return (
		<motion.div
			animate={animateStyles}
			className={baseClassName}
			layout
			onClick={onClick}
			style={{ width: THUMBNAIL_SIZES.normal.width, height: THUMBNAIL_SIZES.normal.height }}
			transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.6 }}
			whileHover={{ opacity: 1, scale: 1.05 }}
			whileTap={{ scale: 0.98 }}
		>
			{thumbnailContent}
			{isActive && (
				<motion.div
					animate={{ opacity: 1 }}
					className="pointer-events-none absolute inset-0 bg-primary/10"
					initial={{ opacity: 0 }}
					layout
					transition={{ duration: 0.25 }}
				/>
			)}
		</motion.div>
	);
});
