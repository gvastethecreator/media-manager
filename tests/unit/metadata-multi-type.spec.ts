import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
import { EntityType } from '@/types/file-entity-mapper';
import { describe, expect, it } from 'bun:test';

// Creamos una instancia aislada usando el prototipo para poder parchear métodos privados.
function buildSpyMapper() {
	const mapper: any = new (FileEntityMapperService as any)();
	mapper.imageExtractions = [] as string[];
	mapper.basicCreations = [] as Array<{ path: string; type: EntityType }>;

	const originalRun = mapper.runUnifiedImageMetadataExtraction?.bind(mapper);
	mapper.runUnifiedImageMetadataExtraction = async (filePath: string) => {
		mapper.imageExtractions.push(filePath);
		// micro-await para cumplir regla de async con await explícito
		await Promise.resolve();
		return {
			metadataResult: { success: true, processing_time: 1, parser_used: 'test', errors: [], warnings: [], base: {} },
			db: {
				update: () => ({
					set: () => ({
						where: async () => {
							/* noop */
						},
					}),
				}),
			},
			images: { id: 'id', metadata: 'metadata', width: 'width', height: 'height' },
			eq: () => true,
		};
	};

	mapper.getFileInfo = async (p: string, folderId: string) => ({
		name: p.split('/').pop()?.split('.')[0] || p,
		path: p,
		size: 10,
		extension: p.slice(p.lastIndexOf('.')),
		hash: p,
		lastModified: new Date(),
		folderId,
	});

	mapper.getEntityTypeFromExtension = (ext: string) => {
		if (ext === '.png') {
			return EntityType.IMAGE;
		}
		if (ext === '.mp4') {
			return EntityType.VIDEO;
		}
		if (ext === '.mp3') {
			return EntityType.AUDIO;
		}
		return EntityType.UNKNOWN;
	};

	mapper.checkExistingEntity = async () => false;
	mapper.createBasicEntity = async (info: any, t: EntityType) => {
		mapper.basicCreations.push({ path: info.path, type: t });
		// await artificial para cumplir regla de async
		await Promise.resolve();
		return `${info.hash}:${t}`;
	};
	return mapper as FileEntityMapperService & {
		imageExtractions: string[];
		basicCreations: Array<{ path: string; type: EntityType }>;
	};
}

describe('metadata multi tipo', () => {
	it('sólo invoca extracción unificada para imágenes', async () => {
		const mapper = buildSpyMapper();
		const files = ['file1.png', 'video1.mp4', 'song1.mp3'];
		await Promise.all(files.map((f) => (mapper as any).createEntityFromFile(f, 'folder')));
		expect(mapper.basicCreations.map((c) => c.type)).toEqual([EntityType.IMAGE, EntityType.VIDEO, EntityType.AUDIO]);
		expect(mapper.imageExtractions).toEqual(['file1.png']);
	});
});
