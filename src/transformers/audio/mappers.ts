/**
 * @file Mappers para la entidad Audio
 * @module transformers/audio/mappers
 * @description Contiene funciones para mapear datos de Audio entre diferentes formatos.
 */

import type { Audio, AudioCreateInput, AudioFormData, AudioUIInput } from '@/types/entities/audio';

/**
 * 🎨 Mapea un Audio a formato UI
 * @param audio - Objeto Audio a mapear
 * @returns Objeto mapeado para la UI
 */
export function mapAudioToUI(audio: Audio) {
	return {
		id: audio.id,
		name: audio.name,
		path: audio.path,
		size: audio.size,
		hash: audio.hash,
		mimeType: audio.mimeType,
		extension: audio.extension,
		folderId: audio.folderId,
		isFavorite: audio.isFavorite,
		isArchived: audio.isArchived,
		duration: audio.duration,
		bitrate: audio.bitrate,
		sampleRate: audio.sampleRate,
		channels: audio.channels,
		format: audio.format,
		codec: audio.codec,
		title: audio.title,
		artist: audio.artist,
		album: audio.album,
		year: audio.year,
		genre: audio.genre,
		track: audio.track,
		disc: audio.disc,
		albumArtist: audio.albumArtist,
		composer: audio.composer,
		comment: audio.comment,
		lyrics: audio.lyrics,
		bpm: audio.bpm,
		key: audio.key,
		mood: audio.mood,
		createdAt: audio.createdAt,
		updatedAt: audio.updatedAt,
	};
}

/**
 * 🎨 Mapea datos de UI a formato Audio
 * @param uiData - Datos de la UI
 * @returns Objeto AudioFormData
 */
export function mapAudioFromUI(uiData: AudioUIInput): AudioFormData {
	return {
		name: uiData.name || '',
		description: uiData.description || null,
		path: uiData.path || '',
		size: uiData.size || 0,
		hash: uiData.hash || '',
		mimeType: uiData.mimeType || '',
		extension: uiData.extension || '',
		folderId: uiData.folderId || '',
		isFavorite: uiData.isFavorite || false,
		isArchived: uiData.isArchived || false,
		duration: uiData.duration || null,
		bitrate: uiData.bitrate || null,
		sampleRate: uiData.sampleRate || null,
		channels: uiData.channels || null,
		format: uiData.format || null,
		codec: uiData.codec || null,
		title: uiData.title || null,
		artist: uiData.artist || null,
		album: uiData.album || null,
		year: uiData.year || null,
		genre: uiData.genre || null,
		track: uiData.track || null,
		disc: uiData.disc || null,
		albumArtist: uiData.albumArtist || null,
		composer: uiData.composer || null,
		comment: uiData.comment || null,
		lyrics: uiData.lyrics || null,
		bpm: uiData.bpm || null,
		key: uiData.key || null,
		mood: uiData.mood || null,
	};
}

/**
 * 🎨 Mapea AudioFormData a AudioCreateInput
 * @param formData - Datos del formulario
 * @returns Objeto AudioCreateInput
 */
export function mapFormDataToCreateInput(formData: AudioFormData): AudioCreateInput {
	return {
		name: formData.name,
		path: formData.path,
		size: formData.size,
		hash: formData.hash,
		mimeType: formData.mimeType,
		extension: formData.extension,
		folderId: formData.folderId,
		isFavorite: formData.isFavorite,
		isArchived: formData.isArchived,
		duration: formData.duration,
		bitrate: formData.bitrate,
		sampleRate: formData.sampleRate,
		channels: formData.channels,
		format: formData.format,
		codec: formData.codec,
		title: formData.title,
		artist: formData.artist,
		album: formData.album,
		year: formData.year,
		genre: formData.genre,
		track: formData.track,
		disc: formData.disc,
		albumArtist: formData.albumArtist,
		composer: formData.composer,
		comment: formData.comment,
		lyrics: formData.lyrics,
		bpm: formData.bpm,
		key: formData.key,
		mood: formData.mood,
	};
}
