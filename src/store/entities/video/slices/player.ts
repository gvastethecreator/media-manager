/**
 * @file Slice para el reproductor de video del store
 * @module store/entities/video/slices/player
 */

import type { StateCreator } from 'zustand';
import type { VideoStore } from '..';
import { VideoPlayState } from '../../../../types/entities/video/enums';

export interface VideoPlayerState {
	isFullscreen: boolean;
	volume: number;
	playbackRate: number;
	isMuted: boolean;
	playState: VideoPlayState;
	currentTime: number;
	duration: number;
	bufferedPercentage: number;
	quality: string;
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
	// Control de reproducción
	play: () => void;
	pause: () => void;
	stop: () => void;
	seek: (time: number) => void;
	setPlaybackRate: (rate: number) => void;

	// Control de volumen
	setVolume: (volume: number) => void;
	mute: () => void;
	unmute: () => void;
	toggleMute: () => void;

	// Control de pantalla completa
	enterFullscreen: () => void;
	exitFullscreen: () => void;
	toggleFullscreen: () => void;

	// Control de calidad
	setQuality: (quality: string) => void;
	getAvailableQualities: () => string[];

	// Información de reproducción
	getCurrentTime: () => number;
	getDuration: () => number;
	getBufferedPercentage: () => number;
	getPlayState: () => VideoPlayState;
	getVolume: () => number;
	isFullscreen: () => boolean;
	isMuted: () => boolean;

	// Eventos de reproducción
	onTimeUpdate: (currentTime: number) => void;
	onDurationChange: (duration: number) => void;
	onProgress: (bufferedPercentage: number) => void;
	onStateChange: (playState: VideoPlayState) => void;
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
	isFullscreen: () => get().isFullscreen,
	isMuted: () => get().isMuted,

	// Eventos de reproducción
	onTimeUpdate: (currentTime) => set({ currentTime }),
	onDurationChange: (duration) => set({ duration }),
	onProgress: (bufferedPercentage) => set({ bufferedPercentage }),
	onStateChange: (playState) => set({ playState }),
});
