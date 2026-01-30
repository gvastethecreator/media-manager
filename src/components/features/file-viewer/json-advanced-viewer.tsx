/**
 * @file JsonAdvancedViewer
 * @module components/features/file-viewer/json-advanced-viewer
 * @description Visualizador avanzado de archivos JSON con formato y colapsado
 */

import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JsonAdvancedViewerProps {
	/** Contenido JSON a mostrar */
	content: unknown;
	/** Nombre del archivo */
	fileName?: string;
	/** Clases adicionales */
	className?: string;
}

interface JsonNodeProps {
	data: unknown;
	name?: string;
	level?: number;
	isLast?: boolean;
}

/**
 * Determina si un valor es un objeto colapsable (objeto o array con elementos)
 */
function isCollapsible(value: unknown): value is Record<string, unknown> | unknown[] {
	return (
		(typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) ||
		(Array.isArray(value) && value.length > 0)
	);
}

/**
 * Obtiene el tipo de dato para mostrar
 */
function getDataType(value: unknown): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

/**
 * Obtiene el color según el tipo de dato
 */
function getTypeColor(type: string): string {
	switch (type) {
		case 'string':
			return 'text-green-500';
		case 'number':
			return 'text-blue-500';
		case 'boolean':
			return 'text-purple-500';
		case 'null':
			return 'text-gray-500';
		default:
			return 'text-foreground';
	}
}

/**
 * Nodo individual del JSON tree
 */
function JsonNode({ data, name, level = 0, isLast = true }: JsonNodeProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const isCollapsable = isCollapsible(data);
	const type = getDataType(data);
	const indent = level * 16;

	const toggle = useCallback(() => {
		if (isCollapsable) {
			setIsExpanded(!isExpanded);
		}
	}, [isCollapsable, isExpanded]);

	// Renderizar valor primitivo
	if (!isCollapsable) {
		return (
			<div className="font-mono text-sm" style={{ paddingLeft: indent }}>
				{name && (
					<span className="text-foreground">
						<span className="text-foreground">"</span>
						{name}
						<span className="text-foreground">"</span>
						<span className="text-muted-foreground">: </span>
					</span>
				)}
				<span className={getTypeColor(type)}>{type === 'string' ? `"${String(data)}"` : String(data)}</span>
				{!isLast && <span className="text-muted-foreground">,</span>}
			</div>
		);
	}

	const isArray = Array.isArray(data);
	const keys = isArray ? data : Object.keys(data);
	const length = keys.length;

	return (
		<div className="font-mono text-sm" style={{ paddingLeft: indent }}>
			{/* Header con nombre y toggle */}
			<div
				className="flex cursor-pointer items-center gap-1 hover:bg-muted/30"
				onClick={toggle}
				onKeyDown={(e) => e.key === 'Enter' && toggle()}
				role="button"
				tabIndex={0}
			>
				{isExpanded ? (
					<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
				)}
				{name && (
					<span className="text-foreground">
						<span className="text-foreground">"</span>
						{name}
						<span className="text-foreground">"</span>
						<span className="text-muted-foreground">: </span>
					</span>
				)}
				<span className="text-muted-foreground">{isArray ? '[' : '{'}</span>
				{!isExpanded && (
					<span className="text-muted-foreground text-xs">
						{isArray ? `${length} items` : `${Object.keys(data).length} keys`}
						{isArray ? ']' : '}'}
					</span>
				)}
				{!isLast && isExpanded && <span className="text-muted-foreground">,</span>}
			</div>

			{/* Contenido colapsable */}
			{isExpanded && (
				<div className="pl-4">
					{isArray
						? keys.map((item, index) => <JsonNode data={item} isLast={index === length - 1} key={index} level={0} />)
						: Object.entries(data).map(([key, value], index) => (
								<JsonNode data={value} isLast={index === length - 1} key={key} level={0} name={key} />
							))}
				</div>
			)}

			{/* Cierre */}
			{isExpanded && (
				<div style={{ paddingLeft: indent }}>
					<span className="text-muted-foreground">{isArray ? ']' : '}'}</span>
					{!isLast && <span className="text-muted-foreground">,</span>}
				</div>
			)}
		</div>
	);
}

/**
 * Visualizador avanzado de JSON
 */
export function JsonAdvancedViewer({ content, fileName, className }: JsonAdvancedViewerProps) {
	const [copied, setCopied] = useState(false);

	const formattedJson = useMemo(() => {
		try {
			return JSON.stringify(content, null, 2);
		} catch {
			return String(content);
		}
	}, [content]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(formattedJson);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}, [formattedJson]);

	return (
		<div className={cn('flex flex-col rounded-lg border bg-card', className)}>
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-2">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm">{fileName || 'JSON'}</span>
					<span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">{getDataType(content)}</span>
				</div>
				<Button className="h-7 gap-1.5 px-2" onClick={handleCopy} size="sm" variant="ghost">
					{copied ? (
						<>
							<Check className="h-3.5 w-3.5" />
							<span className="text-xs">Copiado</span>
						</>
					) : (
						<>
							<Copy className="h-3.5 w-3.5" />
							<span className="text-xs">Copiar</span>
						</>
					)}
				</Button>
			</div>

			{/* Contenido */}
			<div className="flex-1 overflow-auto p-4">
				<JsonNode data={content} isLast level={0} />
			</div>
		</div>
	);
}
