import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFileActions } from './use-file-actions';

const moveFiles = vi.fn(async (_fileIds: string[], _targetFolderId: string) => undefined);

vi.mock('@/lib/contexts/file-context', () => ({
	useFiles: () => ({
		addTags: vi.fn(),
		addToCollection: vi.fn(),
		clearSelection: vi.fn(),
		downloadFiles: vi.fn(),
		moveFiles,
		removeFiles: vi.fn(),
		selectedFiles: ['image-1'],
		toggleFavorite: vi.fn(),
	}),
}));

describe('useFileActions', () => {
	it('moves with a targetFolderId, not a filesystem path', async () => {
		const { result } = renderHook(() => useFileActions());
		await act(async () => {
			await result.current.handleMove('folder-target');
		});
		expect(moveFiles).toHaveBeenCalledWith(['image-1'], 'folder-target');
		expect(result.current).not.toHaveProperty('handleCopy');
	});
});
