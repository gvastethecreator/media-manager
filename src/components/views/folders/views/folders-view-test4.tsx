import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useFolderStore } from '@/store/entities/folder';
import type { ViewProps } from '../../types';

export function FoldersViewTest4(_props: ViewProps) {
	const { setCurrentView, setCurrentItem } = useNavigationStore();

	// Probar solo el folder store
	const { selectFolder, getFolder } = useFolderStore();

	return (
		<div className="h-full w-full flex flex-col items-center justify-center p-6">
			<div className="max-w-md w-full bg-card rounded-lg border border-border p-6 text-center">
				<div className="text-6xl mb-4">📁</div>
				<h2 className="text-xl font-semibold mb-2">Vista de Carpetas - Test 4</h2>
				<p className="text-muted-foreground mb-2">Navigation store: {setCurrentView && setCurrentItem ? '✅' : '❌'}</p>
				<p className="text-muted-foreground mb-4">Folder store: {selectFolder && getFolder ? '✅' : '❌'}</p>
				<div className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded-full text-sm">
					<div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
					Test solo Folder Store
				</div>
			</div>
		</div>
	);
}
