'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { getDefaultVideoVisualConfig } from '@/utils/video/helpers';
import type { VideoVisualConfig } from '@/types/entities/video/types';

const log = serverLogger.withContext('VideoVisualConfigActions');
const configs = new Map<string, VideoVisualConfig>();

export async function getVideoVisualConfig(videoId: string): Promise<VideoVisualConfig> {
    if (!configs.has(videoId)) {
        log.info('🆕 Generando configuración visual predeterminada', { videoId });
        const defaults: VideoVisualConfig = { id: videoId, videoId, ...getDefaultVideoVisualConfig() };
        configs.set(videoId, defaults);
    }

    const config = configs.get(videoId);
    if (!config) {
        throw new Error('Could not retrieve video visual config');
    }

    return config;
}

export async function updateVideoVisualConfig(
    videoId: string,
    data: Partial<VideoVisualConfig>
): Promise<VideoVisualConfig> {
    const current = await getVideoVisualConfig(videoId);
    const updated = { ...current, ...data, id: videoId, videoId };
    configs.set(videoId, updated);
    log.info('✅ Configuración visual actualizada', { videoId });
    return updated;
}
