'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
	return (
		<div className="relative w-full overflow-auto" data-slot="table-wrapper">
			<table className={cn('w-full caption-bottom text-foreground text-sm', className)} data-slot="table" {...props} />
		</div>
	);
}

function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
	return <thead className={cn('[&_tr]:border-b', className)} data-slot="table-header" {...props} />;
}

function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody className={cn('[&_tr:last-child]:border-0', className)} data-slot="table-body" {...props} />;
}

function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
	return (
		<tfoot
			className={cn('border-t bg-muted/50 font-medium last:[&>tr]:border-b-0', className)}
			data-slot="table-footer"
			{...props}
		/>
	);
}

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr
			className={cn(
				'border-b transition-colors data-[state=selected]:bg-muted [&:has(td):hover]:bg-muted/50',
				className
			)}
			data-slot="table-row"
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className={cn(
				'h-12 px-4 text-left align-middle font-normal text-muted-foreground rtl:text-right [&:has([role=checkbox])]:pe-0',
				className
			)}
			data-slot="table-head"
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td className={cn('p-4 align-middle [&:has([role=checkbox])]:pe-0', className)} data-slot="table-cell" {...props} />
	);
}

function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
	return (
		<caption className={cn('mt-4 text-muted-foreground text-sm', className)} data-slot="table-caption" {...props} />
	);
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
