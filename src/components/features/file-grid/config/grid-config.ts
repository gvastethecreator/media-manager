// Tipos y configuración para el grid

// Función auxiliar para parsear metadata
export const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

// Tipos para la configuración del grid
export interface BaseGridConfig {
	minColumns: number;
	maxColumns: number;
	itemBaseWidth: number;
	padding: number;
}

export interface GridViewConfig extends BaseGridConfig {
	rowHeight: number;
	aspectRatio: number;
}

export interface MasonryConfig extends BaseGridConfig {
	maxHeight: number;
	minHeight: number;
	columnGap: number;
	rowGap: number;
}

export interface CardsConfig extends BaseGridConfig {
	rowHeight: number;
	aspectRatio: number;
}

export interface ListConfig {
	height: number;
	padding: number;
}

export interface GridGaps {
	grid: number;
	masonry: number;
	cards: number;
	list: number;
}

export interface GridConfig {
	gap: GridGaps;
	grid: GridViewConfig;
	masonry: MasonryConfig;
	cards: CardsConfig;
	list: ListConfig;
	overscan: number;
}

// Configuración base del grid optimizada
export const GRID_CONFIG: GridConfig = {
	gap: {
		grid: 0,
		masonry: 8,
		cards: 16,
		list: 4,
	},
	grid: {
		minColumns: 4,
		maxColumns: 6,
		itemBaseWidth: 140,
		rowHeight: 140,
		padding: 0,
		aspectRatio: 1,
	},
	masonry: {
		minColumns: 4,
		maxColumns: 6,
		itemBaseWidth: 140,
		maxHeight: 300,
		minHeight: 100,
		padding: 0,
		columnGap: 2,
		rowGap: 2,
	},
	cards: {
		minColumns: 2,
		maxColumns: 3,
		itemBaseWidth: 360,
		rowHeight: 420,
		padding: 16,
		aspectRatio: 1.4,
	},
	list: {
		height: 80,
		padding: 4,
	},
	overscan: 30,
};
