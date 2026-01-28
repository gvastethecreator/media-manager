/**
 * 🎬 FILE CONTENT RENDERER
 *
 * Renderiza contenido de archivo según su tipo (imagen, video, audio, documento, JSON, 3D)
 */

import { AlertCircle, Box, File, FileJson, FileText, Image, Loader2, Music, Video } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ImageItem } from './file-viewer.types';

export interface FileContentRendererProps {
	/** Item a renderizar */
	item: ImageItem;
	/** URL del contenido */
	contentUrl: string;
	/** Si está cargando */
	isLoading?: boolean;
	/** Callback de error */
	onError?: () => void;
	/** Callback de carga exitosa */
	onLoad?: () => void;
	/** Estilos de transformación (zoom/pan) */
	transformStyle?: React.CSSProperties;
	/** Clase adicional */
	className?: string;
}

/**
 * Detecta el tipo de archivo basado en mimeType, type, o extensión
 */
function detectFileType(item: ImageItem): 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d' | 'unknown' {
	const mimeType = item.mimeType?.toLowerCase() || '';
	const type = item.type?.toLowerCase() || '';
	const ext = item.name?.toLowerCase().split('.').pop() || '';

	// Por mimeType
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
	if (mimeType.includes('json')) return 'json';
	if (mimeType.includes('model') || mimeType.includes('gltf') || mimeType.includes('obj')) return 'file3d';

	// Por type del item
	if (type === 'image') return 'image';
	if (type === 'video') return 'video';
	if (type === 'audio') return 'audio';
	if (type === 'document') return 'document';
	if (type === 'json' || type === 'jsonfile') return 'json';
	if (type === 'file3d' || type === '3d') return 'file3d';

	// Por extensión
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
 * Icono según tipo de archivo
 */
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

/**
 * Renderizador de imágenes
 */
function ImageRenderer({ item, contentUrl, onError, onLoad, transformStyle, className }: FileContentRendererProps) {
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

/**
 * Renderizador de videos
 */
function VideoRenderer({ item, contentUrl, onError, onLoad, transformStyle, className }: FileContentRendererProps) {
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

/**
 * Renderizador de audio con visualización
 */
function AudioRenderer({ item, contentUrl, onError, onLoad, className }: FileContentRendererProps) {
	return (
		<div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-8 p-8', className)}>
			{/* Icono grande */}
			<div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl">
				<Music className="h-24 w-24 text-white" />
			</div>

			{/* Nombre del archivo */}
			<div className="max-w-lg text-center">
				<h3 className="truncate font-semibold text-white text-xl">{item.name}</h3>
				<p className="mt-1 text-sm text-white/60">
					{item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : 'Audio'}
				</p>
			</div>

			{/* Reproductor de audio */}
			<audio autoPlay className="w-full max-w-md" controls onError={onError} onLoadedData={onLoad} src={contentUrl}>
				Tu navegador no soporta el elemento de audio.
			</audio>
		</div>
	);
}

/**
 * Renderizador de documentos (PDF, TXT, MD)
 */
function DocumentRenderer({ item, contentUrl, onError, onLoad, className }: FileContentRendererProps) {
	const [textContent, setTextContent] = useState<string | null>(null);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const ext = item.name?.toLowerCase().split('.').pop() || '';
	const isTextBased = ['txt', 'md', 'rtf'].includes(ext);
	const isPdf = ext === 'pdf';

	useEffect(() => {
		if (isTextBased && contentUrl) {
			// Cargar contenido de texto
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
	}, [contentUrl, isTextBased, isPdf, onError, onLoad]);

	// PDF: usar iframe
	if (isPdf && pdfUrl) {
		return (
			<div className={cn('absolute inset-0 flex items-center justify-center p-4', className)}>
				<iframe className="h-full w-full rounded-lg bg-background shadow-2xl" src={pdfUrl} title={item.name} />
			</div>
		);
	}

	// Texto: mostrar en pre
	if (isTextBased && textContent) {
		return (
			<div className={cn('absolute inset-0 flex items-center justify-center p-4', className)}>
				<div className="h-full w-full max-w-4xl overflow-auto rounded-lg bg-zinc-900 p-6 shadow-2xl">
					<pre className="whitespace-pre-wrap font-mono text-sm text-white leading-relaxed">{textContent}</pre>
				</div>
			</div>
		);
	}

	// Otros documentos: mostrar placeholder con enlace de descarga
	return (
		<div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-6', className)}>
			<div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 to-red-600 shadow-2xl">
				<FileText className="h-16 w-16 text-white" />
			</div>
			<div className="text-center">
				<h3 className="font-semibold text-white text-xl">{item.name}</h3>
				<p className="mt-1 text-sm text-white/60">
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
		</div>
	);
}

/**
 * Renderizador de JSON con syntax highlighting básico
 */
function JsonRenderer({ item, contentUrl, onError, onLoad, className }: FileContentRendererProps) {
	const [jsonContent, setJsonContent] = useState<string | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);

	useEffect(() => {
		if (contentUrl) {
			fetch(contentUrl)
				.then((res) => res.text())
				.then((text) => {
					try {
						// Parsear y re-formatear para pretty print
						const parsed = JSON.parse(text);
						setJsonContent(JSON.stringify(parsed, null, 2));
						onLoad?.();
					} catch {
						setJsonContent(text);
						setParseError('No es un JSON válido');
						onLoad?.();
					}
				})
				.catch(() => onError?.());
		}
	}, [contentUrl, onError, onLoad]);

	if (!jsonContent) {
		return (
			<div className={cn('absolute inset-0 flex items-center justify-center', className)}>
				<Loader2 className="h-8 w-8 animate-spin text-white/50" />
			</div>
		);
	}

	return (
		<div className={cn('absolute inset-0 flex items-center justify-center p-4', className)}>
			<div className="h-full w-full max-w-4xl overflow-auto rounded-lg bg-zinc-900 shadow-2xl">
				{parseError && (
					<div className="sticky top-0 bg-warning/20 px-4 py-2 text-sm text-yellow-300">⚠️ {parseError}</div>
				)}
				<pre className="p-6 font-mono text-sm leading-relaxed">
					<code className="text-green-400">{jsonContent}</code>
				</pre>
			</div>
		</div>
	);
}

/**
 * Renderizador de modelos 3D (placeholder con información)
 */
function File3DRenderer({ item, contentUrl, className }: FileContentRendererProps) {
	const ext = item.name?.toLowerCase().split('.').pop() || '';

	return (
		<div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-6', className)}>
			<div className="flex h-32 w-32 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-2xl">
				<Box className="h-16 w-16 text-white" />
			</div>
			<div className="text-center">
				<h3 className="font-semibold text-white text-xl">{item.name}</h3>
				<p className="mt-1 text-sm text-white/60">Modelo 3D ({ext.toUpperCase()})</p>
				{item.size && <p className="mt-0.5 text-white/40 text-xs">{(item.size / 1024 / 1024).toFixed(2)} MB</p>}
			</div>
			<a
				className="mt-4 rounded-lg bg-background/10 px-6 py-2 text-white transition-colors hover:bg-background/20"
				download={item.name}
				href={contentUrl}
			>
				Descargar modelo
			</a>
			<p className="max-w-sm text-center text-white/40 text-xs">
				Vista previa 3D próximamente. Por ahora puedes descargar el archivo para verlo en tu aplicación preferida.
			</p>
		</div>
	);
}

/**
 * Renderizador para tipos desconocidos
 */
function UnknownRenderer({ item, contentUrl, className }: FileContentRendererProps) {
	return (
		<div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-6', className)}>
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
		</div>
	);
}

/**
 * Componente principal que renderiza el contenido según el tipo
 */
function FileContentRendererInner(props: FileContentRendererProps) {
	const { item, isLoading } = props;
	const fileType = detectFileType(item);

	if (isLoading) {
		return (
			<div className="absolute inset-0 flex items-center justify-center">
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

// Re-export del detector para uso externo
export { detectFileType };
