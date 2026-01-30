import { type ReactNode, useEffect, useRef, useState } from 'react';
import { JsonViewer } from '@/components/panels/details-panel/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Switch } from './switch';
import { Tabs, TabsList, TabsTrigger } from './tabs';

export interface LogEntry {
	id: string;
	timestamp: string;
	level: 'debug' | 'info' | 'warn' | 'error' | 'success';
	message: string;
	context?: string;
	data?: any;
}

interface LogViewerProps {
	title?: string;
	logs?: LogEntry[];
	maxHeight?: string;
	autoScroll?: boolean;
	onClear?: () => void;
	className?: string;
}

const LOG_COLORS = {
	debug: 'bg-ui-info text-ui-info-text',
	info: 'bg-ui-success text-ui-success-text',
	warn: 'bg-ui-warning text-ui-warning-text',
	error: 'bg-ui-error text-ui-error-text',
	success: 'bg-ui-success text-ui-success-text',
};

const LOG_ICONS = {
	debug: '🔍',
	info: 'ℹ️',
	warn: '⚠️',
	error: '❌',
	success: '✅',
};

// Helper function to safely render log data
const renderLogData = (data: unknown): ReactNode => {
	try {
		return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
	} catch {
		return String(data);
	}
};

function renderEntry(log: LogEntry, showTimestamp: boolean) {
	let logDataComponent: ReactNode = null;

	if (log.data) {
		if (typeof log.data === 'string') {
			// Si es string, verificar si es JSON válido
			try {
				JSON.parse(log.data);
				// Es JSON válido, usar JsonViewer
				logDataComponent = <JsonViewer className="mt-1" content={log.data} defaultExpanded={false} maxHeight={200} />;
			} catch {
				// No es JSON, mostrar como texto simple
				logDataComponent = <pre className="mt-1 overflow-x-auto text-xs">{log.data}</pre>;
			}
		} else {
			// Es objeto, usar JsonViewer
			try {
				const jsonString = JSON.stringify(log.data, null, 2);
				logDataComponent = <JsonViewer className="mt-1" content={jsonString} defaultExpanded={false} maxHeight={200} />;
			} catch {
				logDataComponent = <pre className="mt-1 overflow-x-auto text-xs">{String(log.data)}</pre>;
			}
		}
	}

	return (
		<div className={cn('break-all rounded p-2 font-mono text-sm', LOG_COLORS[log.level])} key={log.id}>
			{showTimestamp && <span className="mr-2 opacity-70">[{log.timestamp}]</span>}
			<span className="mr-1">{LOG_ICONS[log.level]}</span>
			{log.context && <span className="mr-1 font-semibold">[{log.context}]</span>}
			<span>{log.message}</span>
			{logDataComponent}
		</div>
	);
}

export function LogViewer({
	title = 'Logs',
	logs = [],
	maxHeight = '400px',
	autoScroll = true,
	onClear,
	className,
}: LogViewerProps) {
	const [activeTab, setActiveTab] = useState<string>('all');
	const [filter, setFilter] = useState<string>('');
	const [showTimestamp, setShowTimestamp] = useState<boolean>(true);
	const scrollRef = useRef<HTMLDivElement>(null);

	// Filtrar logs según la pestaña activa y el filtro de texto
	const filteredLogs = logs.filter((log) => {
		// Filtrar por nivel
		if (activeTab !== 'all' && log.level !== activeTab) {
			return false;
		}

		// Filtrar por texto
		if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
			return false;
		}

		return true;
	});

	// Auto-scroll al último log
	useEffect(() => {
		if (autoScroll && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [autoScroll]);

	// Contar logs por nivel
	const logCounts = logs.reduce(
		(acc, log) => {
			acc[log.level] = (acc[log.level] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle>{title}</CardTitle>
					<div className="flex items-center gap-2">
						<Badge className="text-xs" variant="outline">
							{filteredLogs.length} logs
						</Badge>
						{onClear && (
							<Button onClick={onClear} size="sm" type="button" variant="ghost">
								Limpiar
							</Button>
						)}
					</div>
				</div>
				<div className="mt-2 flex items-center gap-2">
					<Input
						className="h-8 text-sm"
						onChange={(e) => setFilter(e.target.value)}
						placeholder="Filtrar logs..."
						value={filter}
					/>
					<div className="flex items-center space-x-2">
						<Switch checked={showTimestamp} id="show-timestamp" onCheckedChange={setShowTimestamp} />
						<Label className="text-xs" htmlFor="show-timestamp">
							Timestamp
						</Label>
					</div>
				</div>
			</CardHeader>

			<Tabs className="px-4" onValueChange={setActiveTab} value={activeTab}>
				<TabsList className="grid h-8 grid-cols-5">
					<TabsTrigger className="text-xs" value="all">
						Todos
						<Badge className="ml-1 text-xs" variant="secondary">
							{logs.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger className="text-xs" value="debug">
						Debug
						<Badge className="ml-1 text-xs" variant="secondary">
							{logCounts.debug || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger className="text-xs" value="info">
						Info
						<Badge className="ml-1 text-xs" variant="secondary">
							{logCounts.info || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger className="text-xs" value="warn">
						Warn
						<Badge className="ml-1 text-xs" variant="secondary">
							{logCounts.warn || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger className="text-xs" value="error">
						Error
						<Badge className="ml-1 text-xs" variant="secondary">
							{logCounts.error || 0}
						</Badge>
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<CardContent className="p-0">
				<ScrollArea className="mx-4 mb-4 rounded-md border" ref={scrollRef} style={{ height: maxHeight }}>
					{filteredLogs.length === 0 ? (
						<div className="flex h-20 items-center justify-center text-muted-foreground">No hay logs para mostrar</div>
					) : (
						<div className="space-y-1 p-2">{filteredLogs.map((log) => renderEntry(log, showTimestamp))}</div>
					)}
				</ScrollArea>
			</CardContent>

			<CardFooter className="flex justify-between py-2">
				<div className="text-muted-foreground text-xs">
					{(() => {
						if (logs.length === 0) {
							return 'No hay logs';
						}
						const last = logs.at(-1);
						if (!last) {
							return 'No hay logs';
						}
						return `Último log: ${new Date(last.timestamp).toLocaleTimeString()}`;
					})()}
				</div>
				<div className="flex gap-1">
					{Object.entries(logCounts).map(([level, count]) => (
						<Badge
							className={cn('text-xs', LOG_COLORS[level as keyof typeof LOG_COLORS])}
							key={level}
							variant="outline"
						>
							{level}: {count}
						</Badge>
					))}
				</div>
			</CardFooter>
		</Card>
	);
}

// Hook para usar el LogViewer con estado local
export function useLogViewer() {
	const [logs, setLogs] = useState<LogEntry[]>([]);

	const addLog = (level: LogEntry['level'], message: string, context?: string, data?: LogEntry['data']) => {
		const newLog: LogEntry = {
			id: Date.now().toString(),
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			data,
		};

		setLogs((prev) => [...prev, newLog]);
	};

	const clearLogs = () => {
		setLogs([]);
	};

	return {
		logs,
		addLog,
		clearLogs,
		debug: (message: string, context?: string, data?: LogEntry['data']) => addLog('debug', message, context, data),
		info: (message: string, context?: string, data?: LogEntry['data']) => addLog('info', message, context, data),
		warn: (message: string, context?: string, data?: LogEntry['data']) => addLog('warn', message, context, data),
		error: (message: string, context?: string, data?: LogEntry['data']) => addLog('error', message, context, data),
		success: (message: string, context?: string, data?: LogEntry['data']) => addLog('success', message, context, data),
	};
}
