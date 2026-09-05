import { useCallback } from 'react';
import { useFiles } from '@/lib/contexts/file-context';

export function useFileActions() {
	const {
		selectedFiles,
		clearSelection,
		moveFiles,
		removeFiles,
		downloadFiles,
		addToCollection,
		addTags,
		toggleFavorite,
	} = useFiles();

	const handleDelete = useCallback(async () => {
		if (selectedFiles.length === 0) {
			return;
		}
		await removeFiles(selectedFiles);
		clearSelection();
	}, [selectedFiles, removeFiles, clearSelection]);

	const handleMove = useCallback(
		async (targetFolderId: string) => {
			if (selectedFiles.length === 0) {
				return;
			}
			await moveFiles(selectedFiles, targetFolderId);
			clearSelection();
		},
		[selectedFiles, moveFiles, clearSelection]
	);

	const handleDownload = useCallback(async () => {
		if (selectedFiles.length === 0) {
			return;
		}
		await downloadFiles(selectedFiles);
	}, [selectedFiles, downloadFiles]);

	const handleAddToCollection = useCallback(
		(collectionId: string) => {
			if (selectedFiles.length === 0) {
				return;
			}
			addToCollection(selectedFiles, collectionId);
			clearSelection();
		},
		[selectedFiles, addToCollection, clearSelection]
	);

	const handleAddTags = useCallback(
		(tags: string[]) => {
			if (selectedFiles.length === 0) {
				return;
			}
			addTags(selectedFiles, tags);
			clearSelection();
		},
		[selectedFiles, addTags, clearSelection]
	);

	const handleToggleFavorite = useCallback(
		(fileId: string) => {
			toggleFavorite(fileId);
		},
		[toggleFavorite]
	);

	return {
		selectedCount: selectedFiles.length,
		handleDelete,
		handleMove,
		handleDownload,
		handleAddToCollection,
		handleAddTags,
		handleToggleFavorite,
	};
}
