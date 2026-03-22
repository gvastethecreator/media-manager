declare module 'react-virtuoso' {
	import * as React from 'react';

	export interface VirtuosoProps<T = any> {
		className?: string;
		data?: T[];
		itemContent?: (index: number, item: T) => React.ReactNode;
		style?: React.CSSProperties;
		useWindowScroll?: boolean;
	}
	export const Virtuoso: React.ComponentType<VirtuosoProps>;

	export interface VirtuosoGridProps<T = any> {
		className?: string;
		data?: T[];
		itemContent?: (index: number, item: T) => React.ReactNode;
		listClassName?: string;
		style?: React.CSSProperties;
	}
	export const VirtuosoGrid: React.ComponentType<VirtuosoGridProps>;

	export interface TableVirtuosoProps<T = any> {
		className?: string;
		data?: T[];
		fixedHeaderContent?: () => React.ReactNode;
		itemContent?: (index: number, item: T) => React.ReactNode;
		style?: React.CSSProperties;
	}
	export const TableVirtuoso: React.ComponentType<TableVirtuosoProps>;
}
