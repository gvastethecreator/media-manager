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
}

/**
 * Enumeración de los tipos de vista disponibles en la aplicación
 *
 * Esta enumeración define todos los posibles valores para el estado
 * currentView en el NavigationStore.
 */
export type ViewType =
	| 'dashboard'
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
	| 'workflows'
	| 'workflow-content'
	| 'file-3ds'
	| 'file-3d-content'
	| 'mixed';
