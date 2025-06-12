/**
 * @file Esquema de validación para la entidad Video
 * @module types/entities/video/schema
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';
import { VideoCodec, VideoFormat, VideoPrivacyLevel, VideoQuality, VideoType } from './enums';

/**
 * 🎥 Esquema para metadatos de video
 */
export const VideoMetadataSchema = z.object({
	duration: z.number(),
	width: z.number(),
	height: z.number(),
	format: z.nativeEnum(VideoFormat),
	size: z.number(),
	codec: z.nativeEnum(VideoCodec).optional(),
	bitrate: z.number().optional(),
	frameRate: z.number().optional(),
	aspectRatio: z.string().optional(),
	audioCodec: z.string().optional(),
	audioChannels: z.number().optional(),
	audioSampleRate: z.number().optional(),
	rotation: z.number().optional(),
	hasAudio: z.boolean().optional(),
	subtitleLanguages: z.array(z.string()).optional(),
	audioLanguages: z.array(z.string()).optional(),
	creationDate: z.union([z.date(), z.string()]).optional(),
	location: z
		.object({
			latitude: z.number(),
			longitude: z.number(),
			name: z.string().optional(),
		})
		.optional(),
	camera: z
		.object({
			make: z.string().optional(),
			model: z.string().optional(),
			software: z.string().optional(),
		})
		.optional(),
});

/**
 * 📺 Esquema para capítulos de video
 */
export const VideoChapterSchema = z.object({
	id: z.string(),
	title: z.string(),
	startTime: z.number(),
	endTime: z.number(),
	thumbnailPath: z.string().optional(),
});

/**
 * ⏯️ Esquema para estado de reproducción
 */
export const VideoPlaybackStateSchema = z.object({
	position: z.number(),
	lastPlayed: z.union([z.date(), z.string()]),
	completed: z.boolean(),
	favorite: z.boolean(),
	watchCount: z.number(),
});

/**
 * 🎬 Esquema principal para Video
 */
export const VideoSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	name: z.string().min(1),
	description: z.string().nullable(),
	path: z.string(),
	hash: z.string(),
	size: z.number(),
	duration: z.number(),
	width: z.number().nullable(),
	height: z.number().nullable(),
	metadata: z.union([VideoMetadataSchema, z.string()]).nullable(),
	thumbnail: z.instanceof(Buffer).nullable(),
	thumbnailSize: z.number().nullable(),
	thumbnailWidth: z.number().nullable(),
	thumbnailHeight: z.number().nullable(),
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	folderId: z.string(),
	type: z.nativeEnum(VideoType).optional(),
	quality: z.nativeEnum(VideoQuality).optional(),
	privacyLevel: z.nativeEnum(VideoPrivacyLevel).optional(),
	sharedWith: z.array(z.string()).optional(),
	chapters: z.array(VideoChapterSchema).optional(),
	playState: VideoPlaybackStateSchema.optional(),
});
