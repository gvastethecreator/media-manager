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
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHART_COLORS, METRIC_COLORS } from '@/lib/styles/chart-colors';
import { esLocale, formatDistanceToNow } from '@/lib/utils/date';
import { useTechMetrics } from '../hooks/use-tech-metrics';

// Formateador para números
const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('es-ES').format(num);
};

function toNumberValue(value: ValueType): number {
	if (Array.isArray(value)) return Number(value[0] ?? 0);
	return Number(value ?? 0);
}

// Formateador para segundos a texto legible
const formatUptime = (seconds: number): string => {
	return formatDistanceToNow(Date.now() - seconds * 1000, { locale: esLocale });
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
				<span>Cargando métricas técnicas...</span>
			</div>
		);
	}

	if (!(technicalMetrics && fileSystemPerformance && imageProcessingPerformance)) {
		return <div className="p-4 text-center text-muted-foreground">No se pudieron cargar las métricas técnicas.</div>;
	}

	return (
		<Tabs className="w-full" defaultValue="system">
			<TabsList className="grid w-full grid-cols-3">
				<TabsTrigger className="flex items-center gap-2" value="system">
					<Cpu className="h-4 w-4" />
					Sistema
				</TabsTrigger>
				<TabsTrigger className="flex items-center gap-2" value="database">
					<Database className="h-4 w-4" />
					Base de Datos & API
				</TabsTrigger>
				<TabsTrigger className="flex items-center gap-2" value="filesystem">
					<HardDrive className="h-4 w-4" />
					Sistema de Archivos
				</TabsTrigger>
			</TabsList>

			<TabsContent className="mt-4 space-y-4" value="system">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{/* Información del sistema */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Información del Sistema</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Plataforma:</span>
								<span className="font-medium text-sm">{technicalMetrics.systemInfo.platform}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Versión de Node:</span>
								<span className="font-medium text-sm">{technicalMetrics.systemInfo.nodeVersion}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Tiempo activo:</span>
								<span className="font-medium text-sm">{formatUptime(technicalMetrics.systemInfo.uptime)}</span>
							</div>
						</CardContent>
					</Card>

					{/* Gráfico de CPU */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Uso de CPU</CardTitle>
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
										formatter={(value: ValueType) => [`${toNumberValue(value)}%`, 'Uso de CPU']}
										labelFormatter={(time) => `Hora: ${time}`}
									/>
									<Line dataKey="usage" stroke={METRIC_COLORS.cpu} strokeWidth={2} type="monotone" />
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Gráfico de Memoria */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Uso de Memoria</CardTitle>
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
										formatter={(value: ValueType) => [`${toNumberValue(value)} MB`, 'Memoria']}
										labelFormatter={(time) => `Hora: ${time}`}
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
							<CardTitle className="font-medium text-sm">Uso por Núcleo</CardTitle>
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
										formatter={(value: ValueType) => [`${toNumberValue(value)}%`, 'Uso']}
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
							<CardTitle className="font-medium text-sm">Métricas de Base de Datos</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Tamaño del pool:</span>
								<span className="font-medium text-sm">{technicalMetrics.databaseMetrics.connectionPoolSize}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Conexiones activas:</span>
								<span className="font-medium text-sm">{technicalMetrics.databaseMetrics.activeConnections}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Tiempo de respuesta:</span>
								<span className="font-medium text-sm">
									{technicalMetrics.databaseMetrics.queryResponseTime.toFixed(2)} ms
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Consultas totales:</span>
								<span className="font-medium text-sm">
									{formatNumber(technicalMetrics.databaseMetrics.totalQueries)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Tasa de error:</span>
								<Badge variant={technicalMetrics.databaseMetrics.errorRate < 1 ? 'default' : 'secondary'}>
									{technicalMetrics.databaseMetrics.errorRate.toFixed(2)}%
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Métricas de la API */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Métricas de API</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Solicitudes por minuto:</span>
								<span className="font-medium text-sm">{technicalMetrics.apiMetrics.requestsPerMinute}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Tiempo de respuesta:</span>
								<span className="font-medium text-sm">
									{technicalMetrics.apiMetrics.averageResponseTime.toFixed(2)} ms
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Tasa de error:</span>
								<Badge variant={technicalMetrics.apiMetrics.errorRate < 1 ? 'default' : 'secondary'}>
									{technicalMetrics.apiMetrics.errorRate.toFixed(2)}%
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Endpoints principales */}
					<Card className="md:col-span-2">
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Endpoints Principales</CardTitle>
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
										formatter={(value: ValueType) => [
											formatNumber(toNumberValue(value)),
											'Solicitudes',
										]}
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
							<CardTitle className="font-medium text-sm">Rendimiento de E/S</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Velocidad de lectura:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.readSpeed} MB/s</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Velocidad de escritura:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.writeSpeed} MB/s</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Tiempo de acceso:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.averageAccessTime.toFixed(2)} ms</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">IOPS lectura:</span>
								<span className="font-medium text-sm">{formatNumber(fileSystemPerformance.iopsRead)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">IOPS escritura:</span>
								<span className="font-medium text-sm">{formatNumber(fileSystemPerformance.iopsWrite)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Operaciones actuales:</span>
								<span className="font-medium text-sm">{fileSystemPerformance.currentOperations}</span>
							</div>
						</CardContent>
					</Card>

					{/* Comparación de velocidad */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-sm">Velocidades de E/S</CardTitle>
						</CardHeader>
						<CardContent className="h-[200px]">
							<ResponsiveContainer height="100%" width="100%">
								<BarChart
									data={[
										{ name: 'Lectura', value: fileSystemPerformance.readSpeed },
										{
											name: 'Escritura',
											value: fileSystemPerformance.writeSpeed,
										},
									]}
									margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
								>
									<XAxis dataKey="name" tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value: ValueType) => [`${toNumberValue(value)} MB/s`, 'Velocidad']}
										labelFormatter={(name) => `Operación: ${name}`}
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
							<CardTitle className="font-medium text-sm">Procesamiento de Imágenes</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Tiempo promedio de procesamiento</span>
									<span className="font-medium text-lg">{imageProcessingPerformance.averageProcessingTime} ms</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Imágenes procesadas por hora</span>
									<span className="font-medium text-lg">
										{formatNumber(imageProcessingPerformance.imagesProcessedPerHour)}
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Tamaño de lote</span>
									<span className="font-medium text-lg">{imageProcessingPerformance.batchSize}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Memoria por imagen</span>
									<span className="font-medium text-lg">
										{imageProcessingPerformance.memoryUsagePerImage.toFixed(2)} MB
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Tamaño de cola</span>
									<span className="font-medium text-lg">{imageProcessingPerformance.queueSize}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">Tasa de éxito</span>
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
