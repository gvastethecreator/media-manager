declare module 'react-virtuoso' {
	import * as React from 'react';

	export interface VirtuosoProps<T = any> {
		data?: T[];
		itemContent?: (index: number, item: T) => React.ReactNode;
		style?: React.CSSProperties;
		useWindowScroll?: boolean;
		className?: string;
	}
	export const Virtuoso: React.ComponentType<VirtuosoProps>;

	export interface VirtuosoGridProps<T = any> {
		data?: T[];
		itemContent?: (index: number, item: T) => React.ReactNode;
		style?: React.CSSProperties;
		listClassName?: string;
		className?: string;
	}
	export const VirtuosoGrid: React.ComponentType<VirtuosoGridProps>;

	export interface TableVirtuosoProps<T = any> {
		data?: T[];
		fixedHeaderContent?: () => React.ReactNode;
		itemContent?: (index: number, item: T) => React.ReactNode;
		style?: React.CSSProperties;
		className?: string;
	}
	export const TableVirtuoso: React.ComponentType<TableVirtuosoProps>;
}
