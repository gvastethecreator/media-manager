import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { HTMLAttributes, RefAttributes } from 'react';
import type { FileItem } from './file-item';

declare module '@/components/ui/label' {
	export interface LabelProps {
		children?: ReactNode;
		htmlFor?: string;
		className?: string;
	}
}

declare module '@/components/ui/switch' {
	export interface SwitchProps {
		id?: string;
		defaultChecked?: boolean;
	}
}

declare module '@/components/ui/slider' {
	export interface SliderProps {
		id?: string;
		defaultValue?: number[];
		max?: number;
		min?: number;
		step?: number;
		marks?: { value: number; label: string }[];
		className?: string;
		disabled?: boolean;
	}
}

declare module '@/components/ui/select' {
	export interface SelectProps {
		defaultValue?: string;
		children?: ReactNode;
	}

	export interface SelectTriggerProps {
		children?: ReactNode;
		id?: string;
	}

	export interface SelectContentProps {
		children?: ReactNode;
	}

	export interface SelectItemProps {
		value: string;
		children?: ReactNode;
	}
}

declare module '@/components/ui/tabs' {
	export interface TabsProps {
		defaultValue?: string;
		value?: string;
		onValueChange?: (value: string) => void;
		className?: string;
		children: ReactNode;
	}

	export interface TabsListProps {
		className?: string;
		children: ReactNode;
	}

	export interface TabsTriggerProps {
		value: string;
		className?: string;
		children: ReactNode;
		asChild?: boolean;
	}

	export interface TabsContentProps {
		value: string;
		className?: string;
		children: ReactNode;
	}
}

declare module '@/components/ui/scroll-area' {
	export interface ScrollAreaProps {
		children?: ReactNode;
		className?: string;
		orientation?: 'horizontal' | 'vertical';
	}
}

declare module '@/components/ui/separator' {
	export interface SeparatorProps {
		className?: string;
		orientation?: 'horizontal' | 'vertical';
	}
}

declare module '@/components/ui/tooltip' {
	export interface TooltipProps {
		children: ReactNode;
		delayDuration?: number;
	}

	export interface TooltipTriggerProps {
		asChild?: boolean;
		children: ReactNode;
	}

	export interface TooltipContentProps {
		children: ReactNode;
		className?: string;
	}

	export interface TooltipProviderProps {
		children: ReactNode;
		delayDuration?: number;
	}
}

declare module '@/components/ui/resizable' {
	export interface ResizablePanelGroupProps {
		direction?: 'horizontal' | 'vertical';
		onLayout?: (sizes: number[]) => void;
		className?: string;
		children: ReactNode;
	}

	export interface ResizablePanelProps {
		defaultSize?: number;
		minSize?: number;
		maxSize?: number;
		size?: number;
		className?: string;
		children?: ReactNode;
		collapsible?: boolean;
		collapsedSize?: number;
		onCollapse?: () => void;
		onExpand?: () => void;
		onLayout?: (size: number) => void;
	}

	export interface ResizableHandleProps {
		withHandle?: boolean;
		className?: string;
		children?: ReactNode;
	}
}

declare module '@/components/ui/alert' {
	export interface AlertProps {
		variant?: 'default' | 'destructive';
		children?: ReactNode;
	}

	export interface AlertDescriptionProps {
		className?: string;
		children?: ReactNode;
	}
}

declare module '@/components/ui/textarea' {
	export interface TextareaProps {
		placeholder?: string;
		className?: string;
		defaultValue?: string;
	}
}

declare module '@/components/ui/badge' {
	export interface BadgeProps {
		variant?: 'default' | 'secondary' | 'outline';
		className?: string;
		children?: ReactNode;
	}
}

declare module '@/components/ui/button' {
	export interface ButtonProps {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		className?: string;
		children?: ReactNode;
		onClick?: () => void;
	}
}

declare module '@/components/ui/input' {
	export interface InputProps {
		placeholder?: string;
		className?: string;
		defaultValue?: string;
		type?: string;
	}
}

declare module '@/components/ui/avatar' {
	export interface AvatarProps {
		children?: ReactNode;
		className?: string;
	}

	export interface AvatarImageProps {
		src?: string;
		alt?: string;
		className?: string;
	}

	export interface AvatarFallbackProps {
		children?: ReactNode;
		className?: string;
	}
}

export interface Collection {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	count: number;
}

export interface Folder {
	id: string;
	name: string;
	path: string;
	color?: string;
	count: number;
}

export interface Tag {
	id: string;
	name: string;
	color: string;
	count: number;
}

export interface LeftPanelProps {
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
	defaultSize?: number;
	minSize?: number;
	maxSize?: number;
	isResizing?: boolean;
	onTransitionStart?: () => void;
	onTransitionEnd?: () => void;
	className?: string;
}

export interface SidebarItemProps {
	icon: LucideIcon;
	label: string;
	count?: number;
	isActive?: boolean;
	onClick?: () => void;
	className?: string;
}

export interface ViewProps {
	isResizing?: boolean;
}

export interface NavigationItem {
	id: string;
	label: string;
	icon: LucideIcon;
	color?: string;
}

export interface CategoryItem extends NavigationItem {
	count?: number;
	items?: Array<Collection | Folder | Tag>;
}

export interface MainContentProps {
	children: ReactNode;
	className?: string;
}

export interface RightPanelProps {
	selectedItem: FileItem | null;
	showSettings: boolean;
	onToggleSettings: () => void;
}
