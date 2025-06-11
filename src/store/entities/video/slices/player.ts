/**
 * @file Slice para el reproductor de video
 * @module store/entities/video/slices/player
 */

import type { StateCreator } from 'zustand';
import type { VideoPlayState } from '../../../../types/entities/video';
import type { VideoState } from '../types';

// Slice para el reproductor de video
export interface VideoPlayerSlice {
	// Control de reproducción
	play: () => void;
	pause: () => void;
	stop: () => void;
	togglePlayPause: () => void;
	seekTo: (time: number) => void;
	setCurrentTime: (time: number) => void;
	setDuration: (duration: number) => void;
	setBufferedPercentage: (percentage: number) => void;

	// Control de volumen
	setVolume: (volume: number) => void;
	mute: () => void;
	unmute: () => void;
	toggleMute: () => void;

	// Control de velocidad
	setPlaybackRate: (rate: number) => void;

	// Control de pantalla completa
	enterFullscreen: () => void;
	exitFullscreen: () => void;
	toggleFullscreen: () => void;

	// Control de calidad
	setQuality: (quality: string) => void;

	// Estado global
        setPlayState: (state: VideoPlayState) => void;
        getPlayState: () => VideoPlayState;

	// Utilidades
	getProgressPercentage: () => number;
	getRemainingTime: () => number;
	formatTime: (seconds: number) => string;
}

// Creador del slice
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

	togglePlayPause: () => {
		const { playState } = get().player;
		if (playState === VideoPlayState.PLAYING) {
			get().pause();
		} else {
			get().play();
		}
	},

	seekTo: (time: number) => {
		const { duration } = get().player;
		const clampedTime = Math.max(0, Math.min(time, duration));
		set((state) => ({
			player: {
				...state.player,
				currentTime: clampedTime,
			},
		}));
	},

	setCurrentTime: (time: number) => {
		set((state) => ({
			player: {
				...state.player,
				currentTime: time,
			},
		}));
	},

	setDuration: (duration: number) => {
		set((state) => ({
			player: {
				...state.player,
				duration,
			},
		}));
	},

	setBufferedPercentage: (percentage: number) => {
		const clampedPercentage = Math.max(0, Math.min(percentage, 100));
		set((state) => ({
			player: {
				...state.player,
				bufferedPercentage: clampedPercentage,
			},
		}));
	},

	// Control de volumen
	setVolume: (volume: number) => {
		const clampedVolume = Math.max(0, Math.min(volume, 1));
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

	// Control de velocidad
	setPlaybackRate: (rate: number) => {
		// Limitar velocidad entre 0.25 y 2.0
		const clampedRate = Math.max(0.25, Math.min(rate, 2.0));
		set((state) => ({
			player: {
				...state.player,
				playbackRate: clampedRate,
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
	setQuality: (quality: string) => {
		set((state) => ({
			player: {
				...state.player,
				quality,
			},
		}));
	},

	// Estado global
        setPlayState: (playState: VideoPlayState) => {
                set((state) => ({
                        player: {
                                ...state.player,
                                playState,
                        },
                }));
        },

	getPlayState: () => {
		return get().player.playState;
	},

	// Utilidades
	getProgressPercentage: () => {
		const { currentTime, duration } = get().player;
		if (duration === 0) return 0;
		return (currentTime / duration) * 100;
	},

	getRemainingTime: () => {
		const { currentTime, duration } = get().player;
		return Math.max(0, duration - currentTime);
	},

	formatTime: (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}

		return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	},
});
