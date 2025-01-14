export type ViewMode = "grid" | "masonry" | "cards" | "list" | "details";

export interface GridConfig {
	minColumns: number;
	maxColumns: number;
	gap: number;
	itemBaseWidth: number;
	overscanCount: number;
	scrollingDelay: number;
	batchSize: number;
	prefetchDistance: number;
	cacheSize: number;
	debounceTime: number;
	breakpoints: {
		sm: number;
		md: number;
		lg: number;
		xl: number;
		"2xl": number;
	};
	masonry: {
		minColumns: number;
		maxColumns: number;
		gap: number;
		itemBaseWidth: number;
	};
	cards: {
		minColumns: number;
		maxColumns: number;
		gap: number;
		itemBaseWidth: number;
	};
	list: {
		gap: number;
		itemHeight: number;
	};
}
