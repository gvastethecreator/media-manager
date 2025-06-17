'use client';

import { memo, useMemo } from 'react';
import { formatFileSize } from '@/lib/utils/format';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { FileItem } from '@/types/file-item';

interface StatusBarProps {
	items: FileItem[];
}

/**
 * Barra de estado para el navegador de archivos
 * Muestra información sobre los elementos seleccionados y el total de elementos
 */
export const StatusBar = memo<StatusBarProps>(function StatusBar({ items }) {
	const { selectedIds } = useSelectionStore();
	const { searchQuery } = useViewOptionsStore();

	// Calcular estadísticas
	const stats = useMemo(() => {
		const totalItems = items.length;
		const selectedItems = items.filter((item) => selectedIds.includes(item.id));
		const selectedCount = selectedItems.length;

		// Calcular tamaño total de los elementos seleccionados
		const selectedSize = selectedItems.reduce((total, item) => total + (item.size || 0), 0);

		// Calcular tamaño total de todos los elementos
		const totalSize = items.reduce((total, item) => total + (item.size || 0), 0);

		return {
			totalItems,
			selectedCount,
			selectedSize,
			totalSize,
			isFiltered: !!searchQuery,
		};
	}, [items, selectedIds, searchQuery]);

	return (
		<div className="border-t p-2 text-xs text-muted-foreground flex justify-between">
			<div>
				{stats.isFiltered ? 'Filtrado: ' : 'Total: '}
				{stats.totalItems} elementos ({formatFileSize(stats.totalSize)})
			</div>

			{stats.selectedCount > 0 && (
				<div>
					Seleccionados: {stats.selectedCount} ({formatFileSize(stats.selectedSize)})
				</div>
			)}

			<div>{new Date().toLocaleTimeString()}</div>
		</div>
	);
});
