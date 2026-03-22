'use client';

import {
	Background,
	BackgroundVariant,
	Controls,
	Handle,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import '@xyflow/react/dist/style.css';
import { Check, Code2, Copy, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface JsonFlowViewerProps {
	className?: string;
	content: string;
	fileName?: string;
}

// Componente de nodo personalizado para el diagrama
function JsonNode({ data }: { data: { label: string; value: string; type: string } }) {
	const isObject = data.type === 'object';
	const isArray = data.type === 'array';

	return (
		<div
			className={cn(
				'min-w-[120px] max-w-[200px] rounded-lg border-2 p-3',
				isObject && 'border-blue-500 bg-blue-50 dark:bg-blue-950',
				isArray && 'border-green-500 bg-green-50 dark:bg-green-950',
				!(isObject || isArray) && 'border-gray-300 bg-white dark:bg-gray-800'
			)}
		>
			<Handle id="top" position={Position.Top} type="target" />
			<div className="mb-1 truncate font-semibold text-xs">{data.label}</div>
			<div className="truncate text-[10px] text-muted-foreground">
				{isObject ? '{...}' : isArray ? `[${data.value}]` : String(data.value).slice(0, 30)}
			</div>
			<Handle id="bottom" position={Position.Bottom} type="source" />
		</div>
	);
}

const nodeTypes = {
	jsonNode: JsonNode,
};

// Función para convertir JSON a nodos y edges
function jsonToFlow(json: unknown, parentId: string | null = null, key = 'root', depth = 0) {
	const nodes: Array<{
		id: string;
		type: string;
		position: { x: number; y: number };
		data: { label: string; value: string; type: string };
	}> = [];
	const edges: Array<{ id: string; source: string; target: string }> = [];
	const id = parentId ? `${parentId}-${key}` : key;

	if (depth > 8) {
		nodes.push({
			id,
			type: 'jsonNode',
			position: { x: 0, y: 0 },
			data: { label: key, value: '...', type: 'max-depth' },
		});
		return { nodes, edges };
	}

	if (Array.isArray(json)) {
		nodes.push({
			id,
			type: 'jsonNode',
			position: { x: 0, y: 0 },
			data: { label: key, value: String(json.length), type: 'array' },
		});

		json.forEach((item, index) => {
			const childResult = jsonToFlow(item, id, `[${index}]`, depth + 1);
			nodes.push(...childResult.nodes);
			edges.push(...childResult.edges);
			edges.push({
				id: `${id}-[${index}]`,
				source: id,
				target: `${id}-[${index}]`,
			});
		});
	} else if (typeof json === 'object' && json !== null) {
		nodes.push({
			id,
			type: 'jsonNode',
			position: { x: 0, y: 0 },
			data: { label: key, value: String(Object.keys(json).length), type: 'object' },
		});

		Object.entries(json).forEach(([childKey, value]) => {
			const childResult = jsonToFlow(value, id, childKey, depth + 1);
			nodes.push(...childResult.nodes);
			edges.push(...childResult.edges);
			edges.push({
				id: `${id}-${childKey}`,
				source: id,
				target: `${id}-${childKey}`,
			});
		});
	} else {
		nodes.push({
			id,
			type: 'jsonNode',
			position: { x: 0, y: 0 },
			data: { label: key, value: String(json), type: typeof json },
		});
	}

	return { nodes, edges };
}

// Layout simple para posicionar nodos
function layoutNodes(
	nodes: Array<{
		id: string;
		type: string;
		position: { x: number; y: number };
		data: { label: string; value: string; type: string };
	}>,
	edges: Array<{ id: string; source: string; target: string }>
) {
	const nodeLevels: Record<string, number> = {};

	const setLevel = (nodeId: string, level: number): void => {
		if (nodeLevels[nodeId] !== undefined && nodeLevels[nodeId] >= level) return;
		nodeLevels[nodeId] = level;

		const children = edges.filter((e) => e.source === nodeId).map((e) => e.target);
		for (const child of children) {
			setLevel(child, level + 1);
		}
	};

	const rootNodes = nodes.filter((n) => !edges.some((e) => e.target === n.id));
	for (const root of rootNodes) {
		setLevel(root.id, 0);
	}

	const levelCounts: Record<number, number> = {};
	nodes.forEach((node) => {
		const level = nodeLevels[node.id] || 0;
		if (!levelCounts[level]) levelCounts[level] = 0;

		node.position = {
			x: levelCounts[level] * 180,
			y: level * 100,
		};
		levelCounts[level]++;
	});

	return nodes;
}

export function JsonFlowViewer({ content, fileName, className }: JsonFlowViewerProps) {
	const [activeTab, setActiveTab] = useState('code');
	const [copied, setCopied] = useState(false);

	const parsedJson = useMemo(() => {
		try {
			return JSON.parse(content);
		} catch (e) {
			return null;
		}
	}, [content]);

	const prettyJson = useMemo(() => {
		try {
			return JSON.stringify(parsedJson, null, 2);
		} catch (e) {
			return content;
		}
	}, [parsedJson, content]);

	const { initialNodes, initialEdges } = useMemo(() => {
		if (!parsedJson) return { initialNodes: [], initialEdges: [] };

		const { nodes, edges } = jsonToFlow(parsedJson);
		const laidOutNodes = layoutNodes(nodes, edges);

		return {
			initialNodes: laidOutNodes,
			initialEdges: edges,
		};
	}, [parsedJson]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	useEffect(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialNodes, initialEdges, setNodes, setEdges]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(prettyJson);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Error copying to clipboard:', err);
		}
	}, [prettyJson]);

	if (!parsedJson) {
		return (
			<Card className={cn('flex h-full flex-col p-6', className)}>
				<div className="text-destructive">Error: JSON inválido</div>
				<div className="mt-4 flex-1 overflow-auto">
					<pre className="text-muted-foreground text-sm">{content}</pre>
				</div>
			</Card>
		);
	}

	return (
		<Card className={cn('flex h-full w-full flex-col overflow-hidden', className)}>
			{/* Header */}
			<div className="flex shrink-0 items-center justify-between border-b p-3">
				<div className="min-w-0">
					<h3 className="truncate font-semibold text-sm">{fileName || 'JSON Viewer'}</h3>
					<p className="text-muted-foreground text-xs">
						{Array.isArray(parsedJson)
							? `Array [${parsedJson.length} items]`
							: `Object {${Object.keys(parsedJson).length} keys}`}
					</p>
				</div>
				<Button onClick={handleCopy} size="sm" variant="outline">
					{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
					{copied ? 'Copiado!' : 'Copiar'}
				</Button>
			</div>

			{/* Tabs */}
			<Tabs className="flex min-h-0 flex-1 flex-col" onValueChange={setActiveTab} value={activeTab}>
				<TabsList className="mx-4 mt-2 shrink-0">
					<TabsTrigger className="flex items-center gap-2 text-xs" value="code">
						<Code2 className="h-3 w-3" />
						JSON
					</TabsTrigger>
					<TabsTrigger className="flex items-center gap-2 text-xs" value="diagram">
						<FolderTree className="h-3 w-3" />
						Diagrama
					</TabsTrigger>
				</TabsList>

				<TabsContent className="m-0 min-h-0 flex-1 p-3" value="diagram">
					<div className="h-full w-full overflow-hidden rounded-lg border">
						{nodes.length > 0 ? (
							<ReactFlow
								edges={edges}
								fitView
								fitViewOptions={{ padding: 0.2 }}
								maxZoom={2}
								minZoom={0.1}
								nodes={nodes}
								nodeTypes={nodeTypes}
								onEdgesChange={onEdgesChange}
								onNodesChange={onNodesChange}
								proOptions={{ hideAttribution: true }}
							>
								<Background gap={12} size={1} variant={BackgroundVariant.Dots} />
								<Controls className="m-2" />
							</ReactFlow>
						) : (
							<div className="flex h-full items-center justify-center text-muted-foreground">Estructura vacía</div>
						)}
					</div>
				</TabsContent>

				<TabsContent className="m-0 min-h-0 flex-1 p-3" value="code">
					<div className="h-full overflow-auto rounded-lg bg-muted p-4">
						<pre className="whitespace-pre-wrap font-mono text-xs">{prettyJson}</pre>
					</div>
				</TabsContent>
			</Tabs>
		</Card>
	);
}

export default JsonFlowViewer;
