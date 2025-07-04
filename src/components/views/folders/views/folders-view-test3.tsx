import React from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useFileStoreBase } from '@/store/entities/file';
import type { ViewProps } from '../../types';

export function FoldersViewTest3(_props: ViewProps) {
	const { setCurrentView, setCurrentItem } = useNavigationStore();

	// Probar solo el file store
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);

	return (
		<div className="h-full w-full flex flex-col items-center justify-center p-6">
			<div className="max-w-md w-full bg-card rounded-lg border border-border p-6 text-center">
				<div className="text-6xl mb-4">📁</div>
				<h2 className="text-xl font-semibold mb-2">Vista de Carpetas - Test 3</h2>
				<p className="text-muted-foreground mb-2">Navigation store: {setCurrentView && setCurrentItem ? '✅' : '❌'}</p>
				<p className="text-muted-foreground mb-4">File store: {deselectAllFiles ? '✅' : '❌'}</p>
				<div className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm">
					<div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
					Test solo File Store
				</div>
			</div>
		</div>
	);
}
