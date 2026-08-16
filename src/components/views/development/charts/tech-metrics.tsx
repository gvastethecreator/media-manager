import { Cpu, Database, HardDrive, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHART_COLORS, METRIC_COLORS } from '@/lib/styles/chart-colors';
import { enUSLocale, formatDistanceToNow } from '@/lib/utils/date';
import { useTechMetrics } from '../hooks/use-tech-metrics';

// Formateador para números
const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('es-ES').format(num);
};

function toNumberValue(value: unknown): number {
	if (Array.isArray(value)) return Number(value[0] ?? 0);
	return Number(value ?? 0);
}

// Formateador para segundos a texto legible
const formatUptime = (seconds: number): string => {
	return formatDistanceToNow(Date.now() - seconds * 1000, { locale: enUSLocale });
};

// Componente para mostrar las métricas del sistema
export function SystemMetricsPanel() {
	const { technicalMetrics, fileSystemPerformance, imageProcessingPerformance, isLoading } = useTechMetrics();

	// Historia de la CPU para mostrar en un gráfico
	const [cpuHistory, setCpuHistory] = useState<
		Array<{
			time: string;
			usage: number;
		}>
	>([]);

	// Historia de la memoria para mostrar en un gráfico
	const [memoryHistory, setMemoryHistory] = useState<
		Array<{
			time: string;
			used: number;
			free: number;
		}>
	>([]);

	// Actualizar historial de CPU y memoria cuando cambian los datos
	useEffect(() => {
		if (!technicalMetrics) {
			return;
		}

		const now = new Date().toLocaleTimeString();

		// Actualizar historial de CPU
		setCpuHistory((prevHistory) => {
			const newHistory = [
				...prevHistory,
				{
					time: now,
					usage: technicalMetrics.systemInfo.cpuUsage.overall,
				},
			];

			// Mantener solo los últimos 10 puntos de datos
			if (newHistory.length > 10) {
				return newHistory.slice(newHistory.length - 10);
			}

			return newHistory;
		});

		// Actualizar historial de memoria
		setMemoryHistory((prevHistory) => {
			const newHistory = [
				...prevHistory,
				{
					time: now,
					used: technicalMetrics.systemInfo.memoryUsage.used,
					free: technicalMetrics.systemInfo.memoryUsage.free,
				},
			];

			// Mantener solo los últimos 10 puntos de datos
			if (newHistory.length > 10) {
				return newHistory.slice(newHistory.length - 10);
			}

			return newHistory;
		});
	}, [technicalMetrics]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				<span>Loading technical metrics...</span>
			</div>
		);
	}

	if (!(technicalMetrics && fileSystemPerformance && imageProcessingPerformance)) {
		return <div className="p-4 text-center text-muted-foreground">Technical metrics could not be loaded.</div>;
	}

	return (
		<Tabs className="w-full" defaultValue="system">
			<TabsList className="grid w-full grid-cols-3">
				<TabsTrigger className="flex items-center gap-2" value="system">
					<Cpu className="h-4 w-4" />
					System
				</TabsTrigger>
				<TabsTrigger className="flex items-center gap-2" value="database">
					<Database className="h-4 w-4" />
					Database & API
				</TabsTrigger>
				<TabsTrigger className="flex items-center gap-2" value="filesystem">
					<HardDrive className="h-4 w-4" />
					File System
				</TabsTrigger>
			</TabsList>

			<TabsContent className="mt-4 space-y-4" value="system">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{/* Información del sistema */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">System Information</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Platform:</span>
								<span className="font-medium text-sm">{technicalMetrics.systemInfo.platform}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Node version:</span>
								<span className="font-medium text-sm">{technicalMetrics.systemInfo.nodeVersion}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Uptime:</span>
								<span className="font-medium text-sm">{formatUptime(technicalMetrics.systemInfo.uptime)}</span>
							</div>
						</CardContent>
					</Card>

					{/* Gráfico de CPU */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">CPU Usage</CardTitle>
							<div className="flex items-center gap-2">
								<Progress className="h-2" value={technicalMetrics.systemInfo.cpuUsage.overall} />
								<span className="font-medium text-sm">{technicalMetrics.systemInfo.cpuUsage.overall}%</span>
							</div>
						</CardHeader>
						<CardContent className="h-[180px]">
							<ResponsiveContainer height="100%" width="100%">
								<LineChart data={cpuHistory}>
									<XAxis dataKey="time" tick={{ fontSize: 10 }} />
									<YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value) => [`${toNumberValue(value)}%`, 'CPU Usage']}
										labelFormatter={(time) => `Time: ${time}`}
									/>
									<Line dataKey="usage" stroke={METRIC_COLORS.cpu} strokeWidth={2} type="monotone" />
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Gráfico de Memoria */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Memory Usage</CardTitle>
							<div className="flex items-center gap-2">
								<Progress
									className="h-2"
									value={
										(technicalMetrics.systemInfo.memoryUsage.used / technicalMetrics.systemInfo.memoryUsage.total) * 100
									}
								/>
								<span className="font-medium text-sm">
									{technicalMetrics.systemInfo.memoryUsage.used} / {technicalMetrics.systemInfo.memoryUsage.total} MB
								</span>
							</div>
						</CardHeader>
						<CardContent className="h-[180px]">
							<ResponsiveContainer height="100%" width="100%">
								<AreaChart data={memoryHistory}>
									<XAxis dataKey="time" tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value) => [`${toNumberValue(value)} MB`, 'Memory']}
										labelFormatter={(time) => `Time: ${time}`}
									/>
									<Area
										dataKey="used"
										fill={METRIC_COLORS.memory}
										stackId="1"
										stroke={METRIC_COLORS.memory}
										type="monotone"
									/>
									<Area
										dataKey="free"
										fill={METRIC_COLORS.memoryFree}
										stackId="1"
										stroke={METRIC_COLORS.memoryFree}
										type="monotone"
									/>
									<Legend />
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Uso por núcleo */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Usage by Core</CardTitle>
						</CardHeader>
						<CardContent className="h-[180px]">
							<ResponsiveContainer height="100%" width="100%">
								<BarChart
									data={technicalMetrics.systemInfo.cpuUsage.cores.map((usage, index) => ({
										name: `CPU ${index + 1}`,
										usage,
									}))}
								>
									<XAxis dataKey="name" tick={{ fontSize: 10 }} />
									<YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value) => [`${toNumberValue(value)}%`, 'Usage']}
										labelFormatter={(name) => `${name}`}
									/>
									<Bar dataKey="usage" fill={CHART_COLORS.primary} />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent className="mt-4 space-y-4" value="database">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{/* Métricas de la Base de Datos */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Database Metrics</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Pool size:</span>
								<span className="font-medium text-sm">{technicalMetrics.databaseMetrics.connectionPoolSize}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Active connections:</span>
								<span className="font-medium text-sm">{technicalMetrics.databaseMetrics.activeConnections}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Response time:</span>
								<span className="font-medium text-sm">
									{technicalMetrics.databaseMetrics.queryResponseTime.toFixed(2)} ms
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Total queries:</span>
								<span className="font-medium text-sm">
									{formatNumber(technicalMetrics.databaseMetrics.totalQueries)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Error rate:</span>
								<Badge variant={technicalMetrics.databaseMetrics.errorRate < 1 ? 'default' : 'secondary'}>
									{technicalMetrics.databaseMetrics.errorRate.toFixed(2)}%
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Métricas de la API */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">API Metrics</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Requests per minute:</span>
								<span className="font-medium text-sm">{technicalMetrics.apiMetrics.requestsPerMinute}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Response time:</span>
								<span className="font-medium text-sm">
									{technicalMetrics.apiMetrics.averageResponseTime.toFixed(2)} ms
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Error rate:</span>
								<Badge variant={technicalMetrics.apiMetrics.errorRate < 1 ? 'default' : 'secondary'}>
									{technicalMetrics.apiMetrics.errorRate.toFixed(2)}%
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Endpoints principales */}
					<Card className="md:col-span-2">
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Top Endpoints</CardTitle>
						</CardHeader>
						<CardContent className="h-[200px]">
							<ResponsiveContainer height="100%" width="100%">
								<BarChart
									data={technicalMetrics.apiMetrics.topEndpoints}
									layout="vertical"
									margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
								>
									<XAxis tick={{ fontSize: 10 }} type="number" />
									<YAxis dataKey="endpoint" tick={{ fontSize: 10 }} type="category" width={80} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value) => [formatNumber(toNumberValue(value)), 'Requests']}
										labelFormatter={(name) => `Endpoint: ${name}`}
									/>
									<Bar dataKey="hits" fill={CHART_COLORS.primary} />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent className="mt-4 space-y-4" value="filesystem">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{/* Rendimiento del sistema de archivos */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">I/O Performance</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Read speed:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.readSpeed} MB/s</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Write speed:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.writeSpeed} MB/s</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Access time:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.averageAccessTime.toFixed(2)} ms</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Read IOPS:</span>
								<span className="font-medium text-sm">{formatNumber(fileSystemPerformance.iopsRead)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Write IOPS:</span>
								<span className="font-medium text-sm">{formatNumber(fileSystemPerformance.iopsWrite)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Current operations:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.currentOperations}</span>
							</div>
						</CardContent>
					</Card>

					{/* Comparación de velocidad */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">I/O Speeds</CardTitle>
						</CardHeader>
						<CardContent className="h-[200px]">
							<ResponsiveContainer height="100%" width="100%">
								<BarChart
									data={[
										{ name: 'Read', value: fileSystemPerformance.readSpeed },
										{
											name: 'Write',
											value: fileSystemPerformance.writeSpeed,
										},
									]}
									margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
								>
									<XAxis dataKey="name" tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value) => [`${toNumberValue(value)} MB/s`, 'Speed']}
										labelFormatter={(name) => `Operation: ${name}`}
									/>
									<Bar dataKey="value" fill={CHART_COLORS.primary}>
										<Cell fill={METRIC_COLORS.io.read} />
										<Cell fill={METRIC_COLORS.io.write} />
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Procesamiento de imágenes */}
					<Card className="md:col-span-2">
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Image Processing</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Average processing time</span>
									<span className="font-medium text-lg">{imageProcessingPerformance.averageProcessingTime} ms</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Images processed per hour</span>
									<span className="font-medium text-lg">
										{formatNumber(imageProcessingPerformance.imagesProcessedPerHour)}
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Batch size</span>
									<span className="font-medium text-lg">{imageProcessingPerformance.batchSize}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Memory per image</span>
									<span className="font-medium text-lg">
										{imageProcessingPerformance.memoryUsagePerImage.toFixed(2)} MB
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Queue size</span>
									<span className="font-medium text-lg">{imageProcessingPerformance.queueSize}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Success rate</span>
									<Badge variant={imageProcessingPerformance.successRate > 99 ? 'default' : 'secondary'}>
										{imageProcessingPerformance.successRate.toFixed(2)}%
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</TabsContent>
		</Tabs>
	);
}
