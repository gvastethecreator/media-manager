/**
 * @file Folder Preview SVG Generator
 * @module server/utils/folder-preview-svg
 * @description Genera un SVG de preview para carpetas. Extraído de folders.effect.ts para mantener el route handler delgado.
 */

import { isSafeInlineRasterPreviewDataUrl, isSafeLocalMediaThumbnailPath } from '@/lib/media/preview-url';

export interface FolderPreviewFile {
	id: string;
	name: string;
	thumbnailDataUrl?: string;
	thumbnailPath: string;
}

interface FolderRecentPreview {
	id: string;
	name: string;
	thumbnailUrl: string;
}

interface FolderPreviewInput {
	previewFiles: FolderPreviewFile[];
	name: string;
	path: string;
	totalFiles: number;
	totalSize: string;
}

export function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function formatBytes(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return '0 B';
	}

	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}

	const decimals = unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
	return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export function sanitizePreviewCount(value: unknown, fallback = 4) {
	const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return Math.min(Math.max(parsed, 1), 4);
}

export function normalizePreviewFiles(payload: unknown, max: number): FolderPreviewFile[] {
	const files = Array.isArray((payload as { files?: unknown[] } | null)?.files)
		? ((payload as { files: unknown[] }).files ?? [])
		: [];

	return files
		.map((file) => {
			const candidate = file as {
				id?: unknown;
				name?: unknown;
				thumbnailPath?: unknown;
			};
			if (typeof candidate.id !== 'string' || typeof candidate.thumbnailPath !== 'string') {
				return null;
			}

			if (!isSafeLocalMediaThumbnailPath(candidate.thumbnailPath)) {
				return null;
			}

			return {
				id: candidate.id,
				name: typeof candidate.name === 'string' ? candidate.name : 'Preview',
				thumbnailPath: candidate.thumbnailPath,
			};
		})
		.filter((file): file is FolderPreviewFile => file !== null)
		.slice(0, max);
}

export function extractRecentPreviews(payload: unknown, max: number): FolderRecentPreview[] {
	return normalizePreviewFiles(payload, max).map((file) => ({
		id: file.id,
		name: file.name,
		thumbnailUrl: file.thumbnailPath,
	}));
}

function buildPreviewSlots(count: number) {
	if (count <= 1) {
		return [{ x: 0, y: 0, width: 1, height: 1 }];
	}

	if (count === 2) {
		return [
			{ x: 0, y: 0, width: 0.5, height: 1 },
			{ x: 0.5, y: 0, width: 0.5, height: 1 },
		];
	}

	if (count === 3) {
		return [
			{ x: 0, y: 0, width: 0.56, height: 1 },
			{ x: 0.56, y: 0, width: 0.44, height: 0.5 },
			{ x: 0.56, y: 0.5, width: 0.44, height: 0.5 },
		];
	}

	return [
		{ x: 0, y: 0, width: 0.5, height: 0.5 },
		{ x: 0.5, y: 0, width: 0.5, height: 0.5 },
		{ x: 0, y: 0.5, width: 0.5, height: 0.5 },
		{ x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
	];
}

export function buildFolderPreviewSvg(input: FolderPreviewInput) {
	const { previewFiles, name, path, totalFiles, totalSize } = input;
	const clipId = `folder-preview-clip-${previewFiles.length || 'empty'}`;
	const previewX = 74;
	const previewY = 122;
	const previewWidth = 260;
	const previewHeight = 126;
	const slots = buildPreviewSlots(previewFiles.length || 1);

	const previewMarkup =
		previewFiles.length > 0
			? `<g clip-path="url(#${clipId})">${previewFiles
					.map((file, index) => {
						const slot = slots[Math.min(index, slots.length - 1)];
						const x = previewX + slot.x * previewWidth;
						const y = previewY + slot.y * previewHeight;
						const width = slot.width * previewWidth;
						const height = slot.height * previewHeight;
						if (isSafeInlineRasterPreviewDataUrl(file.thumbnailDataUrl)) {
							return `<image href="${escapeXml(file.thumbnailDataUrl)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
						}
						const fill = index % 2 === 0 ? 'url(#folderPreviewPhotoA)' : 'url(#folderPreviewPhotoB)';
						return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
					})
					.join(
						''
					)}<rect x="${previewX}" y="${previewY}" width="${previewWidth}" height="${previewHeight}" fill="url(#folderPreviewTint)"/></g>`
			: `<g clip-path="url(#${clipId})"><rect x="${previewX}" y="${previewY}" width="${previewWidth}" height="${previewHeight}" fill="#1e293b"/><path d="M134 150h54l20 22h78c11 0 20 9 20 20v28c0 11-9 20-20 20H134c-11 0-20-9-20-20v-50c0-11 9-20 20-20Z" fill="#fbbf24" fill-opacity="0.92"/></g>`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="Preview de carpeta ${escapeXml(name)}">
  <defs>
    <linearGradient id="folderPreviewBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="folderBody" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="folderFront" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fff4d6" stop-opacity="0.76"/>
      <stop offset="100%" stop-color="#fed7aa" stop-opacity="0.58"/>
    </linearGradient>
    <linearGradient id="folderPreviewTint" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.24"/>
    </linearGradient>
    <linearGradient id="folderPreviewPhotoA" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <linearGradient id="folderPreviewPhotoB" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </linearGradient>
    <linearGradient id="folderGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#fb7185" stop-opacity="0.22"/>
    </linearGradient>
    <clipPath id="${clipId}">
      <rect x="${previewX}" y="${previewY}" width="${previewWidth}" height="${previewHeight}" rx="18"/>
    </clipPath>
  </defs>
  <rect width="640" height="360" fill="url(#folderPreviewBg)" rx="24"/>
  <rect x="16" y="16" width="608" height="328" fill="#0f172a" fill-opacity="0.68" rx="20" stroke="#334155" stroke-opacity="0.72"/>
  <rect x="20" y="20" width="600" height="320" fill="url(#folderGlow)" rx="18"/>
  <rect x="66" y="92" width="128" height="36" rx="14" fill="url(#folderBody)"/>
  <rect x="58" y="108" width="290" height="148" rx="24" fill="url(#folderBody)"/>
  ${previewMarkup}
  <rect x="66" y="116" width="276" height="138" rx="22" fill="url(#folderFront)" stroke="#ffffff" stroke-opacity="0.18"/>
  <rect x="386" y="82" width="190" height="196" rx="22" fill="#111827" fill-opacity="0.72" stroke="#334155" stroke-opacity="0.72"/>
  <text x="410" y="124" fill="#f8fafc" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="28" font-weight="700">${escapeXml(name)}</text>
  <text x="410" y="156" fill="#94a3b8" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15">${escapeXml(path)}</text>
  <text x="410" y="204" fill="#f8fafc" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="42" font-weight="700">${totalFiles}</text>
  <text x="410" y="230" fill="#cbd5e1" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="14">archivos detectados</text>
  <text x="410" y="266" fill="#e2e8f0" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15">${totalSize}</text>
  <text x="410" y="292" fill="#94a3b8" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="13">Preview viva con media reciente</text>
</svg>`;
}
