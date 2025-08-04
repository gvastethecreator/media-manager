/**
 * @file Test for Enhanced File Operations Service
 * @description Basic test to verify the enhanced file operations service structure
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/logger/server-logger', () => ({
	serverLogger: {
		withContext: () => ({
			info: vi.fn(),
			error: vi.fn(),
		}),
	},
}));

vi.mock('@/services/toast', () => ({
	toastService: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

vi.mock('./file.service', () => ({
	copyFile: vi.fn(),
	moveFile: vi.fn(),
	deleteFile: vi.fn(),
	renameFile: vi.fn(),
	getFileInfo: vi.fn(),
}));

vi.mock('@/types/entities/file', () => ({
	FileErrorCode: {
		OPERATION_FAILED: 'OPERATION_FAILED',
	},
}));

// Mock AnyEntityWithStats type
const mockEntity = {
	id: '1',
	name: 'test-file.txt',
	path: '/test/test-file.txt',
	entityType: 'file' as const,
	stats: {
		formattedSize: '100 bytes',
		typeLabel: 'text',
		iconName: 'file',
		colorCode: '#666666',
		daysSinceModified: 0,
		daysSinceAccessed: 0,
		isRecent: true,
		isLarge: false,
		formattedModifiedAt: '2025-01-27',
		childCount: 0,
		shortPath: 'test-file.txt',
	},
};

describe('Enhanced File Operations Service', () => {
	let enhancedService: any;
	let clipboardManager: any;

	beforeEach(async () => {
		// Reset mocks
		vi.clearAllMocks();

		// Import the service after mocks are set up
		const module = await import('./enhanced-file-operations.service');
		enhancedService = module.enhancedFileOperationsService;
		clipboardManager = module.clipboardManager;
	});

	describe('ClipboardManager', () => {
		it('should copy items to clipboard', () => {
			const items = [mockEntity];

			clipboardManager.copy(items);

			expect(clipboardManager.canPaste()).toBe(true);
			const clipboardData = clipboardManager.getClipboardData();
			expect(clipboardData).toEqual({
				items,
				operation: 'copy',
				timestamp: expect.any(Number),
				source: 'file-browser',
			});
		});

		it('should cut items to clipboard', () => {
			const items = [mockEntity];

			clipboardManager.cut(items);

			expect(clipboardManager.canPaste()).toBe(true);
			const clipboardData = clipboardManager.getClipboardData();
			expect(clipboardData?.operation).toBe('cut');
		});

		it('should clear clipboard', () => {
			const items = [mockEntity];
			clipboardManager.copy(items);

			clipboardManager.clear();

			expect(clipboardManager.canPaste()).toBe(false);
			expect(clipboardManager.getClipboardData()).toBeNull();
		});
	});

	describe('EnhancedFileOperationsService', () => {
		it('should have all required methods', () => {
			expect(enhancedService.copyToClipboard).toBeDefined();
			expect(enhancedService.cutToClipboard).toBeDefined();
			expect(enhancedService.pasteFromClipboard).toBeDefined();
			expect(enhancedService.renameItem).toBeDefined();
			expect(enhancedService.moveItems).toBeDefined();
			expect(enhancedService.deleteItems).toBeDefined();
			expect(enhancedService.canPaste).toBeDefined();
			expect(enhancedService.getClipboardData).toBeDefined();
			expect(enhancedService.clearClipboard).toBeDefined();
		});

		it('should copy items to clipboard', async () => {
			const items = [mockEntity];

			await enhancedService.copyToClipboard(items);

			expect(enhancedService.canPaste()).toBe(true);
		});

		it('should cut items to clipboard', async () => {
			const items = [mockEntity];

			await enhancedService.cutToClipboard(items);

			expect(enhancedService.canPaste()).toBe(true);
		});
	});
});
