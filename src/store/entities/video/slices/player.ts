/**
 * @file Slice para el reproductor de video del store
 * @module store/entities/video/slices/player
 */

import type { StateCreator } from 'zustand';
import { VideoPlayState } from '../../../../types/entities/video/enums';
import type { VideoState } from '../types';

// Slice para el reproductor de video
export interface VideoPlayerSlice {
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

export const createVideoPlayerSlice: StateCreator<VideoState, [], [], VideoPlayerSlice> = (set, get) => ({
	// Control de reproducción
	play: () => {
		set((state) => ({
			player: {
				...state.player,
				playState: VideoPlayState.PLAYING,
			},
		}));
	},

	pause: () => {
		set((state) => ({
			player: {
				...state.player,
				playState: VideoPlayState.PAUSED,
			},
		}));
	},

	stop: () => {
		set((state) => ({
			player: {
				...state.player,
				playState: VideoPlayState.STOPPED,
				currentTime: 0,
			},
		}));
	},

	seek: (time) => {
		set((state) => ({
			player: {
				...state.player,
				currentTime: time,
			},
		}));
	},

	setPlaybackRate: (rate) => {
		const playState = get().player.playState;
		if (playState === VideoPlayState.PLAYING) {
			// Lógica para cambiar la velocidad de reproducción
		}
		set((state) => ({
			player: {
				...state.player,
				playbackRate: rate,
			},
		}));
	},

	// Control de volumen
	setVolume: (volume) => {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		set((state) => ({
			player: {
				...state.player,
				volume: clampedVolume,
				isMuted: clampedVolume === 0,
			},
		}));
	},

	mute: () => {
		set((state) => ({
			player: {
				...state.player,
				isMuted: true,
			},
		}));
	},

	unmute: () => {
		set((state) => ({
			player: {
				...state.player,
				isMuted: false,
			},
		}));
	},

	toggleMute: () => {
		set((state) => ({
			player: {
				...state.player,
				isMuted: !state.player.isMuted,
			},
		}));
	},

	// Control de pantalla completa
	enterFullscreen: () => {
		set((state) => ({
			player: {
				...state.player,
				isFullscreen: true,
			},
		}));
	},

	exitFullscreen: () => {
		set((state) => ({
			player: {
				...state.player,
				isFullscreen: false,
			},
		}));
	},

	toggleFullscreen: () => {
		set((state) => ({
			player: {
				...state.player,
				isFullscreen: !state.player.isFullscreen,
			},
		}));
	},

	// Control de calidad
	setQuality: (quality) => {
		set((state) => ({
			player: {
				...state.player,
				quality,
			},
		}));
	},

	getAvailableQualities: () => {
		return ['auto', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
	},

	// Información de reproducción
	getCurrentTime: () => get().player.currentTime,
	getDuration: () => get().player.duration,
	getBufferedPercentage: () => get().player.bufferedPercentage,
	getPlayState: () => get().player.playState,
	getVolume: () => get().player.volume,
	isFullscreen: () => get().player.isFullscreen,
	isMuted: () => get().player.isMuted,

	// Eventos de reproducción
	onTimeUpdate: (currentTime) => {
		set((state) => ({
			player: {
				...state.player,
				currentTime,
			},
		}));
	},

	onDurationChange: (duration) => {
		set((state) => ({
			player: {
				...state.player,
				duration,
			},
		}));
	},

	onProgress: (bufferedPercentage) => {
		set((state) => ({
			player: {
				...state.player,
				bufferedPercentage,
			},
		}));
	},

	onStateChange: (playState) => {
		set((state) => ({
			player: {
				...state.player,
				playState,
			},
		}));
	},
});
