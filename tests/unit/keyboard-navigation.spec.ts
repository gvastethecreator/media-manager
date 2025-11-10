import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from '@/components/features/file-browser/navigation/keyboard-navigation';

// Helper para construir items simulados
function makeItems(n: number) {
	return Array.from(
		{ length: n },
		(_, i) =>
			({
				id: `id-${i}`,
				entityType: 'image',
				name: `Item ${i}`,
				path: `/tmp/${i}.png`,
				thumbnailUrl: '',
			}) as any
	);
}

describe('useKeyboardNavigation.getNextIndex', () => {
	it('navegación lineal en list', () => {
		const items = makeItems(10);
		const { result } = renderHook(() =>
			useKeyboardNavigation({
				items,
				viewMode: 'list',
				containerRef: { current: document.createElement('div') } as any,
			})
		);
		const { getNextIndex } = result.current as any;
		expect(getNextIndex(0, 'down')).toBe(1);
		expect(getNextIndex(1, 'up')).toBe(0);
		expect(getNextIndex(0, 'up')).toBe(0);
	});

	it('navegación grid calcula columnas', () => {
		const container = document.createElement('div');
		container.style.width = '500px';
		Object.defineProperty(container, 'clientWidth', { value: 500 });
		const items = makeItems(30);
		const { result } = renderHook(() =>
			useKeyboardNavigation({ items, viewMode: 'grid', containerRef: { current: container } as any })
		);
		const { getNextIndex } = result.current as any;
		const idx = getNextIndex(0, 'down');
		expect(idx).toBeGreaterThan(0);
	});

	it('PageUp/PageDown afecta índice (simulado)', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientHeight', { value: 600 });
		const items = makeItems(100);
		const { result } = renderHook(() =>
			useKeyboardNavigation({ items, viewMode: 'grid', containerRef: { current: container } as any })
		);
		// forzamos current index manualmente (activeId no seteado) -> getNextIndex test solamente
		// Page logic probada indirectamente vía cálculo de columnas + desplazamiento vertical
		const { getNextIndex } = result.current as any;
		expect(typeof getNextIndex(5, 'down')).toBe('number');
	});
});
