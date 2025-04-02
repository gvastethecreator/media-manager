'use server';

/**
 * @file Exporta todas las acciones relacionadas con videos
 * @module app/actions/videos
 */

import * as StatsActions from './stats.actions';
import * as VideoActions from './video.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'

// Acciones de estadísticas
export const getVideoStats = StatsActions.getVideoStats;

// Acciones principales de video
export const getVideo = VideoActions.getVideo;
export const findVideos = VideoActions.findVideos;
export const createVideo = VideoActions.createVideo;
export const updateVideo = VideoActions.updateVideo;
export const deleteVideo = VideoActions.deleteVideo;
export const toggleVideoFavorite = VideoActions.toggleVideoFavorite;
export const setVideoVisibility = VideoActions.setVideoVisibility;
export const moveVideoToFolder = VideoActions.moveVideoToFolder;
