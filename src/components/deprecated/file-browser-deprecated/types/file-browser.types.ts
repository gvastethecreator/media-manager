import type { AnyEntityWithStats } from '@/types/entities';

export interface ClickModifiers {
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

export interface FileBrowserProps {
	filterId?: string | null;
	onItemClick?: (entity: AnyEntityWithStats, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (entity: AnyEntityWithStats, modifiers?: ClickModifiers) => void;
}
