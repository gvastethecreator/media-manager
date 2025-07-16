import { memo, useMemo } from 'react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { EntityStatsType } from '@/types/migration';

interface StatusBarProps {
	totalItems: number;
	selectedCount: number;
	entityType: EntityStatsType;
}

/**
 * Barra de estado para el navegador de archivos
 * Muestra información sobre los elementos seleccionados y el total de elementos
 */
export const StatusBar = memo<StatusBarProps>(function StatusBar({ totalItems, selectedCount, entityType }) {
	const { searchQuery } = useViewOptionsStore();

	// Obtener el nombre plural del tipo de entidad
	const entityName = useMemo(() => {
		const names: Record<EntityStatsType, { singular: string; plural: string }> = {
			image: { singular: 'imagen', plural: 'imágenes' },
			video: { singular: 'video', plural: 'videos' },
			collection: { singular: 'colección', plural: 'colecciones' },
			tag: { singular: 'etiqueta', plural: 'etiquetas' },
			character: { singular: 'personaje', plural: 'personajes' },
			place: { singular: 'lugar', plural: 'lugares' },
			worldItem: { singular: 'elemento de mundo', plural: 'elementos de mundo' },
			concept: { singular: 'concepto', plural: 'conceptos' },
			prompt: { singular: 'prompt', plural: 'prompts' },
			note: { singular: 'nota', plural: 'notas' },
			wildcard: { singular: 'wildcard', plural: 'wildcards' },
			property: { singular: 'propiedad', plural: 'propiedades' },
			group: { singular: 'grupo', plural: 'grupos' },
			folder: { singular: 'carpeta', plural: 'carpetas' },
			audio: { singular: 'audio', plural: 'audios' },
			document: { singular: 'documento', plural: 'documentos' },
			jsonFile: { singular: 'archivo JSON', plural: 'archivos JSON' },
			file3d: { singular: 'archivo 3D', plural: 'archivos 3D' },
			uploadedImage: { singular: 'imagen subida', plural: 'imágenes subidas' },
		};

		return names[entityType] || { singular: 'elemento', plural: 'elementos' };
	}, [entityType]);

	const isFiltered = !!searchQuery;
	const itemsLabel = totalItems === 1 ? entityName.singular : entityName.plural;

	return (
		<div className="border-t p-2 text-xs text-muted-foreground flex justify-between">
			<div>
				{isFiltered ? 'Filtrado: ' : 'Total: '}
				{totalItems} {itemsLabel}
			</div>

			{selectedCount > 0 && <div>Seleccionados: {selectedCount}</div>}

			<div>{new Date().toLocaleTimeString()}</div>
		</div>
	);
});
