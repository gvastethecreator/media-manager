'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { ScrollArea } from './scroll-area';
import { Switch } from './switch';
import { Tabs, TabsList, TabsTrigger } from './tabs';

export interface LogEntry {
	id: string;
	timestamp: string;
	level: 'debug' | 'info' | 'warn' | 'error' | 'success';
	message: string;
	context?: string;
	data?: unknown;
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
	debug: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
	info: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
	warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
	error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
	success: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
};

const LOG_ICONS = {
	debug: '🔍',
	info: 'ℹ️',
	warn: '⚠️',
	error: '❌',
	success: '✅',
};

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
						<Badge variant="outline" className="text-xs">
							{filteredLogs.length} logs
						</Badge>
						{onClear && (
							<Button type="button" variant="ghost" size="sm" onClick={onClear}>
								Limpiar
							</Button>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2 mt-2">
					<Input
						placeholder="Filtrar logs..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						className="h-8 text-sm"
					/>
					<div className="flex items-center space-x-2">
						<Switch id="show-timestamp" checked={showTimestamp} onCheckedChange={setShowTimestamp} />
						<Label htmlFor="show-timestamp" className="text-xs">
							Timestamp
						</Label>
					</div>
				</div>
			</CardHeader>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
				<TabsList className="grid grid-cols-5 h-8">
					<TabsTrigger value="all" className="text-xs">
						Todos
						<Badge variant="secondary" className="ml-1 text-xs">
							{logs.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="debug" className="text-xs">
						Debug
						<Badge variant="secondary" className="ml-1 text-xs">
							{logCounts.debug || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="info" className="text-xs">
						Info
						<Badge variant="secondary" className="ml-1 text-xs">
							{logCounts.info || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="warn" className="text-xs">
						Warn
						<Badge variant="secondary" className="ml-1 text-xs">
							{logCounts.warn || 0}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="error" className="text-xs">
						Error
						<Badge variant="secondary" className="ml-1 text-xs">
							{logCounts.error || 0}
						</Badge>
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<CardContent className="p-0">
				<ScrollArea ref={scrollRef} className="border rounded-md mx-4 mb-4" style={{ height: maxHeight }}>
					{filteredLogs.length === 0 ? (
						<div className="flex items-center justify-center h-20 text-muted-foreground">No hay logs para mostrar</div>
					) : (
						<div className="p-2 space-y-1">
							{filteredLogs.map((log) => (
								<div key={log.id} className={cn('p-2 rounded text-sm font-mono break-all', LOG_COLORS[log.level])}>
									{showTimestamp && <span className="opacity-70 mr-2">[{log.timestamp}]</span>}
									<span className="mr-1">{LOG_ICONS[log.level]}</span>
									{log.context && <span className="font-semibold mr-1">[{log.context}]</span>}
									<span>{log.message}</span>
									{Boolean(log.data) && (
										<pre className="mt-1 text-xs overflow-x-auto">
											{typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
										</pre>
									)}
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</CardContent>

			<CardFooter className="flex justify-between py-2">
				<div className="text-xs text-muted-foreground">
					{logs.length > 0
						? `Último log: ${new Date(logs[logs.length - 1].timestamp).toLocaleTimeString()}`
						: 'No hay logs'}
				</div>
				<div className="flex gap-1">
					{Object.entries(logCounts).map(([level, count]) => (
						<Badge
							key={level}
							variant="outline"
							className={cn('text-xs', LOG_COLORS[level as keyof typeof LOG_COLORS])}
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

	const addLog = (level: LogEntry['level'], message: string, context?: string, data?: unknown) => {
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
		debug: (message: string, context?: string, data?: unknown) => addLog('debug', message, context, data),
		info: (message: string, context?: string, data?: unknown) => addLog('info', message, context, data),
		warn: (message: string, context?: string, data?: unknown) => addLog('warn', message, context, data),
		error: (message: string, context?: string, data?: unknown) => addLog('error', message, context, data),
		success: (message: string, context?: string, data?: unknown) => addLog('success', message, context, data),
	};
}
