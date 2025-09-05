import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAudioStore } from '@/store/entities/audio';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('AudioView');

export default function AudioView(_props: ViewProps) {
    const audiosArray = useAudioStore((s) => s.audios);
    const isLoading = useAudioStore((s) => s.isLoading);
    const error = useAudioStore((s) => s.error);
    const fetchAudios = useAudioStore((s) => s.fetchAudios);

    const hasInitializedRef = useRef(false);

    const audios = useMemo(() => audiosArray || [], [audiosArray]);
    const audioCount = audios.length;

    useEffect(() => {
        if (!hasInitializedRef.current && audioCount === 0 && !isLoading) {
            hasInitializedRef.current = true;
            viewLogger.info('Cargando audios...');
            fetchAudios();
        }
    }, [audioCount, isLoading, fetchAudios]);

    const { openViewer } = useFileViewerStore();

    const handleItemClick = useCallback((item: AnyEntityWithStats) => {
        viewLogger.info('Click en audio', { id: item.id, name: item.name });
    }, []);

    const handleItemDoubleClick = useCallback(
        (item: AnyEntityWithStats) => {
            // Abrir el visor con todos los audios
            const mediaItems = audios.map((audio) => ({
                id: audio.id,
                name: audio.name,
                type: 'audio' as const,
                path: (audio as any).path,
                size: (audio as any).size || 0,
                duration: (audio as any).duration,
                thumbnail: (audio as any).thumbnail || `/api/audio/${audio.id}/waveform`,
                metadata: (audio as any).metadata,
            }));
            const idx = mediaItems.findIndex((a) => a.id === item.id);
            openViewer(mediaItems as any, Math.max(0, idx));
        },
        [audios, openViewer]
    );

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <h2 className="mb-2 font-semibold text-lg">Error al cargar audios</h2>
                    <p className="mb-4 text-muted-foreground">Error: {error}</p>
                    <button
                        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                        onClick={() => fetchAudios()}
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
                        <h2 className="truncate font-semibold text-foreground text-sm leading-tight">Audio</h2>
                        <p className="truncate text-muted-foreground text-xs leading-tight">
                            {audioCount} {audioCount === 1 ? 'archivo' : 'archivos'} de audio
                        </p>
                    </div>
                </div>
            </div>

            {/* FileBrowser para mostrar todos los audios */}
            <div className="min-h-0 flex-1 overflow-hidden">
                <FileBrowser
                    className="h-full"
                    isLoading={isLoading}
                    items={audios as unknown as AnyEntityWithStats[]}
                    onItemClick={handleItemClick}
                    onItemDoubleClick={handleItemDoubleClick}
                />
            </div>
        </div>
    );
}
