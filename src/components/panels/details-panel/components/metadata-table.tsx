import React from 'react';
import { cn } from '@/lib/utils';
import { CollapsibleJSON } from './json-syntax-highlighter';

export interface MetadataTableRow {
	icon?: React.ComponentType<any>;
	iconColor?: string;
	label: string;
	value: React.ReactNode;
	fullWidth?: boolean;
	className?: string;
	compact?: boolean; // Para elementos que pueden ir en columnas múltiples
	category?: string; // Para identificar el tipo de contenido
}
export interface MetadataTableProps {
	title?: React.ReactNode;
	rows: MetadataTableRow[];
	className?: string;
	dense?: boolean;
	multiColumn?: boolean; // Permitir distribución en múltiples columnas para elementos compact
}

/**
 * Renderiza el valor de una fila según su categoría
 */
const renderRowValue = (row: MetadataTableRow): React.ReactNode => {
	// Renderizar JSON con syntax highlighting
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

	// Renderizar contenido de documentos con formato preservado
	if (row.category === 'document_content' && typeof row.value === 'string') {
		return (
			<CollapsibleText className="font-mono text-xs" collapsedLines={8} defaultExpanded={false} text={row.value} />
		);
	}

	// Para otros tipos, renderizar normalmente
	return row.value;
};

export const MetadataTable: React.FC<MetadataTableProps> = ({ title, rows, className, dense, multiColumn }) => {
	// Separar filas compactas de las normales para distribución multi-columna
	const compactRows = rows.filter((row) => row.compact && !row.fullWidth);
	const normalRows = rows.filter((row) => !row.compact || row.fullWidth);

	return (
		<div className={cn('rounded-lg border-border/40 bg-card/50 text-card-foreground shadow-sm', className)}>
			{title ? (
				<div
					className={[
						'px-4',
						'py-3',
						'border-b',
						'border-border/30',
						'text-xs',
						'font-semibold',
						'uppercase',
						'tracking-wide',
					].join(' ')}
				>
					<h4 className="text-muted-foreground">{title}</h4>
				</div>
			) : null}

			{/* Filas normales */}
			{normalRows.length > 0 && (
				<div className={cn('grid grid-cols-1 gap-0', dense ? 'text-[11px]' : 'text-xs')}>
					{normalRows.map((row, idx) => {
						const Icon = row.icon;
						return (
							<div
								className={cn(
									'grid items-start gap-3 px-4 py-2.5',
									row.fullWidth ? 'grid-cols-[auto_1fr]' : 'grid-cols-[auto_140px_1fr]',
									idx !== normalRows.length - 1 && 'border-border/20 border-b'
								)}
								key={`${row.label}-${idx}`}
							>
								{Icon ? (
									<Icon className={cn('mt-0.5 h-3.5 w-3.5', row.iconColor || 'text-muted-foreground')} />
								) : (
									<span className="h-3.5 w-3.5" />
								)}
								{!row.fullWidth && <div className="truncate font-medium text-muted-foreground">{row.label}</div>}
								{row.fullWidth ? (
									<div className={cn('min-w-0 break-words leading-relaxed', row.className)}>
										<div className="grid grid-cols-[auto_1fr] items-start gap-3">
											<div className="font-medium text-muted-foreground">{row.label}</div>
											<div>{renderRowValue(row)}</div>
										</div>
									</div>
								) : (
									<div className={cn('min-w-0 break-words leading-relaxed', row.className)}>{renderRowValue(row)}</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Filas compactas en grid multi-columna */}
			{compactRows.length > 0 && multiColumn && (
				<div
					className={cn(
						'grid gap-x-4 gap-y-2 px-4 py-2.5',
						normalRows.length > 0 && 'border-border/20 border-t',
						dense ? 'text-[11px]' : 'text-xs',
						'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
					)}
				>
					{compactRows.map((row, idx) => {
						const Icon = row.icon;
						return (
							<div className="flex min-w-0 items-center gap-2" key={`compact-${row.label}-${idx}`}>
								{Icon && <Icon className={cn('h-3 w-3 flex-shrink-0', row.iconColor || 'text-muted-foreground')} />}
								<span className="truncate font-medium text-[10px] text-muted-foreground">{row.label}:</span>
								<span className={cn('truncate', row.className)}>{renderRowValue(row)}</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export const CollapsibleText: React.FC<{
	text: string;
	collapsedLines?: number;
	className?: string;
	defaultExpanded?: boolean;
}> = ({ text, collapsedLines = 10, className, defaultExpanded = true }) => {
	const [expanded, setExpanded] = React.useState(defaultExpanded); // por defecto expandido para prompts completos
	const needsCollapse = text.split('\n').length > collapsedLines || text.length > 1200;
	const content = (
		<pre
			className={cn('whitespace-pre-wrap break-words font-sans', expanded ? 'max-h-none' : 'line-clamp-10', className)}
		>
			{text}
		</pre>
	);
	if (!needsCollapse) return content;
	return (
		<div>
			{content}
			<button
				className="mt-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
				onClick={() => setExpanded((v) => !v)}
				type="button"
			>
				{expanded ? 'Ocultar' : 'Ver completo'}
			</button>
		</div>
	);
};
