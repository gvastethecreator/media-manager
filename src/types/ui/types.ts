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
	animationsEnabled: boolean;
	error: string | null;
	gridSize: 'small' | 'medium' | 'large' | 'xl';
	loading: {
		global: boolean;
		operations: Record<string, boolean>;
	};
	modals: {
		open: string[];
		data: Record<string, unknown>;
	};
	notifications: {
		enabled: boolean;
		position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
		duration: number;
	};
	showMetadata: boolean;
	showThumbnails: boolean;
	sidebarCollapsed: boolean;
	theme: 'light' | 'dark' | 'auto';
	viewMode: 'grid' | 'list' | 'masonry' | 'cards';
}

/**
 * Configuración específica para vista Grid
 */
export interface GridViewConfig {
	/** Relación de aspecto (width/height) */
	aspectRatio: number;
	/** Animaciones de hover */
	enableHoverAnimations: boolean;
	/** Espaciado entre elementos */
	gap: number;
	/** Tamaño base de los elementos */
	itemSize: number;
	/** Número máximo de columnas */
	maxColumns: number;
	/** Número mínimo de columnas */
	minColumns: number;
	/** Mostrar información al hover */
	showInfoOnHover: boolean;
}

/**
 * Configuración específica para vista Cards
 */
export interface CardsViewConfig {
	/** Alto de las tarjetas */
	cardHeight: number;
	/** Ancho base de las tarjetas */
	cardWidth: number;
	/** Espaciado entre tarjetas */
	gap: number;
	/** Número máximo de columnas */
	maxColumns: number;
	/** Número mínimo de columnas */
	minColumns: number;
	/** Tamaño de la vista previa de imagen */
	previewSize: 'small' | 'medium' | 'large';
	/** Mostrar badges (favoritos, etiquetas, etc.) */
	showBadges: boolean;
	/** Mostrar metadatos en las tarjetas */
	showMetadata: boolean;
	/** Mostrar información técnica */
	showTechnicalInfo: boolean;
}

/**
 * Configuración específica para vista Masonry/Mosaico
 */
export interface MasonryViewConfig {
	/** Balanceo de columnas automático */
	autoBalance: boolean;
	/** Espaciado entre columnas */
	columnGap: number;
	/** Ancho base de las columnas */
	columnWidth: number;
	/** Número máximo de columnas */
	maxColumns: number;
	/** Altura máxima de los elementos */
	maxItemHeight: number;
	/** Número mínimo de columnas */
	minColumns: number;
	/** Altura mínima de los elementos */
	minItemHeight: number;
	/** Respetar aspect ratio original */
	respectAspectRatio: boolean;
	/** Espaciado entre filas */
	rowGap: number;
}

/**
 * Configuración específica para vista List
 */
export interface ListViewConfig {
	/** Compactar información */
	compactMode: boolean;
	/** Espaciado entre filas */
	rowGap: number;
	/** Altura de cada fila */
	rowHeight: number;
	/** Mostrar miniaturas */
	showThumbnails: boolean;
	/** Mostrar líneas zebra */
	showZebraStripes: boolean;
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
}

/**
 * Configuración general del FileBrowser
 */
export interface FileBrowserConfig {
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
	/** Configuraciones por vista */
	views: {
		grid: GridViewConfig;
		cards: CardsViewConfig;
		masonry: MasonryViewConfig;
		list: ListViewConfig;
	};
}

/**
 * Preferencias de interfaz de usuario (UI)
 */
export interface InterfacePreferences {
	/** Animaciones habilitadas */
	animations: boolean;
	/** Configuración específica del FileBrowser */
	fileBrowser: FileBrowserConfig;
	/** Familia tipográfica seleccionada */
	fontFamily:
		| 'system'
		| 'inter'
		| 'roboto'
		| 'open-sans'
		| 'lato'
		| 'montserrat'
		| 'poppins'
		| 'source-sans'
		| 'serif'
		| 'georgia'
		| 'playfair'
		| 'merriweather'
		| 'mono'
		| 'jetbrains-mono'
		| 'fira-code'
		| 'ubuntu-mono'
		| 'rounded';
	/** Tamaño base de fuente (escala extendida) */
	fontSize: 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
	/** Tema visual (sincronizado con useTheme + system) */
	theme:
		| 'light'
		| 'dark'
		| 'cafe'
		| 'violeta'
		| 'madera'
		| 'nocturno'
		| 'verde'
		| 'atardecer'
		| 'corporativo'
		| 'carbon'
		| 'teal'
		| 'citrico'
		| 'system';
	/** Animaciones de thumbnails */
	thumbnailsAnimations: boolean;
	/** Borde redondeado de thumbnails por modo */
	thumbnailsBorderRadius: {
		grid: number;
		card: number;
		mosaic: number;
	};
	/** Respetar aspect ratio en modo grilla */
	thumbnailsRespectAspectRatio: boolean;
	/** Modo ultra performance para thumbnails */
	thumbnailsUltraPerformance: boolean;
	/** Otros flags visuales futuros */
	[key: string]: unknown;
}

export interface InterfaceSettingsState {
	preferences: InterfacePreferences;
	setPreferences: (preferences: Partial<InterfacePreferences>) => void;
	updatedAt: number;
}
