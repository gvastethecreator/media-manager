/**
 * @file Slice para el reproductor de video del store
 * @module store/entities/video/slices/player
 */

import type { StateCreator } from 'zustand';
import { VideoPlayState } from '@/types/entities/video/enums';
import type { VideoStore } from '..';

export interface VideoPlayerState {
	bufferedPercentage: number;
	currentTime: number;
	duration: number;
	isFullscreen: boolean;
	isMuted: boolean;
	playbackRate: number;
	playState: VideoPlayState;
	quality: string;
	volume: number;
}

export const initialPlayerState: VideoPlayerState = {
	isFullscreen: false,
	volume: 1,
	playbackRate: 1,
	isMuted: false,
	playState: VideoPlayState.STOPPED,
	currentTime: 0,
	duration: 0,
	bufferedPercentage: 0,
	quality: 'auto',
};

// Slice para el reproductor de video
export interface VideoPlayerSlice extends VideoPlayerState {
	// Control de pantalla completa
	enterFullscreen: () => void;
	exitFullscreen: () => void;
	getAvailableQualities: () => string[];
	getBufferedPercentage: () => number;

	// Información de reproducción
	getCurrentTime: () => number;
	getDuration: () => number;
	getIsFullscreen: () => boolean;
	getIsMuted: () => boolean;
	getPlayState: () => VideoPlayState;
	getVolume: () => number;
	mute: () => void;
	onDurationChange: (duration: number) => void;
	onProgress: (bufferedPercentage: number) => void;
	onStateChange: (playState: VideoPlayState) => void;

	// Eventos de reproducción
	onTimeUpdate: (currentTime: number) => void;
	pause: () => void;
	// Control de reproducción
	play: () => void;
	seek: (time: number) => void;
	setPlaybackRate: (rate: number) => void;

	// Control de calidad
	setQuality: (quality: string) => void;

	// Control de volumen
	setVolume: (volume: number) => void;
	stop: () => void;
	toggleFullscreen: () => void;
	toggleMute: () => void;
	unmute: () => void;
}

export const createVideoPlayerSlice: StateCreator<VideoStore, [], [], VideoPlayerSlice> = (set, get) => ({
	...initialPlayerState,
	// Control de reproducción
	play: () => set({ playState: VideoPlayState.PLAYING }),
	pause: () => set({ playState: VideoPlayState.PAUSED }),
	stop: () => set({ playState: VideoPlayState.STOPPED, currentTime: 0 }),
	seek: (time) => set({ currentTime: time }),
	setPlaybackRate: (rate) => set({ playbackRate: rate }),

	// Control de volumen
	setVolume: (volume) => {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		set({ volume: clampedVolume, isMuted: clampedVolume === 0 });
	},
	mute: () => set({ isMuted: true }),
	unmute: () => set({ isMuted: false }),
	toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

	// Control de pantalla completa
	enterFullscreen: () => set({ isFullscreen: true }),
	exitFullscreen: () => set({ isFullscreen: false }),
	toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

	// Control de calidad
	setQuality: (quality) => set({ quality }),
	getAvailableQualities: () => {
		return ['auto', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
	},

	// Información de reproducción
	getCurrentTime: () => get().currentTime,
	getDuration: () => get().duration,
	getBufferedPercentage: () => get().bufferedPercentage,
	getPlayState: () => get().playState,
	getVolume: () => get().volume,
	getIsFullscreen: () => get().isFullscreen,
	getIsMuted: () => get().isMuted,

	// Eventos de reproducción
	onTimeUpdate: (currentTime) => set({ currentTime }),
	onDurationChange: (duration) => set({ duration }),
	onProgress: (bufferedPercentage) => set({ bufferedPercentage }),
	onStateChange: (playState) => set({ playState }),
});
