import { type ColumnDef } from "@tanstack/react-table";
import { type BaseEntity } from "./store.types";

export type DataTableProps<T extends BaseEntity> = {
  data: T[];
  columns: ColumnDef<T>[];
  onUpdate?: (id: string, data: Partial<T>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

export type DataTableColumnProps<T extends BaseEntity> = {
  getValue: () => any;
  row: { original: T };
  onUpdate?: (id: string, data: Partial<T>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};