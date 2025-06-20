/**
 * @file Mappers para la entidad Audio
 * @module transformers/audio/mappers
 * @description Contiene funciones para mapear datos de Audio entre diferentes formatos.
 */

import type { Audio, AudioCreateInput, AudioFormData } from '@/types/entities/audio';

/**
 * 🎨 Mapea un Audio a formato UI
 * @param audio - Objeto Audio a mapear
 * @returns Objeto mapeado para la UI
 */
export function mapAudioToUI(audio: Audio) {
	return {
		id: audio.id,
		name: audio.name,
		description: audio.description || '',
		filePath: audio.filePath,
		format: audio.format,
		duration: audio.duration,
		size: audio.size,
		isFavorite: audio.isFavorite,
		createdAt: audio.createdAt,
		updatedAt: audio.updatedAt,
	};
}

/**
 * 🎨 Mapea datos de UI a formato Audio
 * @param uiData - Datos de la UI
 * @returns Objeto AudioFormData
 */
export function mapAudioFromUI(uiData: any): AudioFormData {
	return {
		name: uiData.name || '',
		description: uiData.description || null,
		format: uiData.format || '',
		duration: uiData.duration || null,
		size: uiData.size || 0,
		isFavorite: uiData.isFavorite || false,
		filePath: uiData.filePath,
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
		description: formData.description,
		filePath: formData.filePath || '',
		format: formData.format,
		duration: formData.duration,
		size: formData.size,
		isFavorite: formData.isFavorite,
	};
}
