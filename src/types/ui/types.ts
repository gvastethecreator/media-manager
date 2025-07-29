// src/types/ui/types.ts
// Tipos específicos para preferencias de interfaz de usuario
// 📝 Documentado según lineamientos del proyecto

/**
 * 🎨 Tipos específicos para preferencias de interfaz de usuario
 * - Usar estos tipos para configuración de UI, vistas y preferencias visuales.
 * - Validar con Zod antes de persistir datos de interfaz.
 * - Separados de la configuración global del sistema.
 */

/**
 * 🗂️ Store principal de UI para gestión de estado de interfaz
 */
export interface UIStore {
	theme: 'light' | 'dark' | 'auto';
	sidebarCollapsed: boolean;
	viewMode: 'grid' | 'list' | 'masonry' | 'cards';
	gridSize: 'small' | 'medium' | 'large' | 'xl';
	showMetadata: boolean;
	showThumbnails: boolean;
	animationsEnabled: boolean;
	notifications: {
		enabled: boolean;
		position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
		duration: number;
	};
	modals: {
		open: string[];
		data: Record<string, unknown>;
	};
	loading: {
		global: boolean;
		operations: Record<string, boolean>;
	};
	error: string | null;
}

/**
 * Configuración específica para vista Grid
 */
export interface GridViewConfig {
	/** Número mínimo de columnas */
	minColumns: number;
	/** Número máximo de columnas */
	maxColumns: number;
	/** Tamaño base de los elementos */
	itemSize: number;
	/** Espaciado entre elementos */
	gap: number;
	/** Relación de aspecto (width/height) */
	aspectRatio: number;
	/** Mostrar información al hover */
	showInfoOnHover: boolean;
	/** Animaciones de hover */
	enableHoverAnimations: boolean;
}

/**
 * Configuración específica para vista Cards
 */
export interface CardsViewConfig {
	/** Número mínimo de columnas */
	minColumns: number;
	/** Número máximo de columnas */
	maxColumns: number;
	/** Ancho base de las tarjetas */
	cardWidth: number;
	/** Alto de las tarjetas */
	cardHeight: number;
	/** Espaciado entre tarjetas */
	gap: number;
	/** Mostrar metadatos en las tarjetas */
	showMetadata: boolean;
	/** Mostrar información técnica */
	showTechnicalInfo: boolean;
	/** Mostrar badges (favoritos, etiquetas, etc.) */
	showBadges: boolean;
	/** Tamaño de la vista previa de imagen */
	previewSize: 'small' | 'medium' | 'large';
}

/**
 * Configuración específica para vista Masonry/Mosaico
 */
export interface MasonryViewConfig {
	/** Número mínimo de columnas */
	minColumns: number;
	/** Número máximo de columnas */
	maxColumns: number;
	/** Ancho base de las columnas */
	columnWidth: number;
	/** Espaciado entre columnas */
	columnGap: number;
	/** Espaciado entre filas */
	rowGap: number;
	/** Altura máxima de los elementos */
	maxItemHeight: number;
	/** Altura mínima de los elementos */
	minItemHeight: number;
	/** Respetar aspect ratio original */
	respectAspectRatio: boolean;
	/** Balanceo de columnas automático */
	autoBalance: boolean;
}

/**
 * Configuración específica para vista List
 */
export interface ListViewConfig {
	/** Altura de cada fila */
	rowHeight: number;
	/** Espaciado entre filas */
	rowGap: number;
	/** Mostrar miniaturas */
	showThumbnails: boolean;
	/** Tamaño de las miniaturas */
	thumbnailSize: 'none' | 'small' | 'medium' | 'large';
	/** Columnas visibles */
	visibleColumns: {
		name: boolean;
		size: boolean;
		dateModified: boolean;
		dateCreated: boolean;
		type: boolean;
		dimensions: boolean;
		tags: boolean;
	};
	/** Mostrar líneas zebra */
	showZebraStripes: boolean;
	/** Compactar información */
	compactMode: boolean;
}

/**
 * Configuración general del FileBrowser
 */
export interface FileBrowserConfig {
	/** Configuraciones por vista */
	views: {
		grid: GridViewConfig;
		cards: CardsViewConfig;
		masonry: MasonryViewConfig;
		list: ListViewConfig;
	};
	/** Configuración general */
	general: {
		/** Modo de vista por defecto */
		defaultViewMode: 'grid' | 'cards' | 'masonry' | 'list';
		/** Carga progresiva habilitada */
		enableProgressiveLoading: boolean;
		/** Número de elementos por lote */
		itemsPerBatch: number;
		/** Animaciones de transición entre vistas */
		enableViewTransitions: boolean;
		/** Selección múltiple con Ctrl/Cmd */
		enableMultiSelect: boolean;
		/** Arrastrar y soltar */
		enableDragAndDrop: boolean;
		/** Mostrar contador de elementos */
		showItemCount: boolean;
		/** Mostrar información de tamaño total */
		showTotalSize: boolean;
	};
	/** Configuración de rendimiento */
	performance: {
		/** Virtualización habilitada */
		enableVirtualization: boolean;
		/** Número de elementos pre-cargados */
		overscanCount: number;
		/** Cache de miniaturas */
		enableThumbnailCache: boolean;
		/** Límite de cache de miniaturas */
		thumbnailCacheLimit: number;
		/** Calidad de miniaturas */
		thumbnailQuality: 'low' | 'medium' | 'high';
	};
}

/**
 * Preferencias de interfaz de usuario (UI)
 */
export interface InterfacePreferences {
	/** Familia tipográfica seleccionada */
	fontFamily: 'system' | 'serif' | 'mono' | 'rounded';
	/** Tamaño base de fuente */
	fontSize: 'sm' | 'md' | 'lg';
	/** Tema visual */
	theme: 'light' | 'dark' | 'system';
	/** Animaciones habilitadas */
	animations: boolean;
	/** Respetar aspect ratio en modo grilla */
	thumbnailsRespectAspectRatio: boolean;
	/** Borde redondeado de thumbnails por modo */
	thumbnailsBorderRadius: {
		grid: number;
		card: number;
		mosaic: number;
	};
	/** Animaciones de thumbnails */
	thumbnailsAnimations: boolean;
	/** Modo ultra performance para thumbnails */
	thumbnailsUltraPerformance: boolean;
	/** Configuración específica del FileBrowser */
	fileBrowser: FileBrowserConfig;
	/** Otros flags visuales futuros */
	[key: string]: unknown;
}

export interface InterfaceSettingsState {
	preferences: InterfacePreferences;
	updatedAt: number;
	setPreferences: (preferences: Partial<InterfacePreferences>) => void;
}
