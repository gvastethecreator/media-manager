import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { clientLogger } from '@/lib/logger/client-logger';
import { useVideoStore } from '@/store/entities/video';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('VideosView');

export default function VideosView(_props: ViewProps) {
	const videosRecord = useVideoStore((s) => s.videos);
	const isLoading = useVideoStore((s) => s.isLoading);
	const error = useVideoStore((s) => s.error);
	const fetchVideos = useVideoStore((s) => s.fetchVideos);

	const hasInitializedRef = useRef(false);

	const videos = useMemo(() => Object.values(videosRecord || {}), [videosRecord]);
	const videoCount = videos.length;
	const browserItems = useMemo(
		() => videos.map((v) => toBrowserItem(v as unknown as Record<string, unknown>)),
		[videos]
	);

	useEffect(() => {
		if (!hasInitializedRef.current && videoCount === 0 && !isLoading) {
			hasInitializedRef.current = true;
			viewLogger.info('Cargando videos...');
			fetchVideos();
		}
	}, [videoCount, isLoading, fetchVideos]);

	const { openViewer } = useFileViewerStore();

	const handleItemClick = useCallback((item: BrowserItem) => {
		viewLogger.info('Click en video', { id: item.id, name: item.name });
	}, []);

	const handleItemDoubleClick = useCallback(
		(item: BrowserItem) => {
			// Abrir el visor con todos los videos
			const mediaItems = videos.map((video) => ({
				id: video.id,
				name: video.name,
				type: 'video' as const,
				path: (video as any).path,
				size: (video as any).size || 0,
				width: (video as any).width,
				height: (video as any).height,
				thumbnail: (video as any).thumbnail || (video as any).thumbnailUrl || `/api/videos/${video.id}/thumbnail`,
				thumbnailUrl: (video as any).thumbnailUrl || `/api/videos/${video.id}/thumbnail`,
				metadata: (video as any).metadata,
			}));
			const idx = mediaItems.findIndex((v) => v.id === item.id);
			openViewer(mediaItems as any, Math.max(0, idx));
		},
		[videos, openViewer]
	);

	if (isLoading && videoCount === 0) {
		return <LoadingScreen message="Cargando videos..." />;
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-lg">Error al cargar videos</h2>
					<p className="mb-4 text-muted-foreground">Error: {error}</p>
					<button
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
						onClick={() => fetchVideos()}
						type="button"
					>
						Intentar de nuevo
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full">
			{/* Toolbar con controles superiores */}
			<div className="flex items-center justify-between gap-3 border-border border-b bg-background/40 px-3 py-2 backdrop-blur-sm">
				<div className="flex min-w-0 items-center gap-3">
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-foreground text-sm leading-tight">Videos</h2>
						<p className="truncate text-muted-foreground text-xs leading-tight">
							{videoCount} {videoCount === 1 ? 'video' : 'videos'}
						</p>
					</div>
				</div>
			</div>

			{/* FileBrowser para mostrar todos los videos */}
			<div className="min-h-0 flex-1 overflow-hidden">
				<FileBrowser
					className="h-full"
					items={browserItems}
					onItemClick={handleItemClick}
					onItemDoubleClick={handleItemDoubleClick}
				/>
			</div>
		</div>
	);
}
