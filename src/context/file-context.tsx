"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useFileManager } from "@/store/file-manager.store";
import type { FileItem } from "@/types/file-item";
import { ActivityService } from "@/services/activity.service";
import {
	eventsService,
	type CacheInvalidationEvent,
} from "@/services/events.service";

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

	const handleSelectItem = useCallback(
		async (item: FileItem) => {
			baseHandleSelectItem(item);

			// Registrar actividad de vista
			await ActivityService.logActivity({
				type: "view",
				description: `Vista de ${item.name}`,
				imageId: item.id,
			});

		},
		[baseHandleSelectItem]
	);

	const toggleItemSelection = useCallback(
		(item: FileItem, multiSelect: boolean = false) => {
			baseToggleItemSelection(item, multiSelect);

			// Emitir evento de actualización si es necesario
			const events: CacheInvalidationEvent[] = [];
			if (item.collections?.length) events.push("collections:modified");
			if (item.tags?.length) events.push("tags:modified");
			if (item.characters?.length) events.push("characters:modified");
			if (item.places?.length) events.push("places:modified");
			if (item.objects?.length) events.push("objects:modified");
			if (item.isFavorite) events.push("favorites:modified");

			if (events.length > 0) {
				events.forEach((event) => eventsService.emit(event));
			}
		},
		[baseToggleItemSelection]
	);

	const handleToggleSelection = useCallback(
		(item: FileItem, isMultiSelect: boolean) => {
			toggleItemSelection(item, isMultiSelect);
			eventsService.emit("files:modified");
		},
		[toggleItemSelection]
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
		throw new Error("useFiles must be used within a FileProvider");
	}
	return context;
}
