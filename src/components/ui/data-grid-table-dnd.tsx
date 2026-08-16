import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Cell, flexRender, Header, HeaderGroup, Row, RowData } from '@/lib/tanstack-react-table';
import { GripVertical } from 'lucide-react';
import { CSSProperties, Fragment, useId } from 'react';
import { Button } from '@/components/ui/button';
import { useDataGrid } from '@/components/ui/data-grid';
import {
	DataGridTableBase,
	DataGridTableBody,
	DataGridTableBodyRow,
	DataGridTableBodyRowCell,
	DataGridTableBodyRowExpandded,
	DataGridTableBodyRowSkeleton,
	DataGridTableBodyRowSkeletonCell,
	DataGridTableEmpty,
	DataGridTableHead,
	DataGridTableHeadRow,
	DataGridTableHeadRowCell,
	DataGridTableHeadRowCellResize,
	DataGridTableRowSpacer,
} from '@/components/ui/data-grid-table';
import { clientLogger } from '@/lib/logger/client-logger';

function DataGridTableDndHeader<TData extends RowData>({ header }: { header: Header<any, TData, unknown> }) {
	const { props } = useDataGrid();
	const { column } = header;

	const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
		id: header.column.id,
	});

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		position: 'relative',
		transform: CSS.Translate.toString(transform),
		transition,
		whiteSpace: 'nowrap',
		width: header.column.getSize(),
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<DataGridTableHeadRowCell dndRef={setNodeRef} dndStyle={style} header={header}>
			<div className="flex items-center justify-start gap-0.5">
				<Button
					className="-ms-2 size-6"
					mode="icon"
					size="sm"
					variant="dim"
					{...attributes}
					{...listeners}
					aria-label="Drag to reorder"
				>
					<GripVertical aria-hidden="true" className="opacity-50" />
				</Button>
				{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
				{props.tableLayout?.columnsResizable && column.getCanResize() && (
					<DataGridTableHeadRowCellResize header={header} />
				)}
			</div>
		</DataGridTableHeadRowCell>
	);
}

function DataGridTableDndCell<TData extends RowData>({ cell }: { cell: Cell<any, TData, unknown> }) {
	const { isDragging, setNodeRef, transform, transition } = useSortable({
		id: cell.column.id,
	});

	const style: CSSProperties = {
		opacity: isDragging ? 0.8 : 1,
		position: 'relative',
		transform: CSS.Translate.toString(transform),
		transition,
		width: cell.column.getSize(),
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<DataGridTableBodyRowCell cell={cell} dndRef={setNodeRef} dndStyle={style}>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</DataGridTableBodyRowCell>
	);
}

function DataGridTableDnd<TData extends RowData>({ handleDragEnd }: { handleDragEnd: (event: DragEndEvent) => void }) {
	const { table, isLoading, props } = useDataGrid();
	const pagination = table.getState().pagination;

	const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}));

	return (
		<DndContext collisionDetection={closestCenter} id={useId()} modifiers={[restrictToParentElement]} sensors={sensors}>
			<div className="relative">
				<DataGridTableBase>
					<DataGridTableHead>
						{table.getHeaderGroups().map((headerGroup: HeaderGroup<any, TData>, index) => {
							clientLogger.debug('table.getState().columnOrder:', table.getState().columnOrder);

							return (
								<DataGridTableHeadRow headerGroup={headerGroup} key={index}>
									<SortableContext items={table.getState().columnOrder} strategy={horizontalListSortingStrategy}>
										{headerGroup.headers.map((header, index) => (
											<DataGridTableDndHeader header={header} key={index} />
										))}
									</SortableContext>
								</DataGridTableHeadRow>
							);
						})}
					</DataGridTableHead>

					{(props.tableLayout?.stripped || !props.tableLayout?.rowBorder) && <DataGridTableRowSpacer />}

					<DataGridTableBody>
						{props.loadingMode === 'skeleton' && isLoading && pagination?.pageSize ? (
							Array.from({ length: pagination.pageSize }).map((_, rowIndex) => (
								<DataGridTableBodyRowSkeleton key={rowIndex}>
									{table.getVisibleFlatColumns().map((column, colIndex) => {
										return (
											<DataGridTableBodyRowSkeletonCell column={column} key={colIndex}>
												{column.columnDef.meta?.skeleton}
											</DataGridTableBodyRowSkeletonCell>
										);
									})}
								</DataGridTableBodyRowSkeleton>
							))
						) : table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row: Row<any, any>, index) => {
								return (
									<Fragment key={row.id}>
										<DataGridTableBodyRow key={index} row={row}>
											{row.getVisibleCells().map((cell) => {
												return (
													<SortableContext
														items={table.getState().columnOrder}
														key={cell.id}
														strategy={horizontalListSortingStrategy}
													>
														<DataGridTableDndCell cell={cell} />
													</SortableContext>
												);
											})}
										</DataGridTableBodyRow>
										{row.getIsExpanded() && <DataGridTableBodyRowExpandded row={row} />}
									</Fragment>
								);
							})
						) : (
							<DataGridTableEmpty />
						)}
					</DataGridTableBody>
				</DataGridTableBase>
			</div>
		</DndContext>
	);
}

export { DataGridTableDnd };
