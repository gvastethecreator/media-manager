declare module '@virtuoso.dev/masonry' {
	import type { ComponentType, CSSProperties } from 'react';

	export interface VirtuosoMasonryProps<Data = any, Context = any> {
		data?: Data[];
		columnCount?: number;
		ItemContent: ComponentType<{ data: Data }>;
		style?: CSSProperties;
		initialItemCount?: number;
		computeItemKey?: (params: { data: Data; index: number }) => string | number;
		useWindowScroll?: boolean;
	}

	export const VirtuosoMasonry: <Data = any, Context = any>(props: VirtuosoMasonryProps<Data, Context>) => JSX.Element;

	export default VirtuosoMasonry;
}
