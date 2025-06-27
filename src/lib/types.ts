export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	totalImages: number;
	createdAt: Date;
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
	width: number;
	height: number;
	format: string;
	size: number;
	colorSpace?: string;
	hasAlpha?: boolean;
	orientation?: number;
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
}

export interface FileOperationError {
	code: string;
	message: string;
	details?: Record<string, string | number | boolean | null | undefined>;
}

export interface FileOperationResult {
	success: boolean;
	error?: FileOperationError;
	data?: Record<string, unknown>;
}

export interface FileUploadProgress {
	fileId: string;
	progress: number;
	status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
	error?: FileOperationError;
}

export interface FileSelectionState {
	selectedIds: string[];
	lastSelected?: string;
	selectionMode: 'none' | 'single' | 'multiple';
}

export interface ViewState {
	currentView: 'grid' | 'list';
	thumbnailSize: 'small' | 'medium' | 'large';
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
	filterTags: string[];
	filterCollections: string[];
	searchTerm: string;
}

export interface DragState {
	isDragging: boolean;
	draggedIds: string[];
	dragOverId?: string;
	dropTarget?: 'collection' | 'folder' | 'tag';
	dropTargetId?: string;
}

export interface ContextMenuState {
	isOpen: boolean;
	x: number;
	y: number;
	targetId?: string;
	targetType?: 'file' | 'collection' | 'folder' | 'tag';
}

export interface ModalState {
	isOpen: boolean;
	type: 'create' | 'edit' | 'delete' | 'move' | 'copy';
	targetId?: string;
	targetType?: 'file' | 'collection' | 'folder' | 'tag';
}

export interface ToastState {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}
