import { useUnifiedFileManager } from '../unified-file-manager.store';

/**
 * Hook especializado para trabajar con carpetas
 */
export const useFolder = () => {
	const store = useUnifiedFileManager();
	return {
		currentFolder: store.currentFolder,
		setCurrentFolder: store.setCurrentFolder,
		folderImages: store.currentContext === 'folder' ? store.currentItems : [],
		isLoading: store.isLoading && store.currentContext === 'folder',
	};
};
