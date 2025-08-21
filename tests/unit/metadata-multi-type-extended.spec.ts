import { describe, expect, it } from 'bun:test';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
import { EntityType } from '@/types/file-entity-mapper';

function buildSpyMapperExtended() {
	const mapper: any = new (FileEntityMapperService as any)();
	mapper.imageExtractions = [] as string[];
	mapper.videoExtractions = [] as string[];
	mapper.audioExtractions = [] as string[];
	mapper.basicCreations = [] as Array<{ path: string; type: EntityType }>;

	mapper.runUnifiedImageMetadataExtraction = async (filePath: string) => {
		mapper.imageExtractions.push(filePath);
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

	mapper.handleVideoMetadata = async (filePath: string) => {
		mapper.videoExtractions.push(filePath);
		await Promise.resolve();
		return { success: true };
	};

	mapper.handleAudioMetadata = async (filePath: string) => {
		mapper.audioExtractions.push(filePath);
		await Promise.resolve();
		return { success: true };
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
		if (ext === '.bin') {
			return EntityType.UNKNOWN;
		}
		return EntityType.UNKNOWN;
	};

	mapper.checkExistingEntity = async () => false;
	mapper.createBasicEntity = async (info: any, t: EntityType) => {
		mapper.basicCreations.push({ path: info.path, type: t });
		await Promise.resolve();
		return `${info.hash}:${t}`;
	};
	return mapper as FileEntityMapperService & {
		imageExtractions: string[];
		videoExtractions: string[];
		audioExtractions: string[];
		basicCreations: Array<{ path: string; type: EntityType }>;
	};
}

describe('metadata multi tipo extendido', () => {
	it('invoca handlers específicos para imagen, video y audio y omite unknown', async () => {
		const mapper = buildSpyMapperExtended();
		const files = ['a.png', 'b.mp4', 'c.mp3', 'd.bin'];
		await Promise.all(files.map((f) => (mapper as any).createEntityFromFile(f, 'folder')));
		expect(mapper.basicCreations.map((c) => c.type)).toEqual([
			EntityType.IMAGE,
			EntityType.VIDEO,
			EntityType.AUDIO,
			EntityType.UNKNOWN,
		]);
		expect(mapper.imageExtractions).toEqual(['a.png']);
		expect(mapper.videoExtractions).toEqual(['b.mp4']);
		expect(mapper.audioExtractions).toEqual(['c.mp3']);
	});
});
