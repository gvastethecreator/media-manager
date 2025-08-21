import { useImageStore } from '@/store/entities/image';
import { useEffect } from 'react';

export function useFolderFiles(folderId: string | null) {
	const { getImagesByFolder, fetchImages, folderLoadState } = useImageStore();

	const folderState = folderId ? folderLoadState?.[folderId] : undefined;
	const isLoading = folderState?.loading ?? !folderState?.loaded;
	const images = folderId ? getImagesByFolder(folderId) : [];

	useEffect(() => {
		if (folderId && !folderState?.loaded && !folderState?.loading) {
			fetchImages({ folderId });
		}
	}, [folderId, folderState, fetchImages]);

	return {
		images,
		isLoading,
		error: null, // folderState no tiene propiedad de error por ahora
	};
}
