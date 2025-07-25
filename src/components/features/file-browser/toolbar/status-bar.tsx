import { memo, useMemo } from 'react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { EntityStatsType } from '@/types/migration';

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
			[EntityStatsType.IMAGE]: { singular: 'imagen', plural: 'imágenes' },
			[EntityStatsType.VIDEO]: { singular: 'video', plural: 'videos' },
			[EntityStatsType.TAG]: { singular: 'etiqueta', plural: 'etiquetas' },
			[EntityStatsType.CHARACTER]: { singular: 'personaje', plural: 'personajes' },
			[EntityStatsType.PLACE]: { singular: 'lugar', plural: 'lugares' },
			[EntityStatsType.WORLD_ITEM]: { singular: 'elemento de mundo', plural: 'elementos de mundo' },
			[EntityStatsType.CONCEPT]: { singular: 'concepto', plural: 'conceptos' },
			[EntityStatsType.PROMPT]: { singular: 'prompt', plural: 'prompts' },
			[EntityStatsType.NOTE]: { singular: 'nota', plural: 'notas' },
			[EntityStatsType.WILDCARD]: { singular: 'wildcard', plural: 'wildcards' },
			[EntityStatsType.PROPERTY]: { singular: 'propiedad', plural: 'propiedades' },
			[EntityStatsType.GROUP]: { singular: 'grupo', plural: 'grupos' },
			[EntityStatsType.FOLDER]: { singular: 'carpeta', plural: 'carpetas' },
			[EntityStatsType.AUDIO]: { singular: 'audio', plural: 'audios' },
			[EntityStatsType.DOCUMENT]: { singular: 'documento', plural: 'documentos' },
			[EntityStatsType.COLLECTION]: { singular: 'colección', plural: 'colecciones' },
			[EntityStatsType.ALBUM]: { singular: 'álbum', plural: 'álbumes' },
		};

		return names[entityType] || { singular: 'elemento', plural: 'elementos' };
	}, [entityType]);

	const isFiltered = !!searchQuery;
	const itemsLabel = totalItems === 1 ? entityName.singular : entityName.plural;

	return (
		<div className="border-t bg-background p-2 text-xs text-muted-foreground flex justify-between">
			<div>
				{isFiltered ? 'Filtrado: ' : 'Total: '}
				{totalItems} {itemsLabel}
			</div>

			{selectedCount > 0 && <div>Seleccionados: {selectedCount}</div>}

			<div>{new Date().toLocaleTimeString()}</div>
		</div>
	);
});
