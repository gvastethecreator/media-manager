import type { ViewType as NavigationViewType } from '@/store/navigation.store';

export type ViewType = NavigationViewType;

export interface ViewProps {
	isResizing?: boolean;
}

export interface ViewContainerProps {
	isResizing?: boolean;
}
