'use client';

import { clientEvents } from '@/lib/client/events.client';
import type { EventType } from '@/lib/server/events.server';
import { ActivityService } from '@/services/activity.service';
import { useFileManager } from '@/store/file-manager.store';
import type { FileItem } from '@/types/file-item';
import type React from 'react';
import { createContext, useCallback, useContext } from 'react';

interface FileContextType {
	currentItems: FileItem[];
	selectedItems: FileItem[];
	isLoading: boolean;
	handleSelectItem: (item: FileItem) => void;
	toggleItemSelection: (item: FileItem, multiSelect?: boolean) => void;
	clearSelection: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
	const {
		currentItems,
		selectedItems,
		isLoading,
		selectItem: baseHandleSelectItem,
		toggleItemSelection: baseToggleItemSelection,
		clearSelection,
	} = useFileManager();

	// Usamos el hook de eventos optimistas del cliente
	const [_optimisticState, addEvent] = clientEvents.useEvents({});

	const handleSelectItem = useCallback(
		async (item: FileItem) => {
			baseHandleSelectItem(item);

			// Registrar actividad de vista
			await ActivityService.logActivity({
				type: 'view',
				description: `Vista de ${item.name}`,
				imageId: item.id,
			});
		},
		[baseHandleSelectItem]
	);

	const toggleItemSelection = useCallback(
		(item: FileItem, multiSelect = false) => {
			baseToggleItemSelection(item, multiSelect);

			// Emitir evento de actualización si es necesario
			if (item.collections?.length) {
				addEvent({ type: 'collections:modified', data: { item } });
			}
			if (item.tags?.length) {
				addEvent({ type: 'tags:modified', data: { item } });
			}
			if (item.characters?.length) {
				addEvent({ type: 'characters:modified', data: { item } });
			}
			if (item.places?.length) {
				addEvent({ type: 'places:modified', data: { item } });
			}
			if (item.objects?.length) {
				addEvent({ type: 'objects:modified', data: { item } });
			}
			if (item.isFavorite) {
				addEvent({ type: 'favorites:modified', data: { item } });
			}
		},
		[baseToggleItemSelection, addEvent]
	);

	const _handleToggleSelection = useCallback(
		(item: FileItem, isMultiSelect: boolean) => {
			toggleItemSelection(item, isMultiSelect);
			addEvent({ type: 'files:modified', data: { item } });
		},
		[toggleItemSelection, addEvent]
	);

	const value = {
		currentItems,
		selectedItems,
		isLoading,
		handleSelectItem,
		toggleItemSelection,
		clearSelection,
	};

	return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFiles() {
	const context = useContext(FileContext);
	if (context === undefined) {
		throw new Error('useFiles must be used within a FileProvider');
	}
	return context;
}
