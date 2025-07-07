import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useFileStoreBase } from '@/store/entities/file';
import { useFolderStore } from '@/store/entities/folder';
import type { ViewProps } from '../../types';

export function FoldersViewTest2(_props: ViewProps) {
	const { setCurrentView, setCurrentItem } = useNavigationStore();

	// Probar los stores
	const { selectFolder, getFolder } = useFolderStore();
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);

	return (
		<div className="h-full w-full flex flex-col items-center justify-center p-6">
			<div className="max-w-md w-full bg-card rounded-lg border border-border p-6 text-center">
				<div className="text-6xl mb-4">📁</div>
				<h2 className="text-xl font-semibold mb-2">Vista de Carpetas - Test 2</h2>
				<p className="text-muted-foreground mb-2">Navigation store: {setCurrentView && setCurrentItem ? '✅' : '❌'}</p>
				<p className="text-muted-foreground mb-2">Folder store: {selectFolder && getFolder ? '✅' : '❌'}</p>
				<p className="text-muted-foreground mb-4">File store: {deselectAllFiles ? '✅' : '❌'}</p>
				<div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm">
					<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
					Test paso 2 OK
				</div>
			</div>
		</div>
	);
}
