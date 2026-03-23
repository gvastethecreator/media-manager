import { describe, expect, it } from 'vitest';

import type { FolderWithStats } from '@/types/entities/folder';

function createFolder(id: string, name: string, path: string, parentId: string | null): FolderWithStats {
	const now = new Date('2026-01-01T00:00:00.000Z');

	return {
		id,
		name,
		path,
		parentId,
		createdAt: now,
		updatedAt: now,
		description: null,
		color: null,
		emoji: null,
		featuredImage: null,
		isFavorite: false,
		lastIndexed: null,
		presetId: null,
		totalFiles: 0,
		totalSize: 0,
		entityType: 'folder',
		stats: {
			accessFrequency: 0,
			autoTags: [],
			averageFileSize: 0,
			breadcrumbs: [],
			contentDiversity: 0,
			directChildren: 0,
			documentCount: 0,
			folderCount: 0,
			formattedSize: '0 B',
			fullPath: path,
			hasConsistentNaming: true,
			hasDeepHierarchy: false,
			hierarchyDepth: parentId ? 1 : 0,
			isWellOrganized: true,
			largestFile: 0,
			lastActivity: null,
			organizationScore: 100,
			qualityGrade: 'A',
			relativePath: path,
			totalAudio: 0,
			totalDescendants: 0,
			totalDocuments: 0,
			totalFiles: 0,
			totalFolders: 0,
			totalImages: 0,
			totalOthers: 0,
			totalRelations: 0,
			totalSize: 0,
			totalVideos: 0,
			albumCount: 0,
			birthtime: now,
			characterCount: 0,
			collectionCount: 0,
			conceptCount: 0,
			groupCount: 0,
			imageCount: 0,
			lastUpdated: now,
			mtime: now,
			noteCount: 0,
			placeCount: 0,
			promptCount: 0,
			propertyCount: 0,
			size: 0,
			tagCount: 0,
			totalAssociations: 0,
			totalItems: 0,
			type: 'folder',
			videoCount: 0,
			wildcardCount: 0,
			worldItemCount: 0,
		},
	};
}

const folders: FolderWithStats[] = [
	createFolder('root-comfy', 'comfy', 'D:/media/comfy', null),
	createFolder('text2img', 'text2img', 'D:/media/comfy/text2img', 'root-comfy'),
	createFolder('fornite', 'fornite', 'D:/media/comfy/text2img/fornite', 'text2img'),
];

async function loadNavigationUtils() {
	if (!('window' in globalThis)) {
		Object.defineProperty(globalThis, 'window', {
			value: { location: { origin: 'http://localhost:5173' } },
			configurable: true,
		});
	}

	return import('./hierarchical-navigation');
}

describe('hierarchical-navigation', () => {
	it('resuelve todos los segmentos cuando la ruta existe completa', async () => {
		const { getFolderIdFromPath, isValidHierarchicalPath, parseHierarchicalPath } = await loadNavigationUtils();

		expect(parseHierarchicalPath('/comfy/text2img/fornite', folders)).toEqual(['root-comfy', 'text2img', 'fornite']);
		expect(getFolderIdFromPath('/comfy/text2img/fornite', folders)).toBe('fornite');
		expect(isValidHierarchicalPath('/comfy/text2img/fornite', folders)).toBe(true);
	});

	it('rechaza coincidencias parciales y no cae al ancestro más cercano', async () => {
		const { getFolderIdFromPath, isValidHierarchicalPath, parseHierarchicalPath } = await loadNavigationUtils();

		expect(parseHierarchicalPath('/comfy/text2img/inexistente', folders)).toEqual([]);
		expect(getFolderIdFromPath('/comfy/text2img/inexistente', folders)).toBeNull();
		expect(isValidHierarchicalPath('/comfy/text2img/inexistente', folders)).toBe(false);
	});
});
