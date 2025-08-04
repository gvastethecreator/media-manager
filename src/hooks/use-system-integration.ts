/**
 * System Integration Hook
 *
 * Provides integration with the native file system explorer,
 * including file associations, context menu integration, and system notifications.
 */

import { useCallback, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { AnyEntityWithStats } from '@/types/entities';

// File System Access API types
interface FilePickerAcceptType {
	description?: string;
	accept: Record<string, string | string[]>;
}

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: FilePickerAcceptType[];
	excludeAcceptAllOption?: boolean;
}

interface OpenFilePickerOptions {
	multiple?: boolean;
	types?: FilePickerAcceptType[];
	excludeAcceptAllOption?: boolean;
}

const logger = clientLogger.withContext('SystemIntegration');

interface SystemIntegrationOptions {
	enableFileAssociations?: boolean;
	enableContextMenu?: boolean;
	enableSystemNotifications?: boolean;
	enableClipboardIntegration?: boolean;
}

interface SystemCapabilities {
	hasFileSystemAccess: boolean;
	hasClipboardAccess: boolean;
	hasNotificationAccess: boolean;
	canShowDirectoryPicker: boolean;
	canShowSaveFilePicker: boolean;
	canShowOpenFilePicker: boolean;
}

interface UseSystemIntegrationReturn {
	capabilities: SystemCapabilities;
	isSupported: boolean;

	// File system operations
	openInExplorer: (path: string) => Promise<boolean>;
	selectInExplorer: (path: string) => Promise<boolean>;
	openWithDefaultApp: (path: string) => Promise<boolean>;

	// Directory operations
	showDirectoryPicker: () => Promise<FileSystemDirectoryHandle | null>;
	showSaveFilePicker: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle | null>;
	showOpenFilePicker: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[] | null>;

	// Clipboard operations
	copyToClipboard: (items: AnyEntityWithStats[]) => Promise<boolean>;
	pasteFromClipboard: () => Promise<File[] | null>;

	// System notifications
	showSystemNotification: (title: string, options?: NotificationOptions) => Promise<boolean>;

	// File associations
	registerFileHandler: (extension: string, handler: (file: File) => void) => boolean;
	unregisterFileHandler: (extension: string) => boolean;
}

export const useSystemIntegration = (options: SystemIntegrationOptions = {}): UseSystemIntegrationReturn => {
	const [capabilities, setCapabilities] = useState<SystemCapabilities>({
		hasFileSystemAccess: false,
		hasClipboardAccess: false,
		hasNotificationAccess: false,
		canShowDirectoryPicker: false,
		canShowSaveFilePicker: false,
		canShowOpenFilePicker: false,
	});

	const [isSupported, setIsSupported] = useState(false);
	const [fileHandlers] = useState(new Map<string, (file: File) => void>());

	/**
	 * Check system capabilities
	 */
	const checkCapabilities = useCallback(async () => {
		const newCapabilities: SystemCapabilities = {
			hasFileSystemAccess: 'showDirectoryPicker' in window,
			hasClipboardAccess: 'navigator' in window && 'clipboard' in navigator,
			hasNotificationAccess: 'Notification' in window,
			canShowDirectoryPicker: 'showDirectoryPicker' in window,
			canShowSaveFilePicker: 'showSaveFilePicker' in window,
			canShowOpenFilePicker: 'showOpenFilePicker' in window,
		};

		setCapabilities(newCapabilities);
		setIsSupported(
			newCapabilities.hasFileSystemAccess || newCapabilities.hasClipboardAccess || newCapabilities.hasNotificationAccess
		);

		logger.info('System capabilities detected:', newCapabilities);
	}, []);

	/**
	 * Open file or folder in system explorer
	 */
	const openInExplorer = useCallback(async (path: string): Promise<boolean> => {
		try {
			// For web applications, we can't directly open the system explorer
			// This would typically be handled by an Electron app or browser extension

			// Fallback: try to open as URL if it's a web path
			if (path.startsWith('http')) {
				window.open(path, '_blank');
				return true;
			}

			// For local files, show a message to the user
			toastService.info(`To open in explorer: ${path}`, {
				duration: 5000,
				action: {
					label: 'Copy Path',
					onClick: () => navigator.clipboard?.writeText(path),
				},
			});

			return false;
		} catch (error) {
			logger.error('Failed to open in explorer:', error);
			return false;
		}
	}, []);

	/**
	 * Select file in system explorer
	 */
	const selectInExplorer = useCallback(
		async (path: string): Promise<boolean> => {
			// Similar to openInExplorer, but would select the specific file
			return openInExplorer(path);
		},
		[openInExplorer]
	);

	/**
	 * Open file with default system application
	 */
	const openWithDefaultApp = useCallback(async (path: string): Promise<boolean> => {
		try {
			if (path.startsWith('http')) {
				window.open(path, '_blank');
				return true;
			}

			// For local files, create a download link
			const link = document.createElement('a');
			link.href = path;
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			return true;
		} catch (error) {
			logger.error('Failed to open with default app:', error);
			return false;
		}
	}, []);

	/**
	 * Show directory picker dialog
	 */
	const showDirectoryPicker = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
		if (!capabilities.canShowDirectoryPicker) {
			toastService.error('Directory picker not supported in this browser');
			return null;
		}

		try {
			const dirHandle = await (window as any).showDirectoryPicker();
			logger.info('Directory selected:', dirHandle.name);
			return dirHandle;
		} catch (error) {
			if ((error as Error).name !== 'AbortError') {
				logger.error('Failed to show directory picker:', error);
				toastService.error('Failed to open directory picker');
			}
			return null;
		}
	}, [capabilities.canShowDirectoryPicker]);

	/**
	 * Show save file picker dialog
	 */
	const showSaveFilePicker = useCallback(
		async (options?: SaveFilePickerOptions): Promise<FileSystemFileHandle | null> => {
			if (!capabilities.canShowSaveFilePicker) {
				toastService.error('Save file picker not supported in this browser');
				return null;
			}

			try {
				const fileHandle = await (window as any).showSaveFilePicker(options);
				logger.info('Save location selected:', fileHandle.name);
				return fileHandle;
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					logger.error('Failed to show save file picker:', error);
					toastService.error('Failed to open save dialog');
				}
				return null;
			}
		},
		[capabilities.canShowSaveFilePicker]
	);

	/**
	 * Show open file picker dialog
	 */
	const showOpenFilePicker = useCallback(
		async (options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[] | null> => {
			if (!capabilities.canShowOpenFilePicker) {
				toastService.error('Open file picker not supported in this browser');
				return null;
			}

			try {
				const fileHandles = await (window as any).showOpenFilePicker(options);
				logger.info(`${fileHandles.length} files selected`);
				return fileHandles;
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					logger.error('Failed to show open file picker:', error);
					toastService.error('Failed to open file dialog');
				}
				return null;
			}
		},
		[capabilities.canShowOpenFilePicker]
	);

	/**
	 * Copy items to system clipboard
	 */
	const copyToClipboard = useCallback(
		async (items: AnyEntityWithStats[]): Promise<boolean> => {
			if (!capabilities.hasClipboardAccess) {
				toastService.error('Clipboard access not available');
				return false;
			}

			try {
				// Create clipboard data
				const clipboardData = items.map((item) => ({
					id: item.id,
					name: item.name,
					path: 'path' in item ? item.path : '',
					type: item.entityType,
				}));

				await navigator.clipboard.writeText(JSON.stringify(clipboardData, null, 2));

				toastService.success(`Copied ${items.length} items to clipboard`);
				logger.info(`Copied ${items.length} items to clipboard`);

				return true;
			} catch (error) {
				logger.error('Failed to copy to clipboard:', error);
				toastService.error('Failed to copy to clipboard');
				return false;
			}
		},
		[capabilities.hasClipboardAccess]
	);

	/**
	 * Paste files from system clipboard
	 */
	const pasteFromClipboard = useCallback(async (): Promise<File[] | null> => {
		if (!capabilities.hasClipboardAccess) {
			toastService.error('Clipboard access not available');
			return null;
		}

		try {
			const clipboardItems = await navigator.clipboard.read();
			const files: File[] = [];

			for (const item of clipboardItems) {
				for (const type of item.types) {
					if (type.startsWith('image/') || type.startsWith('text/') || type.startsWith('application/')) {
						const blob = await item.getType(type);
						const file = new File([blob], `clipboard-${Date.now()}`, { type });
						files.push(file);
					}
				}
			}

			if (files.length > 0) {
				logger.info(`Pasted ${files.length} files from clipboard`);
				toastService.success(`Pasted ${files.length} files from clipboard`);
			}

			return files.length > 0 ? files : null;
		} catch (error) {
			logger.error('Failed to paste from clipboard:', error);
			toastService.error('Failed to paste from clipboard');
			return null;
		}
	}, [capabilities.hasClipboardAccess]);

	/**
	 * Show system notification
	 */
	const showSystemNotification = useCallback(
		async (title: string, options?: NotificationOptions): Promise<boolean> => {
			if (!capabilities.hasNotificationAccess) {
				return false;
			}

			try {
				// Request permission if needed
				if (Notification.permission === 'default') {
					const permission = await Notification.requestPermission();
					if (permission !== 'granted') {
						return false;
					}
				}

				if (Notification.permission === 'granted') {
					new Notification(title, {
						icon: '/favicon.ico',
						badge: '/favicon.ico',
						...options,
					});
					return true;
				}

				return false;
			} catch (error) {
				logger.error('Failed to show system notification:', error);
				return false;
			}
		},
		[capabilities.hasNotificationAccess]
	);

	/**
	 * Register file handler for specific extension
	 */
	const registerFileHandler = useCallback(
		(extension: string, handler: (file: File) => void): boolean => {
			try {
				fileHandlers.set(extension.toLowerCase(), handler);
				logger.info(`Registered file handler for ${extension}`);
				return true;
			} catch (error) {
				logger.error(`Failed to register file handler for ${extension}:`, error);
				return false;
			}
		},
		[fileHandlers]
	);

	/**
	 * Unregister file handler
	 */
	const unregisterFileHandler = useCallback(
		(extension: string): boolean => {
			try {
				const removed = fileHandlers.delete(extension.toLowerCase());
				if (removed) {
					logger.info(`Unregistered file handler for ${extension}`);
				}
				return removed;
			} catch (error) {
				logger.error(`Failed to unregister file handler for ${extension}:`, error);
				return false;
			}
		},
		[fileHandlers]
	);

	// Initialize capabilities on mount
	useEffect(() => {
		checkCapabilities();
	}, [checkCapabilities]);

	// Handle file drops and file input changes
	useEffect(() => {
		const handleFileInput = (event: Event) => {
			const input = event.target as HTMLInputElement;
			if (input.files) {
				Array.from(input.files).forEach((file) => {
					const extension = file.name.split('.').pop()?.toLowerCase();
					if (extension && fileHandlers.has(extension)) {
						const handler = fileHandlers.get(extension);
						handler?.(file);
					}
				});
			}
		};

		document.addEventListener('change', handleFileInput);
		return () => document.removeEventListener('change', handleFileInput);
	}, [fileHandlers]);

	return {
		capabilities,
		isSupported,
		openInExplorer,
		selectInExplorer,
		openWithDefaultApp,
		showDirectoryPicker,
		showSaveFilePicker,
		showOpenFilePicker,
		copyToClipboard,
		pasteFromClipboard,
		showSystemNotification,
		registerFileHandler,
		unregisterFileHandler,
	};
};

export default useSystemIntegration;
