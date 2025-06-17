'use client';

import type { FileItem } from '@/types/file-item';
import { memo, useMemo } from 'react';
import { FileBrowserV2 } from './file-browser-v2';
import { FilterDefinition } from './filters/filter-panel';
import { FileBrowserToolbar } from './toolbar/file-browser-toolbar';

export interface IntegratedFileBrowserProps {
	items: FileItem[];
	onItemSelect?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	className?: string;
	isLoading?: boolean;
	showSearch?: boolean;
	showFilters?: boolean;
	showDetailsToggle?: boolean;
	filters?: FilterDefinition[];
}

/**
 * Componente integrado que combina el FileBrowser con la barra de herramientas
 */
export const IntegratedFileBrowser = memo<IntegratedFileBrowserProps>(function IntegratedFileBrowser({
	items,
	onItemSelect,
	onItemDoubleClick,
	className,
	isLoading = false,
	showSearch = true,
	showFilters = true,
	showDetailsToggle = true,
	filters = []
}) {
	// Extraer todos los IDs para las operaciones de selección
	const allItemIds = useMemo(() => items.map(item => item.id), [items]);

	// Definir filtros predeterminados si no se proporcionan
	const defaultFilters: FilterDefinition[] = useMemo(() => [
		{
			id: 'type',
			type: 'select',
			label: 'Tipo de archivo',
			options: [
				{ value: 'image', label: 'Imágenes' },
				{ value: 'video', label: 'Videos' },
				{ value: 'document', label: 'Documentos' }
			]
		},
		{
			id: 'isFavorite',
			type: 'boolean',
			label: 'Solo favoritos'
		},
		{
			id: 'createdAt',
			type: 'date',
			label: 'Creado después de'
		}
	], []);

	// Usar filtros proporcionados o los predeterminados
	const activeFilters = useMemo(() => {
		return filters.length > 0 ? filters : defaultFilters;
	}, [filters, defaultFilters]);

	return (
		<div className="flex flex-col h-full">
			{/* Barra de herramientas */}
			<FileBrowserToolbar
				allItemIds={allItemIds}
				showSearch={showSearch}
				showFilters={showFilters}
				showDetailsToggle={showDetailsToggle}
				filters={activeFilters}
			/>

			{/* Navegador de archivos */}
			<div className="flex-1 overflow-hidden">
				<FileBrowserV2
					items={items}
					onItemSelect={onItemSelect}
					onItemDoubleClick={onItemDoubleClick}
					className={className}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
});