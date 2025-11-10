import { describe, expect, it } from 'vitest';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
import { EntityType } from '@/types/file-entity-mapper';

function buildSpyMapperDoc() {
	const mapper: any = new (FileEntityMapperService as any)();
	mapper.handleDocumentMetadata = (p: string, id: string) => {
		mapper.docCalls.push({ p, id });
		return { success: true };
	};
	mapper.extractMetadataForEntity = FileEntityMapperService.prototype.extractMetadataForEntity;
	mapper.docCalls = [] as Array<{ p: string; id: string }>;
	mapper.getFileInfo = async (p: string, folderId: string) => ({
		name: p,
		path: p,
		size: 1,
		extension: '.pdf',
		hash: p,
		lastModified: new Date(),
		folderId,
	});
	mapper.getEntityTypeFromExtension = () => EntityType.DOCUMENT;
	mapper.checkExistingEntity = async () => false;
	mapper.createBasicEntity = async () => 'doc-id';
	return mapper as FileEntityMapperService & { docCalls: Array<{ p: string; id: string }> };
}

describe('document metadata handler', () => {
	it('invoca handleDocumentMetadata para documentos', async () => {
		const m = buildSpyMapperDoc();
		await (m as any).createEntityFromFile('file.pdf', 'folder');
		expect(m.docCalls.length).toBe(1);
	});
});
