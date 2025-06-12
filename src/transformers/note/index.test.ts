import { prisma } from '@/lib/prisma';
import { searchNotes } from './index';
import { fromPrismaNote } from './serializers';

jest.mock('@/lib/prisma', () => ({
	prisma: {
		note: {
			findMany: jest.fn(),
			count: jest.fn(),
		},
	},
}));

jest.mock('./serializers', () => ({
	fromPrismaNote: jest.fn((n: any) => n),
}));

jest.mock('./mappers', () => ({
	mapNoteSearchOptionsToPrisma: jest.fn(() => ({})),
	mapNoteFiltersToPrisma: jest.fn(() => ({})),
}));

describe('searchNotes', () => {
	it('devuelve items, total y hasMore', async () => {
		(prisma.note.findMany as jest.Mock).mockResolvedValue([
			{
				id: '1',
				title: 'n',
				content: '',
				category: '',
				priority: 0,
				status: '',
				featuredImage: null,
				isFavorite: false,
				presetId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
		(prisma.note.count as jest.Mock).mockResolvedValue(1);

		const result = await searchNotes({}, { page: 1, pageSize: 1 });
		expect(result.items).toHaveLength(1);
		expect(result.total).toBe(1);
		expect(result.hasMore).toBe(false);
	});
});
