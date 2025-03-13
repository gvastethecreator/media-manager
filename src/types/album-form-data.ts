export interface AlbumFormData {
	/**
	 * Nombre del álbum
	 */
	name: string;

	/**
	 * Descripción del álbum
	 */
	description?: string;

	/**
	 * Emoji representativo
	 */
	emoji?: string;

	/**
	 * Color primario del álbum en formato hexadecimal
	 */
	color?: string;

	/**
	 * Campo por el cual ordenar las imágenes
	 */
	sortBy: string;

	/**
	 * Filtros en formato JSON para las imágenes
	 */
	filters: string;

	/**
	 * Indica si el álbum es favorito
	 */
	isFavorite?: boolean;

	/**
	 * URL del álbum (opcional)
	 */
	url?: string;

	/**
	 * Imagen destacada del álbum
	 */
	featuredImage?: string | null;
}
