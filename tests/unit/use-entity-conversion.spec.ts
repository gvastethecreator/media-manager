import { describe, expect, it } from 'vitest';
import { useEntityConversion } from '@/lib/hooks/entities/use-entity-conversion';

// Simular entorno React mínimo no es necesario para hooks sin estado global

describe('use-entity-conversion', () => {
	it('convierte imagen válida', () => {
		const { convertSingleItem } = useEntityConversion();
		const img: any = { id: '1', name: 'img', createdAt: new Date(), updatedAt: new Date(), entityType: 'image' };
		const res = convertSingleItem(img);
		expect(res?.entityType).toBe('image');
	});

	it('retorna null si no reconoce tipo ni entityType', () => {
		const { convertSingleItem } = useEntityConversion();
		const unknown: any = { id: 'x', name: 'x', createdAt: new Date(), updatedAt: new Date() };
		const res = convertSingleItem(unknown);
		expect(res).toBeNull();
	});

	it('preserva entityType existente', () => {
		const { convertSingleItem } = useEntityConversion();
		const already: any = { id: '2', name: 'v', createdAt: new Date(), updatedAt: new Date(), entityType: 'video' };
		const res = convertSingleItem(already);
		expect(res?.entityType).toBe('video');
	});

	it('convierte lista filtrando nulos', () => {
		const { convertFileItems } = useEntityConversion();
		const items: any[] = [
			{ id: '1', name: 'img', createdAt: new Date(), updatedAt: new Date(), entityType: 'image' },
			{ id: 'x', name: 'x', createdAt: new Date(), updatedAt: new Date() },
		];
		const res = convertFileItems(items as any);
		expect(res.length).toBe(1);
		expect(res[0].entityType).toBe('image');
	});
});
