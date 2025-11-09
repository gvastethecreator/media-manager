import { useUnifiedFileManager } from '../unified-file-manager.store';

/**
 * Hook especializado para trabajar con colecciones
 */
export const useCollection = () => {
	const store = useUnifiedFileManager();
	return {
		currentCollection: store.currentCollection,
		setCurrentCollection: store.setCurrentCollection,
		collectionImages: store.currentContext === 'collection' ? store.currentItems : [],
		isLoading: store.isLoading && store.currentContext === 'collection',
	};
};
