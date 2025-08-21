import type { AnyEntityWithStats } from '@/types/migration';

export interface FileBrowser2Props {
	className?: string;
	filterId: string | null;
	filterType: 'folder'; // Por ahora solo carpetas
	entityType: 'image'; // Por ahora solo imágenes
	onItemClick?: (item: AnyEntityWithStats) => void;
	onItemDoubleClick?: (item: AnyEntityWithStats) => void;
}
