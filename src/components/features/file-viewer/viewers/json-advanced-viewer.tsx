/**
 * @file Visualizador avanzado de JSON con múltiples modos
 * @module components/features/file-viewer/viewers/json-advanced-viewer
 * @description Visualizador de JSON con modos: tree, table, graph, cards, timeline
 */

import {
	BarChart3,
	ChevronDown,
	ChevronRight,
	Copy,
	Download,
	LayoutGrid,
	Network,
	Search,
	Table2,
	TreePine,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ViewMode = 'tree' | 'table' | 'graph' | 'cards' | 'stats';

interface JsonAdvancedViewerProps {
	className?: string;
	/** Contenido JSON como string o objeto */
	content: string | object;
	/** Nombre del archivo */
	fileName?: string;
}

// ============ UTILIDADES ============

function parseJSON(content: string | object): any {
	if (typeof content === 'string') {
		try {
			return JSON.parse(content);
		} catch {
			return null;
		}
	}
	return content;
}

function isArrayOfObjects(data: any): boolean {
	return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object';
}

function isObject(data: any): boolean {
	return typeof data === 'object' && data !== null && !Array.isArray(data);
}

function hasDateFields(data: any): boolean {
	if (!isArrayOfObjects(data)) return false;
	return data.some((item: any) =>
		Object.values(item).some((val: any) => typeof val === 'string' && !Number.isNaN(Date.parse(val)))
	);
}

function hasNumericFields(data: any): boolean {
	if (!(isArrayOfObjects(data) || isObject(data))) return false;
	const sample = Array.isArray(data) ? data[0] : data;
	return Object.values(sample).some((val: any) => typeof val === 'number');
}

function getAllKeys(data: any[]): string[] {
	if (!data.length) return [];
	const keys = new Set<string>();
	for (const item of data) {
		if (typeof item === 'object' && item !== null) {
			for (const key of Object.keys(item)) {
				keys.add(key);
			}
		}
	}
	return Array.from(keys);
}

function formatValue(value: any): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return value.toLocaleString();
	if (typeof value === 'string') {
		if (value.length > 100) return `${value.substring(0, 100)}...`;
		return value;
	}
	if (Array.isArray(value)) return `[${value.length} items]`;
	if (typeof value === 'object') return '{...}';
	return String(value);
}

function getValueType(value: any): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

// ============ VISTA TREE ============

interface TreeNodeProps {
	depth?: number;
	isLast?: boolean;
	name: string;
	searchTerm?: string;
	value: any;
}

function TreeNode({ name, value, depth = 0, isLast = false, searchTerm = '' }: TreeNodeProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const type = getValueType(value);
	const isContainer = type === 'object' || type === 'array';
	const hasChildren = isContainer && Object.keys(value).length > 0;

	// Highlight search matches
	const isMatch = searchTerm && name.toLowerCase().includes(searchTerm.toLowerCase());

	if (!isContainer) {
		return (
			<div className="flex items-start gap-1 py-0.5 font-mono text-sm" style={{ paddingLeft: `${depth * 16}px` }}>
				<span className="select-none text-muted-foreground">{isLast ? '└─' : '├─'}</span>
				<span className={cn('text-blue-600 dark:text-blue-400', isMatch && 'bg-yellow-200 dark:bg-yellow-900')}>
					{name}:
				</span>
				<span
					className={cn(
						'ml-1',
						type === 'string' && 'text-green-600 dark:text-green-400',
						type === 'number' && 'text-orange-600 dark:text-orange-400',
						type === 'boolean' && 'text-purple-600 dark:text-purple-400',
						type === 'null' && 'text-gray-500'
					)}
				>
					{type === 'string' ? `"${formatValue(value)}"` : formatValue(value)}
				</span>
			</div>
		);
	}

	const entries = Object.entries(value);
	const count = entries.length;

	return (
		<div>
			<div
				className={cn(
					'flex cursor-pointer items-center gap-1 rounded py-0.5 hover:bg-muted/50',
					isMatch && 'bg-yellow-200 dark:bg-yellow-900'
				)}
				onClick={() => setIsExpanded(!isExpanded)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						setIsExpanded(!isExpanded);
					}
				}}
				role="button"
				style={{ paddingLeft: `${depth * 16}px` }}
				tabIndex={0}
			>
				<span className="w-4 select-none text-muted-foreground">
					{hasChildren && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
					{!hasChildren && <span className="w-4" />}
				</span>
				<span className="font-mono text-blue-600 dark:text-blue-400">{name}:</span>
				{type === 'array' && (
					<Badge className="ml-1 text-xs" variant="secondary">
						[{count}]
					</Badge>
				)}
				{type === 'object' && (
					<Badge className="ml-1 text-xs" variant="secondary">
						{'{'} {count} {'}'}
					</Badge>
				)}
			</div>
			{isExpanded && hasChildren && (
				<div>
					{entries.map(([key, val], index) => (
						<TreeNode
							depth={depth + 1}
							isLast={index === entries.length - 1}
							key={key}
							name={type === 'array' ? `[${key}]` : key}
							searchTerm={searchTerm}
							value={val}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function TreeView({ data, searchTerm }: { data: any; searchTerm: string }) {
	return (
		<ScrollArea className="h-[500px]">
			<div className="p-4">
				{isObject(data) ? (
					Object.entries(data).map(([key, value], index, arr) => (
						<TreeNode isLast={index === arr.length - 1} key={key} name={key} searchTerm={searchTerm} value={value} />
					))
				) : Array.isArray(data) ? (
					data.map((item, index) => (
						<TreeNode
							isLast={index === data.length - 1}
							key={index}
							name={`[${index}]`}
							searchTerm={searchTerm}
							value={item}
						/>
					))
				) : (
					<div className="text-muted-foreground">No data to display</div>
				)}
			</div>
		</ScrollArea>
	);
}

// ============ VISTA TABLE ============

function TableView({ data }: { data: any[] }) {
	if (!isArrayOfObjects(data)) {
		return (
			<div className="flex h-[500px] items-center justify-center text-muted-foreground">
				Table view only available for arrays of objects
			</div>
		);
	}

	const keys = getAllKeys(data);

	return (
		<ScrollArea className="h-[500px]">
			<table className="w-full text-sm">
				<thead className="sticky top-0 bg-muted">
					<tr>
						<th className="border-b px-4 py-2 text-left font-medium text-muted-foreground">#</th>
						{keys.map((key) => (
							<th className="border-b px-4 py-2 text-left font-medium text-muted-foreground" key={key}>
								{key}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.map((item, index) => (
						<tr className="border-b hover:bg-muted/50" key={index}>
							<td className="px-4 py-2 text-muted-foreground">{index + 1}</td>
							{keys.map((key) => (
								<td className="px-4 py-2" key={key}>
									{formatValue(item[key])}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</ScrollArea>
	);
}

// ============ VISTA CARDS ============

function CardsView({ data }: { data: any }) {
	if (!(isObject(data) || Array.isArray(data))) {
		return (
			<div className="flex h-[500px] items-center justify-center text-muted-foreground">
				Cards view only available for objects or arrays
			</div>
		);
	}

	const entries = isObject(data) ? Object.entries(data) : data.map((item: any, i: number) => [`[${i}]`, item]);

	return (
		<ScrollArea className="h-[500px]">
			<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
				{entries.map(([key, value]: [string, any]) => (
					<Card className="p-4" key={key}>
						<div className="mb-2 flex items-center justify-between">
							<h4 className="font-semibold text-sm">{key}</h4>
							<Badge className="text-xs" variant="outline">
								{getValueType(value)}
							</Badge>
						</div>
						<div className="font-mono text-muted-foreground text-sm">{formatValue(value)}</div>
					</Card>
				))}
			</div>
		</ScrollArea>
	);
}

// ============ VISTA STATS ============

function StatsView({ data }: { data: any }) {
	const stats = useMemo(() => {
		if (!isArrayOfObjects(data)) return null;

		const numericFields: Record<string, { min: number; max: number; avg: number; sum: number; count: number }> = {};

		for (const item of data) {
			for (const [key, value] of Object.entries(item)) {
				if (typeof value === 'number') {
					if (numericFields[key]) {
						numericFields[key].min = Math.min(numericFields[key].min, value);
						numericFields[key].max = Math.max(numericFields[key].max, value);
						numericFields[key].sum += value;
						numericFields[key].count++;
					} else {
						numericFields[key] = { min: value, max: value, sum: value, count: 1, avg: value };
					}
				}
			}
		}

		// Calculate averages
		for (const stat of Object.values(numericFields)) {
			stat.avg = stat.sum / stat.count;
		}

		return numericFields;
	}, [data]);

	if (!stats || Object.keys(stats).length === 0) {
		return (
			<div className="flex h-[500px] items-center justify-center text-muted-foreground">
				No numeric fields found for statistics
			</div>
		);
	}

	return (
		<ScrollArea className="h-[500px]">
			<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
				{Object.entries(stats).map(([field, stat]) => (
					<Card className="p-4" key={field}>
						<h4 className="mb-3 font-semibold">{field}</h4>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div className="rounded bg-muted p-2">
								<div className="text-muted-foreground text-xs">Min</div>
								<div className="font-mono">{stat.min.toLocaleString()}</div>
							</div>
							<div className="rounded bg-muted p-2">
								<div className="text-muted-foreground text-xs">Max</div>
								<div className="font-mono">{stat.max.toLocaleString()}</div>
							</div>
							<div className="rounded bg-muted p-2">
								<div className="text-muted-foreground text-xs">Avg</div>
								<div className="font-mono">{stat.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
							</div>
							<div className="rounded bg-muted p-2">
								<div className="text-muted-foreground text-xs">Sum</div>
								<div className="font-mono">{stat.sum.toLocaleString()}</div>
							</div>
						</div>
						<div className="mt-2 text-muted-foreground text-xs">{stat.count} values</div>
					</Card>
				))}
			</div>
		</ScrollArea>
	);
}

// ============ VISTA GRAPH ============

function GraphView({ data }: { data: any }) {
	// Simple representation of object structure as a graph
	const nodes = useMemo(() => {
		const result: Array<{ id: string; label: string; type: string; level: number }> = [];

		function traverse(obj: any, parentId = 'root', level = 0) {
			if (typeof obj !== 'object' || obj === null) return;

			for (const [key, value] of Object.entries(obj)) {
				const id = `${parentId}.${key}`;
				const type = getValueType(value);
				result.push({ id, label: key, type, level });

				if (type === 'object' || type === 'array') {
					traverse(value, id, level + 1);
				}
			}
		}

		result.push({ id: 'root', label: 'root', type: 'object', level: -1 });
		traverse(data, 'root', 0);
		return result;
	}, [data]);

	return (
		<ScrollArea className="h-[500px]">
			<div className="p-4">
				<div className="mb-4 text-muted-foreground text-sm">Showing {nodes.length - 1} nodes in hierarchy</div>
				<div className="space-y-1">
					{nodes
						.filter((n) => n.id !== 'root')
						.map((node) => (
							<div
								className="flex items-center gap-2 rounded p-2 hover:bg-muted"
								key={node.id}
								style={{ marginLeft: `${node.level * 24}px` }}
							>
								<div
									className={cn(
										'h-3 w-3 rounded-full',
										node.type === 'object' && 'bg-blue-500',
										node.type === 'array' && 'bg-green-500',
										node.type === 'string' && 'bg-yellow-500',
										node.type === 'number' && 'bg-orange-500',
										node.type === 'boolean' && 'bg-purple-500',
										node.type === 'null' && 'bg-gray-400'
									)}
								/>
								<span className="font-mono text-sm">{node.label}</span>
								<Badge className="ml-auto text-xs" variant="outline">
									{node.type}
								</Badge>
							</div>
						))}
				</div>
			</div>
		</ScrollArea>
	);
}

// ============ COMPONENTE PRINCIPAL ============

export function JsonAdvancedViewer({ content, fileName, className }: JsonAdvancedViewerProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('tree');
	const [searchTerm, setSearchTerm] = useState('');

	const data = useMemo(() => parseJSON(content), [content]);

	if (data === null) {
		return (
			<div className={cn('flex h-[500px] items-center justify-center text-destructive', className)}>
				Invalid JSON format
			</div>
		);
	}

	const availableModes: ViewMode[] = useMemo(() => {
		const modes: ViewMode[] = ['tree'];
		if (isArrayOfObjects(data)) {
			modes.push('table');
			if (hasNumericFields(data)) modes.push('stats');
		}
		if (isObject(data) || Array.isArray(data)) {
			modes.push('cards');
			modes.push('graph');
		}
		return modes;
	}, [data]);

	const handleCopy = () => {
		navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
	};

	const handleDownload = () => {
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName || 'data.json';
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Card className={cn('flex flex-col', className)}>
			{/* Toolbar */}
			<div className="flex items-center justify-between border-b p-4">
				<div className="flex items-center gap-2">
					{availableModes.includes('tree') && (
						<Button onClick={() => setViewMode('tree')} size="sm" variant={viewMode === 'tree' ? 'default' : 'outline'}>
							<TreePine className="mr-1 h-4 w-4" />
							Tree
						</Button>
					)}
					{availableModes.includes('table') && (
						<Button
							onClick={() => setViewMode('table')}
							size="sm"
							variant={viewMode === 'table' ? 'default' : 'outline'}
						>
							<Table2 className="mr-1 h-4 w-4" />
							Table
						</Button>
					)}
					{availableModes.includes('cards') && (
						<Button
							onClick={() => setViewMode('cards')}
							size="sm"
							variant={viewMode === 'cards' ? 'default' : 'outline'}
						>
							<LayoutGrid className="mr-1 h-4 w-4" />
							Cards
						</Button>
					)}
					{availableModes.includes('stats') && (
						<Button
							onClick={() => setViewMode('stats')}
							size="sm"
							variant={viewMode === 'stats' ? 'default' : 'outline'}
						>
							<BarChart3 className="mr-1 h-4 w-4" />
							Stats
						</Button>
					)}
					{availableModes.includes('graph') && (
						<Button
							onClick={() => setViewMode('graph')}
							size="sm"
							variant={viewMode === 'graph' ? 'default' : 'outline'}
						>
							<Network className="mr-1 h-4 w-4" />
							Graph
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					{viewMode === 'tree' && (
						<div className="relative">
							<Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								className="w-48 pl-8"
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search keys..."
								value={searchTerm}
							/>
						</div>
					)}
					<Button onClick={handleCopy} size="icon" title="Copy JSON" variant="outline">
						<Copy className="h-4 w-4" />
					</Button>
					<Button onClick={handleDownload} size="icon" title="Download JSON" variant="outline">
						<Download className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1">
				{viewMode === 'tree' && <TreeView data={data} searchTerm={searchTerm} />}
				{viewMode === 'table' && <TableView data={data} />}
				{viewMode === 'cards' && <CardsView data={data} />}
				{viewMode === 'stats' && <StatsView data={data} />}
				{viewMode === 'graph' && <GraphView data={data} />}
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between border-t p-2 text-muted-foreground text-xs">
				<span>
					{isObject(data) && `${Object.keys(data).length} keys`}
					{Array.isArray(data) && `${data.length} items`}
				</span>
				<span>{fileName}</span>
			</div>
		</Card>
	);
}

export default JsonAdvancedViewer;
