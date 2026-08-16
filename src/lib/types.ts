export interface User {
	avatar?: string;
	createdAt: Date;
	email: string;
	id: string;
	name: string;
	totalImages: number;
	updatedAt: Date;
}

// Collection types moved to @/types/entities/collection/types.ts
// Use: import { CollectionBase, CollectionWithStats } from '@/types/entities/collection/types';

// Folder types moved to @/types/entities/folder/types.ts
// Use: import { FolderBase, FolderWithStats } from '@/types/entities/folder/types';

// Tag types moved to @/types/entities/tag/types.ts
// Use: import { TagBase, TagWithStats } from '@/types/entities/tag/types';

// Settings types moved to @/types/settings.ts (global) and @/types/ui/ (interface)
// Use: import { Settings } from '@/types/settings';
// Use: import { InterfacePreferences } from '@/types/ui/types';

export interface ImageMetadata {
	colorSpace?: string;
	exif?: {
		make?: string;
		model?: string;
		dateTime?: string;
		exposureTime?: string;
		fNumber?: number;
		iso?: number;
		focalLength?: number;
		gps?: {
			latitude: number;
			longitude: number;
			altitude?: number;
		};
	};
	format: string;
	hasAlpha?: boolean;
	height: number;
	orientation?: number;
	size: number;
	width: number;
}

export interface FileOperationError {
	code: string;
	details?: Record<string, string | number | boolean | null | undefined>;
	message: string;
}

export interface FileOperationResult {
	data?: Record<string, unknown>;
	error?: FileOperationError;
	success: boolean;
}

export interface FileUploadProgress {
	error?: FileOperationError;
	fileId: string;
	progress: number;
	status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
}

export interface FileSelectionState {
	lastSelected?: string;
	selectedIds: string[];
	selectionMode: 'none' | 'single' | 'multiple';
}

export interface ViewState {
	currentView: 'grid' | 'list';
	filterCollections: string[];
	filterTags: string[];
	searchTerm: string;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
	thumbnailSize: 'none' | 'small' | 'medium' | 'large';
}

export interface DragState {
	draggedIds: string[];
	dragOverId?: string;
	dropTarget?: 'collection' | 'folder' | 'tag';
	dropTargetId?: string;
	isDragging: boolean;
}

export interface ContextMenuState {
	isOpen: boolean;
	targetId?: string;
	targetType?: 'file' | 'collection' | 'folder' | 'tag';
	x: number;
	y: number;
}

export interface ModalState {
	isOpen: boolean;
	targetId?: string;
	targetType?: 'file' | 'collection' | 'folder' | 'tag';
	type: 'create' | 'edit' | 'delete' | 'move' | 'copy';
}

export interface ToastState {
	action?: {
		label: string;
		onClick: () => void;
	};
	duration?: number;
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
}
