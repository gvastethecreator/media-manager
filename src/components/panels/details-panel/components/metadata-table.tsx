import React from 'react';
import { cn } from '@/lib/utils';
import { CollapsibleJSON } from './json-syntax-highlighter';

export interface MetadataTableRow {
	category?: string;
	className?: string;
	compact?: boolean;
	fullWidth?: boolean;
	icon?: React.ComponentType<any>;
	iconColor?: string;
	label: string;
	value: React.ReactNode;
}
export interface MetadataTableProps {
	className?: string;
	dense?: boolean;
	multiColumn?: boolean;
	rows: MetadataTableRow[];
	title?: React.ReactNode;
}

const renderRowValue = (row: MetadataTableRow): React.ReactNode => {
	if (row.category === 'json_content' && typeof row.value === 'string') {
		return (
			<CollapsibleJSON
				className="mt-2"
				collapsedHeight="150px"
				content={row.value}
				defaultExpanded={false}
				maxHeight="500px"
				showLineNumbers={true}
			/>
		);
	}
	return row.value;
};

export const MetadataTable: React.FC<MetadataTableProps> = ({ title, rows, className, dense, multiColumn }) => {
	const compactRows = rows.filter((row) => row.compact && !row.fullWidth);
	const normalRows = rows.filter((row) => !row.compact || row.fullWidth);

	return (
		<div
			className={cn(
				'w-full min-w-0 overflow-hidden rounded-lg border border-border/40 bg-card/30 text-card-foreground shadow-sm',
				className
			)}
		>
			{title && (
				<div className="border-border/20 border-b bg-muted/20 px-3 py-2 font-bold text-[10px] text-muted-foreground/70 uppercase tracking-wider">
					{title}
				</div>
			)}

			<div className={cn('divide-y divide-border/10', dense ? 'text-[10px]' : 'text-xs')}>
				{normalRows.map((row, idx) => {
					const Icon = row.icon;
					return (
						<div
							className={cn(
								'flex min-w-0 flex-col gap-1 p-2.5',
								!row.fullWidth && 'xs:flex-row xs:items-start xs:gap-3'
							)}
							key={`${row.label}-${idx}`}
						>
							<div
								className={cn('flex min-w-0 shrink-0 items-center gap-2', !row.fullWidth && 'xs:w-[90px] sm:w-[110px]')}
							>
								{Icon && <Icon className={cn('h-3 w-3 shrink-0', row.iconColor || 'text-muted-foreground/60')} />}
								<div className="truncate font-bold text-[9px] text-muted-foreground/80 uppercase tracking-tighter">
									{row.label}
								</div>
							</div>
							<div className={cn('min-w-0 flex-1 break-words text-foreground/90 leading-normal', row.className)}>
								{renderRowValue(row)}
							</div>
						</div>
					);
				})}
			</div>

			{compactRows.length > 0 && multiColumn && (
				<div
					className={cn(
						'grid w-full min-w-0 gap-1.5 bg-muted/5 p-2.5',
						normalRows.length > 0 && 'border-border/10 border-t',
						'grid-cols-1 min-[300px]:grid-cols-2'
					)}
				>
					{compactRows.map((row, idx) => {
						const Icon = row.icon;
						return (
							<div
								className="flex min-w-0 flex-col gap-0.5 rounded border border-border/10 bg-background/50 p-1.5"
								key={`compact-${row.label}-${idx}`}
							>
								<div className="flex items-center gap-1.5 opacity-60">
									{Icon && (
										<Icon className={cn('h-2.5 w-2.5 flex-shrink-0', row.iconColor || 'text-muted-foreground')} />
									)}
									<span className="truncate font-bold text-[8px] uppercase tracking-tighter">{row.label}</span>
								</div>
								<div className={cn('truncate font-medium text-[10px]', row.className)}>{renderRowValue(row)}</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
