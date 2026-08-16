import { sortMediaItems, sortSingleCriterion } from '@/transformers/file/sort';

interface Item {
	createdAt: string;
	id: string;
	modifiedAt: string;
	name: string;
	size: number;
	type: string;
}

const base: Item[] = [
	{
		id: '1',
		name: 'alpha',
		createdAt: '2024-01-01T00:00:00Z',
		modifiedAt: '2024-02-01T00:00:00Z',
		size: 500,
		type: 'image',
	},
	{
		id: '2',
		name: 'Bravo',
		createdAt: '2024-01-02T00:00:00Z',
		modifiedAt: '2024-02-02T00:00:00Z',
		size: 200,
		type: 'video',
	},
	{
		id: '3',
		name: 'charlie',
		createdAt: '2024-01-03T00:00:00Z',
		modifiedAt: '2024-02-03T00:00:00Z',
		size: 800,
		type: 'image',
	},
	{
		id: '4',
		name: 'delta',
		createdAt: '2024-01-04T00:00:00Z',
		modifiedAt: '2024-02-04T00:00:00Z',
		size: 100,
		type: 'audio',
	},
];

describe('sortSingleCriterion', () => {
	it('ordena por nombre asc case-insensitive', () => {
		const ordered = sortSingleCriterion(base, { field: 'name', direction: 'asc' });
		expect(ordered.map((i) => i.id)).toEqual(['1', '2', '3', '4']);
	});
	it('ordena por tamaño desc', () => {
		const ordered = sortSingleCriterion(base, { field: 'size', direction: 'desc' });
		expect(ordered.map((i) => i.size)).toEqual([800, 500, 200, 100]);
	});
	it('ordena por fecha creación asc', () => {
		const ordered = sortSingleCriterion(base, { field: 'createdAt', direction: 'asc' });
		expect(ordered.map((i) => i.id)).toEqual(['1', '2', '3', '4']);
	});
	it('ordena por fecha modificación desc', () => {
		const ordered = sortSingleCriterion(base, { field: 'modifiedAt', direction: 'desc' });
		expect(ordered[0].id).toBe('4');
	});
});

describe('sortMediaItems multi-criterio', () => {
	it('aplica segundo criterio para desempate', () => {
		const dup = [
			{
				id: 'a',
				name: 'same',
				createdAt: '2024-01-02T00:00:00Z',
				modifiedAt: '2024-02-01T00:00:00Z',
				size: 2,
				type: 'image',
			},
			{
				id: 'b',
				name: 'same',
				createdAt: '2024-01-01T00:00:00Z',
				modifiedAt: '2024-02-01T00:00:00Z',
				size: 1,
				type: 'image',
			},
			{
				id: 'c',
				name: 'same',
				createdAt: '2024-01-03T00:00:00Z',
				modifiedAt: '2024-02-01T00:00:00Z',
				size: 3,
				type: 'image',
			},
		];
		const ordered = sortMediaItems(dup, [
			{ field: 'name', direction: 'asc' },
			{ field: 'createdAt', direction: 'asc' },
		]);
		expect(ordered.map((i) => i.id)).toEqual(['b', 'a', 'c']);
	});
	it('estable mantiene orden original si todos empatan', () => {
		const dup = [
			{
				id: 'a',
				name: 'x',
				createdAt: '2024-01-01T00:00:00Z',
				modifiedAt: '2024-02-01T00:00:00Z',
				size: 1,
				type: 'image',
			},
			{
				id: 'b',
				name: 'x',
				createdAt: '2024-01-01T00:00:00Z',
				modifiedAt: '2024-02-01T00:00:00Z',
				size: 1,
				type: 'image',
			},
			{
				id: 'c',
				name: 'x',
				createdAt: '2024-01-01T00:00:00Z',
				modifiedAt: '2024-02-01T00:00:00Z',
				size: 1,
				type: 'image',
			},
		];
		const ordered = sortMediaItems(dup, [{ field: 'name', direction: 'asc' }]);
		expect(ordered.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});
});
