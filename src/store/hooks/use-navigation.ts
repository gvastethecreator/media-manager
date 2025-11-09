import { useUnifiedFileManager } from '../unified-file-manager.store';

/**
 * Hook especializado para navegación entre contextos
 */
export const useNavigation = () => {
	const store = useUnifiedFileManager();
	return {
		currentContext: store.currentContext,
		setCurrentFolder: store.setCurrentFolder,
		setCurrentCollection: store.setCurrentCollection,
		setCurrentTag: store.setCurrentTag,
		setCurrentAlbum: store.setCurrentAlbum,
		setCurrentCharacter: store.setCurrentCharacter,
		setCurrentPlace: store.setCurrentPlace,
		setCurrentWorldItem: store.setCurrentWorldItem,
		loadAllImages: store.loadAllImages,
		refreshCurrentContext: store.refreshCurrentContext,
	};
};
