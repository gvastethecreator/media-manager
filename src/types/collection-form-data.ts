export interface CollectionFormData {
	/**
	 * Nombre de la colección
	 */
	name: string;

	/**
	 * Descripción de la colección
	 */
	description: string;

	/**
	 * Emoji representativo de la colección
	 */
	emoji: string;

	/**
	 * Color principal de la colección en formato hexadecimal
	 */
	color: string;

	/**
	 * Filtros en formato JSON
	 */
	filters: string;

	/**
	 * Campo por el cual ordenar los elementos
	 */
	sortBy: string;

	/**
	 * Ediciones disponibles en formato JSON
	 */
	editions: string;

	/**
	 * Indica si la colección es favorita
	 */
	isFavorite: boolean;

	/**
	 * Plataforma asociada a la colección
	 */
	platform?: string;

	/**
	 * Precio de la colección
	 */
	price?: number;

	/**
	 * URL principal de la colección
	 */
	url?: string;

	/**
	 * URL alternativa de la colección
	 */
	alternativeUrl?: string;

	/**
	 * Imagen destacada de la colección
	 */
	featuredImage?: string | null;
}
