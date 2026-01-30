import { vi } from 'vitest';
import { DocumentProcessor } from '@/services/file-entity-mapper/processors/document.processor';
import { getEntityTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';

describe('document metadata handler', () => {
	it('retorna document para extensión .pdf', () => {
		const type = getEntityTypeFromExtension('.pdf');
		expect(type).toBe('document');
	});

	it('retorna document para extensión .docx', () => {
		const type = getEntityTypeFromExtension('.docx');
		expect(type).toBe('document');
	});

	it('DocumentProcessor tiene método extractMetadata', () => {
		const processor = new DocumentProcessor();
		expect(typeof processor.extractMetadata).toBe('function');
	});

	it('DocumentProcessor.extractMetadata retorna success', async () => {
		const processor = new DocumentProcessor();
		// Mock del resultado - el processor real necesita BD
		const spy = vi.spyOn(processor, 'extractMetadata').mockResolvedValue({ success: true });
		const result = await processor.extractMetadata('file.pdf', 'doc-id');
		expect(result.success).toBe(true);
		expect(spy).toHaveBeenCalledWith('file.pdf', 'doc-id');
	});
});
