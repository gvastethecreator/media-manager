declare module '@virtuoso.dev/masonry' {
	import type { ComponentType, CSSProperties } from 'react';

	export interface VirtuosoMasonryProps<Data = any, Context = any> {
		columnCount?: number;
		computeItemKey?: (params: { data: Data; index: number }) => string | number;
		data?: Data[];
		ItemContent: ComponentType<{ data: Data }>;
		initialItemCount?: number;
		style?: CSSProperties;
		useWindowScroll?: boolean;
	}

	export const VirtuosoMasonry: <Data = any, Context = any>(props: VirtuosoMasonryProps<Data, Context>) => JSX.Element;

	export default VirtuosoMasonry;
}
