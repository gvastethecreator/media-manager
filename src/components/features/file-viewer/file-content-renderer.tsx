/**
 * FILE CONTENT RENDERER
 *
 * Renderiza contenido de archivo segun su tipo (imagen, video, audio, documento, JSON, 3D)
 */

import { AlertCircle, Box, File, FileJson, FileText, Image, Info, Loader2, Music, Video } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { FileInfoPanel } from './file-info-panel';
import type { ImageItem } from './file-viewer.types';
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
			className={cn('pointer-events-none relative flex h-full w-full items-center justify-center', className)}
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
			className={cn('pointer-events-none relative flex h-full w-full items-center justify-center', className)}
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
		<div className={cn('relative h-full w-full', className)} data-no-drag>
			<EnhancedAudioViewer audioUrl={contentUrl} fileName={item.name} />
		</div>
	);
}

function DocumentRenderer({ item, contentUrl, onError, onLoad, className }: FileContentRendererProps) {
	const [textContent, setTextContent] = useState<string | null>(null);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [showInfo, setShowInfo] = useState(false);
	const ext = item.name?.toLowerCase().split('.').pop() || '';
	const isMarkdown = ext === 'md';
	const isText = ext === 'txt' || ext === 'rtf';
	const isPdf = ext === 'pdf';

	useEffect(() => {
		if ((isMarkdown || isText) && contentUrl) {
			fetch(contentUrl)
				.then((res) => res.text())
				.then((text) => {
					setTextContent(text);
					onLoad?.();
				})
				.catch(() => onError?.());
		} else if (isPdf) {
			setPdfUrl(contentUrl);
			onLoad?.();
		}
	}, [contentUrl, isMarkdown, isText, isPdf, onError, onLoad]);

	if (isPdf && pdfUrl) {
		return (
			<div className={cn('relative flex h-full w-full items-center justify-center p-4', className)}>
				<iframe className="h-full w-full rounded-lg bg-background shadow-dt-3" src={pdfUrl} title={item.name} />
				<Button
					className="absolute top-4 right-4 z-50"
					onClick={() => setShowInfo(!showInfo)}
					size="icon"
					variant="secondary"
				>
					<Info className="h-4 w-4" />
				</Button>
				{showInfo && <FileInfoPanel item={item} />}
			</div>
		);
	}

	if (isMarkdown && textContent) {
		return (
			<div className={cn('relative flex h-full w-full items-center justify-center p-4', className)} data-no-drag>
				<MarkdownViewer className="h-full w-full max-w-4xl" content={textContent} />
				<Button
					className="absolute top-4 right-4 z-50"
					onClick={() => setShowInfo(!showInfo)}
					size="icon"
					variant="secondary"
				>
					<Info className="h-4 w-4" />
				</Button>
				{showInfo && <FileInfoPanel item={item} />}
			</div>
		);
	}

	if (isText && textContent) {
		return (
			<div className={cn('relative flex h-full w-full items-center justify-center p-4', className)} data-no-drag>
				<div className="h-full w-full max-w-4xl overflow-auto rounded-lg border border-border/50 bg-background/80 p-6 shadow-dt-3 backdrop-blur-sm">
					<pre className="whitespace-pre-wrap font-mono text-foreground text-sm leading-relaxed">{textContent}</pre>
				</div>
				<Button
					className="absolute top-4 right-4 z-50"
					onClick={() => setShowInfo(!showInfo)}
					size="icon"
					variant="secondary"
				>
					<Info className="h-4 w-4" />
				</Button>
				{showInfo && <FileInfoPanel item={item} />}
			</div>
		);
	}

	return (
		<div className={cn('relative flex h-full w-full flex-col items-center justify-center gap-6', className)}>
			<div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 to-red-600 shadow-dt-3">
				<FileText className="h-16 w-16 text-primary-foreground" />
			</div>
			<div className="text-center">
				<h3 className="font-semibold text-foreground text-xl">{item.name}</h3>
				<p className="mt-1 text-muted-foreground text-sm">
					{item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : 'Documento'}
				</p>
			</div>
			<a
				className="mt-4 rounded-lg bg-background/10 px-6 py-2 text-white transition-colors hover:bg-background/20"
				download={item.name}
				href={contentUrl}
			>
				Descargar archivo
			</a>
			<Button
				className="absolute top-4 right-4 z-50"
				onClick={() => setShowInfo(!showInfo)}
				size="icon"
				variant="secondary"
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={item} />}
		</div>
	);
}

function JsonRendererBase({ item, contentUrl, onError, onLoad, className }: FileContentRendererProps) {
	const [jsonContent, setJsonContent] = useState<string | null>(null);

	useEffect(() => {
		if (contentUrl) {
			fetch(contentUrl)
				.then((res) => res.text())
				.then((text) => {
					setJsonContent(text);
					onLoad?.();
				})
				.catch(() => onError?.());
		}
	}, [contentUrl, onError, onLoad]);

	if (!jsonContent) {
		return (
			<div className={cn('relative flex h-full w-full items-center justify-center', className)}>
				<Loader2 className="h-8 w-8 animate-spin text-white/50" />
			</div>
		);
	}

	return (
		<div className={cn('relative flex h-full w-full items-center justify-center p-4', className)} data-no-drag>
			<JsonFlowViewer className="h-full w-full max-w-6xl" content={jsonContent} fileName={item.name} />
		</div>
	);
}

function File3DRendererBase({ item, contentUrl, className }: FileContentRendererProps) {
	return (
		<div className={cn('relative h-full w-full', className)} data-no-drag>
			<ThreeDViewer fileName={item.name} src={contentUrl} />
		</div>
	);
}

function UnknownRenderer({ item, contentUrl, className }: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className={cn('relative flex h-full w-full flex-col items-center justify-center gap-6', className)}>
			<div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-400 to-zinc-600 shadow-2xl">
				<AlertCircle className="h-16 w-16 text-white" />
			</div>
			<div className="text-center">
				<h3 className="font-semibold text-white text-xl">{item.name}</h3>
				<p className="mt-1 text-sm text-white/60">Tipo de archivo no soportado para vista previa</p>
			</div>
			<a
				className="mt-4 rounded-lg bg-background/10 px-6 py-2 text-white transition-colors hover:bg-background/20"
				download={item.name}
				href={contentUrl}
			>
				Descargar archivo
			</a>
			<Button
				className="absolute top-4 right-4 z-50"
				onClick={() => setShowInfo(!showInfo)}
				size="icon"
				variant="secondary"
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={item} />}
		</div>
	);
}

function ImageRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className="relative h-full w-full">
			<ImageRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				onClick={() => setShowInfo(!showInfo)}
				size="icon"
				variant="secondary"
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</div>
	);
}

function VideoRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className="relative h-full w-full">
			<VideoRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				onClick={() => setShowInfo(!showInfo)}
				size="icon"
				variant="secondary"
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</div>
	);
}

function AudioRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className="relative h-full w-full">
			<AudioRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				onClick={() => setShowInfo(!showInfo)}
				size="icon"
				variant="secondary"
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</div>
	);
}

function JsonRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className="relative h-full w-full">
			<JsonRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				onClick={() => setShowInfo(!showInfo)}
				size="icon"
				variant="secondary"
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</div>
	);
}

function File3DRenderer(props: FileContentRendererProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className="relative h-full w-full">
			<File3DRendererBase {...props} />
			<Button
				className="absolute top-4 right-4 z-50"
				onClick={() => setShowInfo(!showInfo)}
				size="icon"
				variant="secondary"
			>
				<Info className="h-4 w-4" />
			</Button>
			{showInfo && <FileInfoPanel item={props.item} />}
		</div>
	);
}

function FileContentRendererInner(props: FileContentRendererProps) {
	const { item, isLoading } = props;
	const fileType = detectFileType(item);

	if (isLoading) {
		return (
			<div className="relative flex h-full w-full items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<FileTypeIcon className="animate-pulse text-white/30" type={fileType} />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
		);
	}

	switch (fileType) {
		case 'image':
			return <ImageRenderer {...props} />;
		case 'video':
			return <VideoRenderer {...props} />;
		case 'audio':
			return <AudioRenderer {...props} />;
		case 'document':
			return <DocumentRenderer {...props} />;
		case 'json':
			return <JsonRenderer {...props} />;
		case 'file3d':
			return <File3DRenderer {...props} />;
		default:
			return <UnknownRenderer {...props} />;
	}
}

export const FileContentRenderer = memo(FileContentRendererInner);
export { detectFileType };
