import type { AnyEntityWithStats } from '@/types/entities';

export interface ClickModifiers {
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

export interface FileBrowser2Props {
	className?: string;
	filterId: string | null;
	filterType: 'folder'; // Por ahora solo carpetas
	entityType?: 'image' | 'video' | 'any'; // Mixto permitido
	onItemClick?: (item: AnyEntityWithStats) => void;
	onItemDoubleClick?: (item: AnyEntityWithStats) => void;
}
