import type { FileItem } from '@/types/file-item';
import type { LucideIcon } from 'lucide-react';

/**
 * Props base para todas las vistas de contenido
 */
export interface BaseContentProps {
	/**
	 * Los items a mostrar en la vista
	 */
	items?: FileItem[];

	/**
	 * Estado de carga de la vista
	 */
	isLoading?: boolean;

	/**
	 * Error en la vista, si existe
	 */
	error?: string | null;

	/**
	 * Función para alternar la selección de un item
	 */
	toggleItemSelection?: (item: FileItem, isMultiSelect: boolean) => void;

	/**
	 * ID del contenedor actual (folder, collection, etc)
	 */
	currentContainerId?: string | null;

	/**
	 * Nombre del contenedor actual
	 */
	containerName?: string | null;

	/**
	 * Función para establecer el contenedor actual
	 */
	setCurrentContainer?: (id: string) => Promise<void>;

	/**
	 * Configuración personalizada para el estado vacío
	 */
	emptyState?: {
		icon?: LucideIcon;
		title?: string;
		description?: string;
	};

	/**
	 * Clase CSS adicional para el contenedor
	 */
	className?: string;

	/**
	 * Función para recargar los items de la vista
	 */
	onRefresh?: () => Promise<void>;
}

/**
 * Props específicas para vistas de carpetas
 */
export interface FolderContentProps extends BaseContentProps {
	/**
	 * Función para reindexar la carpeta actual
	 */
	reindexFolder?: (id: string) => Promise<void>;
}

/**
 * Props específicas para vistas de colecciones
 */
export interface CollectionContentProps extends BaseContentProps {
	/**
	 * Función para agregar imágenes a la colección
	 */
	addImagesToCollection?: (imageIds: string[]) => Promise<void>;
}

/**
 * Props específicas para vistas de álbumes
 */
export interface AlbumContentProps extends BaseContentProps {
	/**
	 * Función para agregar imágenes al álbum
	 */
	addImagesToAlbum?: (imageIds: string[]) => Promise<void>;
}

/**
 * Props específicas para vistas de personajes
 */
export interface CharacterContentProps extends BaseContentProps {
	/**
	 * Función para agregar imágenes al personaje
	 */
	addImagesToCharacter?: (imageIds: string[]) => Promise<void>;
}

/**
 * Props específicas para vistas de lugares
 */
export interface PlaceContentProps extends BaseContentProps {
	/**
	 * Función para agregar imágenes al lugar
	 */
	addImagesToPlace?: (imageIds: string[]) => Promise<void>;
}

/**
 * Props específicas para vistas de objetos
 */
export interface ObjectContentProps extends BaseContentProps {
	/**
	 * Función para agregar imágenes al objeto
	 */
	addImagesToObject?: (imageIds: string[]) => Promise<void>;
}

/**
 * Props específicas para vistas de etiquetas
 */
export interface TagContentProps extends BaseContentProps {
	/**
	 * Función para agregar imágenes a la etiqueta
	 */
	addImagesToTag?: (imageIds: string[]) => Promise<void>;
}
