const fs = require('fs');

const content = `/**
 * FILE CONTENT RENDERER
 *
 * Renderiza contenido de archivo segun su tipo (imagen, video, audio, documento, JSON, 3D)
 */

import { AlertCircle, Box, File, FileJson, FileText, Image, Info, Loader2, Music, Video } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ImageItem } from './file-viewer.types';
import { FileInfoPanel } from './file-info-panel';
import { EnhancedAudioViewer } from './viewers/enhanced-audio-viewer';
import { JsonFlowViewer } from './viewers/json-flow-viewer';
import { MarkdownViewer } from './viewers/markdown-viewer';
import { ThreeDViewer } from './viewers/three-d-viewer';

export interface FileContentRendererProps {
	item: ImageItem;
	contentUrl: string;
	isLoading?: boolean;
	onError?: () => void;
	onLoad?: () => void;
	transformStyle?: React.CSSProperties;
	className?: string;
}

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

function FileTypeIcon({ type, className }: { type: ReturnType<typeof detectFileType>; className?: string }) {
	const iconClass = cn('h-16 w-16', className);

	switch (type) {
		case 'image':
			return <Image className={iconClass} />;
		case 'video':
			return <Video className={iconClass} />;
		case 'audio':
			return <Music className={iconClass} />;
		case 'document':
			return <FileText className={iconClass} />;
		case 'json':
			return <FileJson className={iconClass} />;
		case 'file3d':
			return <Box className={iconClass} />;
		default:
			return <File className={iconClass} />;
	}
}

function ImageRendererBase({ item, contentUrl, onError, onLoad, transformStyle, className }: FileContentRendererProps) {
	return (
		<div
			className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)}
			style={transformStyle}
		>
			<img
				alt={item.name || 'sin nombre'}
				className="pointer-events-none max-h-full max-w-full object-contain"
				onError={onError}
				onLoad={onLoad}
				src={contentUrl}
			/>
		</div>
	);
}

function VideoRendererBase({ item, contentUrl, onError, onLoad, transformStyle, className }: FileContentRendererProps) {
	return (
		<div
			className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)}
			style={transformStyle}
		>
			<video
				autoPlay
				className="pointer-events-auto max-h-full max-w-full object-contain"
				controls
				loop
				onError={onError}
				onLoadedData={onLoad}
				src={contentUrl}
			>
				<track kind="captions" />
			</video>
		</div>
	);
}

function AudioRendererBase({ item, contentUrl, className }: FileContentRendererProps) {
	return (
		<div className={cn('absolute inset-0', className)} data-no-drag>
			<EnhancedAudioViewer audioUrl={contentUrl} fileName={item.name} />
		</div>
	);
}
`;

fs.writeFileSync('src/components/features/file-viewer/file-content-renderer.tsx', content);
console.log('Part 1 written');
