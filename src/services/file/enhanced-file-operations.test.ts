/**
 * @file Test for Enhanced File Operations Service
 * @description Basic test to verify the enhanced file operations service structure
 */

import { beforeEach, describe, expect, it,vi } from 'vitest';
import type { AnyEntityWithStats } from '@/types/entities';

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
	// For test purposes we only need shape compatibility; cast to AnyEntityWithStats
	entityType: 'image' as const,
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
} as unknown as AnyEntityWithStats;

describe('Enhanced File Operations Service', () => {
	let enhancedService: typeof import('./enhanced-file-operations.service').enhancedFileOperationsService;

	beforeEach(async () => {
		// Reset mocks
		vi.clearAllMocks();

		// Import the service after mocks are set up
		const module = await import('./enhanced-file-operations.service');
		enhancedService = module.enhancedFileOperationsService;
	});

	describe('Clipboard operations (via service API)', () => {
		it('should copy items to clipboard', async () => {
			const items: AnyEntityWithStats[] = [mockEntity];
			await enhancedService.copyToClipboard(items);
			expect(enhancedService.canPaste()).toBe(true);
			const data = enhancedService.getClipboardData();
			expect(data?.items).toEqual(items);
			expect(data?.operation).toBe('copy');
			expect(typeof data?.timestamp).toBe('number');
			expect(data?.source).toBe('file-browser');
		});

		it('should cut items to clipboard', async () => {
			const items: AnyEntityWithStats[] = [mockEntity];
			await enhancedService.cutToClipboard(items);
			expect(enhancedService.canPaste()).toBe(true);
			expect(enhancedService.getClipboardData()?.operation).toBe('cut');
		});

		it('should clear clipboard', () => {
			// Primero copiar algo
			enhancedService.clearClipboard();
			expect(enhancedService.canPaste()).toBe(false);
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
			const items: AnyEntityWithStats[] = [mockEntity];

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
