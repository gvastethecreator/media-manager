import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BrowserItem } from '../types/item.types';
import { FolderBrowserVisual } from './folder-browser-visual';

function folderItem(overrides: Partial<BrowserItem> = {}): BrowserItem {
	return {
		entityType: 'folder',
		id: 'folder-1',
		name: 'Test folder',
		totalItems: 1,
		...overrides,
	};
}

describe('FolderBrowserVisual', () => {
	it('uses only an allowed local thumbnail in preview styles', () => {
		const { container } = render(
			<FolderBrowserVisual
				item={folderItem({
					recentImages: [{ id: 'image-1', thumbnailUrl: '/api/images/image-1/thumbnail' }],
				})}
			/>
		);

		expect(container.querySelector('[style*="/api/images/image-1/thumbnail"]')).not.toBeNull();
	});

	it('rejects a path that attempts to close url() inside the style', () => {
		const tracker = 'https://example.test/tracker.png';
		const { container } = render(
			<FolderBrowserVisual
				item={folderItem({
					recentImages: [{ id: 'image-1', thumbnailUrl: `/api/images/image-1/thumbnail") , url(${tracker}) /*` }],
					thumbnailUrl: `/api/images/image-1/thumbnail") , url(${tracker}) /*`,
				})}
			/>
		);

		expect(container.querySelector(`[style*="${tracker}"]`)).toBeNull();
		expect(container.querySelector('[style*="url("]')).toBeNull();
	});
});
