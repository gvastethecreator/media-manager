import type { BaseEntity } from '@/types/store.types';
import type { ColumnDef } from '@tanstack/react-table';

export type DataTableProps<T extends BaseEntity> = {
	data: T[];
	columns: ColumnDef<T>[];
	onUpdate?: (id: string, data: Partial<T>) => Promise<void>;
	onDelete?: (id: string) => Promise<void>;
};

export type DataTableColumnProps<T extends BaseEntity> = {
	getValue: () => unknown;
	row: { original: T };
	onUpdate?: (id: string, data: Partial<T>) => Promise<void>;
	onDelete?: (id: string) => Promise<void>;
};
