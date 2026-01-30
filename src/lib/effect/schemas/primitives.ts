/**
 * @file Primitive Effect Schemas
 * @module lib/effect/schemas/primitives
 * @description Schemas para tipos primitivos reutilizables (strings, numbers, colors, URLs, etc.)
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from '@effect/schema';

// ============= Strings =============

/**
 * String no vacío (sin trim)
 */
export const NonEmptyString = Schema.String.pipe(Schema.minLength(1)).annotations({
	identifier: 'NonEmptyString',
	title: 'Non-empty string',
	description: 'String with at least 1 character',
});

/**
 * String trimmed y no vacío después del trim
 * @note Use transform manually if trim is needed
 */
export const NonEmptyTrimmedString = Schema.String.pipe(Schema.minLength(1)).annotations({
	identifier: 'NonEmptyTrimmedString',
	title: 'Non-empty trimmed string',
	description: 'String with at least 1 character (trim manually if needed)',
});

/**
 * String con longitud máxima (útil para nombres, títulos)
 */
export const BoundedString = (min: number, max: number) =>
	Schema.String.pipe(Schema.minLength(min), Schema.maxLength(max)).annotations({
		identifier: `BoundedString(${min},${max})`,
		description: `String between ${min} and ${max} characters`,
	});

/**
 * Email válido
 */
export const Email = Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)).annotations({
	identifier: 'Email',
	title: 'Email address',
	description: 'Valid email format',
	examples: ['user@example.com', 'admin@company.org'],
});

// ============= Numbers =============

/**
 * Entero positivo (> 0)
 */
export const PositiveInt = Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
	identifier: 'PositiveInt',
	title: 'Positive integer',
	description: 'Integer greater than 0',
});

/**
 * Entero no negativo (>= 0)
 */
export const NonNegativeInt = Schema.Number.pipe(Schema.int(), Schema.nonNegative()).annotations({
	identifier: 'NonNegativeInt',
	title: 'Non-negative integer',
	description: 'Integer greater than or equal to 0',
});

/**
 * Porcentaje (0-100)
 */
export const Percentage = Schema.Number.pipe(Schema.greaterThanOrEqualTo(0), Schema.lessThanOrEqualTo(100)).annotations(
	{
		identifier: 'Percentage',
		title: 'Percentage',
		description: 'Number between 0 and 100',
		examples: [0, 50, 100],
	}
);

/**
 * Ratio (0-1)
 */
export const Ratio = Schema.Number.pipe(Schema.greaterThanOrEqualTo(0), Schema.lessThanOrEqualTo(1)).annotations({
	identifier: 'Ratio',
	title: 'Ratio',
	description: 'Number between 0 and 1',
	examples: [0, 0.5, 1],
});

/**
 * File size en bytes (no negativo)
 */
export const FileSize = Schema.Number.pipe(Schema.int(), Schema.nonNegative()).annotations({
	identifier: 'FileSize',
	title: 'File size in bytes',
	description: 'Non-negative integer representing file size',
});

// ============= Colors =============

/**
 * Color hexadecimal RGB (#RRGGBB)
 */
export const HexColor = Schema.String.pipe(Schema.pattern(/^#[0-9A-Fa-f]{6}$/)).annotations({
	identifier: 'HexColor',
	title: 'Hex color code',
	description: 'RGB color in #RRGGBB format',
	examples: ['#FF5733', '#3498db'],
});

/**
 * Color hexadecimal RGBA (#RRGGBBAA)
 */
export const HexColorWithAlpha = Schema.String.pipe(Schema.pattern(/^#[0-9A-Fa-f]{8}$/)).annotations({
	identifier: 'HexColorWithAlpha',
	title: 'Hex color with alpha',
	description: 'RGBA color in #RRGGBBAA format',
	examples: ['#FF573380', '#3498dbFF'],
});

/**
 * CSS variable color preset (var(--preset-*))
 */
export const PresetColor = Schema.String.pipe(Schema.pattern(/^var\(--preset-[a-z]+\)$/)).annotations({
	identifier: 'PresetColor',
	title: 'Preset color variable',
	description: 'CSS variable preset color like var(--preset-purple)',
	examples: ['var(--preset-purple)', 'var(--preset-red)', 'var(--preset-blue)'],
});

/**
 * Flexible color that accepts hex colors or CSS preset variables
 */
export const ThemeColor = Schema.Union(HexColor, PresetColor).annotations({
	identifier: 'ThemeColor',
	title: 'Theme color',
	description: 'Hex color (#RRGGBB) or preset CSS variable (var(--preset-*))',
	examples: ['#FF5733', 'var(--preset-purple)'],
});

// ============= URLs & Paths =============

/**
 * URL HTTP/HTTPS
 */
export const HttpUrl = Schema.String.pipe(Schema.pattern(/^https?:\/\/.+/)).annotations({
	identifier: 'HttpUrl',
	title: 'HTTP/HTTPS URL',
	description: 'Valid HTTP or HTTPS URL',
	examples: ['http://example.com', 'https://api.example.com/endpoint'],
});

/**
 * Path absoluto de archivo
 */
export const AbsoluteFilePath = Schema.String.pipe(Schema.minLength(1)).annotations({
	identifier: 'AbsoluteFilePath',
	title: 'Absolute file path',
	description: 'OS-agnostic absolute file path',
	examples: ['/home/user/file.txt', 'C:\\Users\\user\\file.txt'],
});

/**
 * Path relativo de archivo
 */
export const RelativeFilePath = Schema.String.pipe(Schema.minLength(1)).annotations({
	identifier: 'RelativeFilePath',
	title: 'Relative file path',
	description: 'Relative file path',
	examples: ['./file.txt', '../folder/file.txt', 'subfolder/file.txt'],
});

/**
 * Filename (solo nombre, sin path)
 */
export const FileName = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)).annotations({
	identifier: 'FileName',
	title: 'File name',
	description: 'File name without path',
	examples: ['document.pdf', 'image.jpg', 'video.mp4'],
});

/**
 * File extension (con punto)
 */
export const FileExtension = Schema.String.pipe(Schema.pattern(/^\.[a-z0-9]+$/i)).annotations({
	identifier: 'FileExtension',
	title: 'File extension',
	description: 'File extension with leading dot',
	examples: ['.jpg', '.png', '.pdf', '.mp4'],
});

// ============= Media Types =============

/**
 * MIME type de imagen
 */
export const ImageMimeType = Schema.Literal(
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'image/bmp',
	'image/tiff'
).annotations({
	identifier: 'ImageMimeType',
	title: 'Image MIME type',
	description: 'Supported image MIME types',
});

/**
 * MIME type de video
 */
export const VideoMimeType = Schema.Literal(
	'video/mp4',
	'video/webm',
	'video/ogg',
	'video/quicktime',
	'video/x-msvideo',
	'video/x-matroska'
).annotations({
	identifier: 'VideoMimeType',
	title: 'Video MIME type',
	description: 'Supported video MIME types',
});

/**
 * MIME type de audio
 */
export const AudioMimeType = Schema.Literal(
	'audio/mpeg',
	'audio/mp3',
	'audio/wav',
	'audio/ogg',
	'audio/webm',
	'audio/flac'
).annotations({
	identifier: 'AudioMimeType',
	title: 'Audio MIME type',
	description: 'Supported audio MIME types',
});

/**
 * MIME type de documento
 */
export const DocumentMimeType = Schema.Literal(
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain',
	'text/markdown',
	'application/json'
).annotations({
	identifier: 'DocumentMimeType',
	title: 'Document MIME type',
	description: 'Supported document MIME types',
});

// ============= Dimensions =============

/**
 * Dimensiones de imagen/video (width x height)
 */
export class Dimensions extends Schema.Class<Dimensions>('Dimensions')({
	width: PositiveInt.annotations({ description: 'Width in pixels' }),
	height: PositiveInt.annotations({ description: 'Height in pixels' }),
}) {}

/**
 * Aspect ratio (ancho / alto)
 */
export const AspectRatio = Schema.Number.pipe(Schema.positive()).annotations({
	identifier: 'AspectRatio',
	title: 'Aspect ratio',
	description: 'Width divided by height',
	examples: [1.777, 1.333, 0.5625], // 16:9, 4:3, 9:16
});

// ============= Status & State =============

/**
 * Estado de entidad
 */
export const EntityStatus = Schema.Literal('active', 'archived', 'deleted').annotations({
	identifier: 'EntityStatus',
	title: 'Entity lifecycle status',
	description: 'Current status of an entity',
});

/**
 * Estado de procesamiento
 */
export const ProcessingStatus = Schema.Literal('pending', 'processing', 'completed', 'failed').annotations({
	identifier: 'ProcessingStatus',
	title: 'Processing status',
	description: 'Status of an async processing task',
});

// ============= Emojis =============

/**
 * Emoji (Unicode emoji character)
 */
export const Emoji = Schema.String.pipe(Schema.maxLength(10)).annotations({
	identifier: 'Emoji',
	title: 'Emoji',
	description: 'Unicode emoji character',
	examples: ['😀', '🎉', '✨', '❤️'],
});
