/**
 * @file ClipboardManager tests
 * @module services/clipboard/clipboard-manager.test
 * @description Comprehensive tests for ClipboardManager functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClipboardManager, ClipboardFormat } from './clipboard-manager';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileType } from '@/types/entities/file';

// Mock dependencies
vi.mock('@/lib/logger/server-logger', () => ({
  serverLogger: {
    withContext: () => ({
      info: vi.fn(),
      warn: vi.fn(),
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

vi.mock('@/services/file/file.service', () => ({
  getFileAsDataUrl: vi.fn().mockResolvedValue({
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
  }),
}));

// Mock navigator.clipboard
const mockClipboard = {
  write: vi.fn().mockResolvedValue(undefined),
  writeText: vi.fn().mockResolvedValue(undefined),
  read: vi.fn().mockResolvedValue([]),
  readText: vi.fn().mockResolvedValue(''),
};

Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: mockClipboard,
  },
  writable: true,
});

// Mock ClipboardItem
global.ClipboardItem = vi.fn().mockImplementation((data) => ({ data }));

// Mock Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  content,
  type: options?.type || 'text/plain',
}));

// Mock atob
global.atob = vi.fn().mockImplementation((str) => str);

describe('ClipboardManager', () => {
  let clipboardManager: ClipboardManager;
  let mockItems: AnyEntityWithStats[];

  beforeEach(() => {
    clipboardManager = new ClipboardManager();
    vi.clearAllMocks();

    // Create mock items
    mockItems = [
      {
        id: '1',
        name: 'test-image.png',
        path: '/path/to/test-image.png',
        size: 1024,
        type: FileType.IMAGE,
        isReadonly: false,
        entityType: 'image',
        stats: {
          formattedSize: '1 KB',
          typeLabel: 'Image',
          iconName: 'image',
          colorCode: '#3b82f6',
          daysSinceModified: 0,
          daysSinceAccessed: 0,
          isRecent: true,
          isLarge: false,
          formattedModifiedAt: '2025-01-27',
          childCount: 0,
          shortPath: 'test-image.png',
        },
      } as AnyEntityWithStats,
      {
        id: '2',
        name: 'document.pdf',
        path: '/path/to/document.pdf',
        size: 2048,
        type: FileType.DOCUMENT,
        isReadonly: false,
        entityType: 'document',
        stats: {
          formattedSize: '2 KB',
          typeLabel: 'Document',
          iconName: 'document',
          colorCode: '#ef4444',
          daysSinceModified: 1,
          daysSinceAccessed: 1,
          isRecent: true,
          isLarge: false,
          formattedModifiedAt: '2025-01-26',
          childCount: 0,
          shortPath: 'document.pdf',
        },
      } as AnyEntityWithStats,
    ];
  });

  describe('copy', () => {
    it('should copy items to clipboard successfully', async () => {
      await clipboardManager.copy(mockItems);

      const clipboardData = clipboardManager.getClipboardData();
      expect(clipboardData).not.toBeNull();
      expect(clipboardData?.operation).toBe('copy');
      expect(clipboardData?.items).toHaveLength(2);
      expect(clipboardData?.items[0].name).toBe('test-image.png');
    });

    it('should integrate with system clipboard', async () => {
      await clipboardManager.copy(mockItems);

      expect(mockClipboard.write).toHaveBeenCalled();
    });

    it('should handle single image copy with system clipboard integration', async () => {
      const imageItem = [mockItems[0]]; // Only the image item
      await clipboardManager.copy(imageItem);

      expect(mockClipboard.write).toHaveBeenCalled();
      const clipboardData = clipboardManager.getClipboardData();
      expect(clipboardData?.formats).toContain(ClipboardFormat.IMAGE);
    });

    it('should validate items before copying', async () => {
      const invalidItems = [
        {
          id: '',
          name: 'invalid-item',
          path: '',
        } as AnyEntityWithStats,
      ];

      await expect(clipboardManager.copy(invalidItems)).rejects.toThrow();
    });

    it('should handle empty items array', async () => {
      await expect(clipboardManager.copy([])).rejects.toThrow();
    });
  });

  describe('cut', () => {
    it('should cut items to clipboard successfully', async () => {
      await clipboardManager.cut(mockItems);

      const clipboardData = clipboardManager.getClipboardData();
      expect(clipboardData).not.toBeNull();
      expect(clipboardData?.operation).toBe('cut');
      expect(clipboardData?.items).toHaveLength(2);
    });

    it('should reject readonly items for cut operation', async () => {
      const readonlyItems = [
        {
          ...mockItems[0],
          isReadonly: true,
        },
      ];

      await expect(clipboardManager.cut(readonlyItems)).rejects.toThrow();
    });

    it('should allow cut for non-readonly items', async () => {
      const nonReadonlyItems = mockItems.filter(item => !item.isReadonly);
      await clipboardManager.cut(nonReadonlyItems);

      const clipboardData = clipboardManager.getClipboardData();
      expect(clipboardData?.operation).toBe('cut');
    });
  });

  describe('canPaste', () => {
    it('should return false when clipboard is empty', () => {
      expect(clipboardManager.canPaste()).toBe(false);
    });

    it('should return true when clipboard has valid items', async () => {
      await clipboardManager.copy(mockItems);
      expect(clipboardManager.canPaste()).toBe(true);
    });

    it('should return false after clearing clipboard', async () => {
      await clipboardManager.copy(mockItems);
      clipboardManager.clear();
      expect(clipboardManager.canPaste()).toBe(false);
    });
  });

  describe('getClipboardDataInFormat', () => {
    beforeEach(async () => {
      await clipboardManager.copy(mockItems);
    });

    it('should generate text representation', async () => {
      const textData = await clipboardManager.getClipboardDataInFormat(ClipboardFormat.TEXT);
      expect(textData).toContain('Copied 2 item(s)');
      expect(textData).toContain('test-image.png');
      expect(textData).toContain('document.pdf');
    });

    it('should generate HTML representation', async () => {
      const htmlData = await clipboardManager.getClipboardDataInFormat(ClipboardFormat.HTML);
      expect(htmlData).toContain('<div class="clipboard-data">');
      expect(htmlData).toContain('<h3>Copied 2 item(s)</h3>');
      expect(htmlData).toContain('test-image.png');
    });

    it('should generate JSON representation', async () => {
      const jsonData = await clipboardManager.getClipboardDataInFormat(ClipboardFormat.JSON);
      expect(jsonData).toBeTruthy();
      const parsed = JSON.parse(jsonData!);
      expect(parsed.items).toHaveLength(2);
      expect(parsed.operation).toBe('copy');
    });

    it('should generate URI list representation', async () => {
      const uriData = await clipboardManager.getClipboardDataInFormat(ClipboardFormat.URI_LIST);
      expect(uriData).toContain('file:///path/to/test-image.png');
      expect(uriData).toContain('file:///path/to/document.pdf');
    });

    it('should return null for unsupported format', async () => {
      const result = await clipboardManager.getClipboardDataInFormat('unsupported' as ClipboardFormat);
      expect(result).toBeNull();
    });
  });

  describe('validateClipboard', () => {
    it('should return invalid when clipboard is empty', () => {
      const validation = clipboardManager.validateClipboard();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No clipboard data available');
    });

    it('should return valid when clipboard has valid data', async () => {
      await clipboardManager.copy(mockItems);
      const validation = clipboardManager.validateClipboard();
      expect(validation.isValid).toBe(true);
      expect(validation.supportedOperations).toContain('copy');
      expect(validation.supportedOperations).toContain('paste');
    });
  });

  describe('system clipboard options', () => {
    it('should update system clipboard options', () => {
      const newOptions = {
        includeImages: false,
        maxImageSize: 5 * 1024 * 1024, // 5MB
      };

      clipboardManager.updateSystemClipboardOptions(newOptions);
      const options = clipboardManager.getSystemClipboardOptions();

      expect(options.includeImages).toBe(false);
      expect(options.maxImageSize).toBe(5 * 1024 * 1024);
    });

    it('should maintain other options when updating', () => {
      const originalOptions = clipboardManager.getSystemClipboardOptions();

      clipboardManager.updateSystemClipboardOptions({
        includeImages: false,
      });

      const updatedOptions = clipboardManager.getSystemClipboardOptions();
      expect(updatedOptions.includeText).toBe(originalOptions.includeText);
      expect(updatedOptions.includeHtml).toBe(originalOptions.includeHtml);
      expect(updatedOptions.includeImages).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear clipboard data', async () => {
      await clipboardManager.copy(mockItems);
      expect(clipboardManager.getClipboardData()).not.toBeNull();

      clipboardManager.clear();
      expect(clipboardManager.getClipboardData()).toBeNull();
      expect(clipboardManager.canPaste()).toBe(false);
    });
  });

  describe('metadata generation', () => {
    it('should calculate correct metadata for clipboard data', async () => {
      await clipboardManager.copy(mockItems);
      const clipboardData = clipboardManager.getClipboardData();

      expect(clipboardData?.metadata.totalSize).toBe(3072); // 1024 + 2048
      expect(clipboardData?.metadata.fileTypes).toContain(FileType.IMAGE);
      expect(clipboardData?.metadata.fileTypes).toContain(FileType.DOCUMENT);
      expect(clipboardData?.metadata.canPasteToFileSystem).toBe(true);
    });

    it('should include image format for image items within size limit', async () => {
      const imageItem = [mockItems[0]]; // Small image item
      await clipboardManager.copy(imageItem);

      const clipboardData = clipboardManager.getClipboardData();
      expect(clipboardData?.formats).toContain(ClipboardFormat.IMAGE);
    });

    it('should exclude image format for large images', async () => {
      const largeImageItem = [{
        ...mockItems[0],
        size: 20 * 1024 * 1024, // 20MB, larger than default 10MB limit
      }];

      await clipboardManager.copy(largeImageItem);
      const clipboardData = clipboardManager.getClipboardData();
      expect(clipboardData?.formats).not.toContain(ClipboardFormat.IMAGE);
    });
  });

  describe('error handling', () => {
    it('should handle system clipboard write errors gracefully', async () => {
      mockClipboard.write.mockRejectedValueOnce(new Error('Clipboard write failed'));

      // Should not throw error, just log warning
      await expect(clipboardManager.copy(mockItems)).resolves.not.toThrow();
    });

    it('should handle invalid clipboard data format generation', async () => {
      await clipboardManager.copy(mockItems);

      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('JSON error');
      });

      const result = await clipboardManager.getClipboardDataInFormat(ClipboardFormat.JSON);
      expect(result).toBeNull();

      // Restore original function
      JSON.stringify = originalStringify;
    });
  });
});