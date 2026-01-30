/**
 * Interfaz básica para las propiedades de los componentes de vista
 *
 * Esta interfaz define las propiedades comunes que pueden recibir
 * los componentes de vista en la aplicación.
 */
export interface ViewProps {
	/**
	 * Clase CSS adicional para personalizar la vista
	 */
	className?: string;
	/**
	 * Indica si la vista es visible
	 */
	isVisible?: boolean;
	/**
	 * ID del favorito seleccionado
	 */
	selectedFavoriteId?: string;
	/**
	 * Función para establecer el ID del favorito seleccionado
	 */
	setSelectedFavoriteId?: (id: string) => void;
}

/**
 * Enumeración de los tipos de vista disponibles en la aplicación
 *
 * Esta enumeración define todos los posibles valores para el estado
 * currentView en el NavigationStore.
 */
export type ViewType =
	| '' // Ruta raíz (dashboard)
	| 'settings'
	| 'all-images'
	| 'uploaded-images'
	| 'files'
	| 'favorites'
	| 'search'
	| 'collections'
	| 'collection-content'
	| 'folders'
	| 'folder-content'
	| 'canvas'
	| 'chat'
	| 'tags'
	| 'tag-content'
	| 'albums'
	| 'album-content'
	| 'characters'
	| 'character-content'
	| 'places'
	| 'place-content'
	| 'world-items'
	| 'world-item-content'
	| 'concepts'
	| 'concept-content'
	| 'prompts'
	| 'prompt-content'
	| 'notes'
	| 'note-content'
	| 'groups'
	| 'group-content'
	| 'properties'
	| 'property-content'
	| 'wildcards'
	| 'wildcard-content'
	| 'notes'
	| 'note-content'
	| 'properties'
	| 'property-content'
	| 'entity-cards'
	| 'development'
	| 'documents'
	| 'document-content'
	| 'audios'
	| 'audio-content'
	| 'json-files'
	| 'json-file-content'
	| 'file-3ds'
	| 'file-3d-content'
	| 'mixed';
