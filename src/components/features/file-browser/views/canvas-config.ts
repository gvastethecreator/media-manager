export const CanvasRenderConfig = {
	// Grid/Cards
	grid: {
		itemSize: 160,
		gap: 8,
		overscanRows: 3,
		borderWidth: 2,
	},
	// List/Table
	list: {
		rowHeight: 72,
		thumbSize: 56,
		overscanRows: 6,
		borderWidth: 2,
	},
	table: {
		rowHeight: 52,
		thumbSize: 40,
		overscanRows: 8,
		borderWidth: 1,
	},
	// Masonry
	masonry: {
		columnWidth: 200,
		gap: 8,
		overscanPadding: 400,
		borderWidth: 2,
	},
	// Single
	single: {
		padding: 8,
		borderWidth: 0,
	},
	// Group headers (shared)
	group: {
		headerHeight: 28,
		headerGap: 8,
	},
	// Visual
	visuals: {
		enableSmoothing: true,
		enableFadeIn: false,
	},
};

export type CanvasRenderConfigType = typeof CanvasRenderConfig;
