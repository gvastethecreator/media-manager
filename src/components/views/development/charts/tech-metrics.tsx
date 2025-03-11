'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cpu, Database, Gauge, HardDrive, Loader2 } from 'lucide-react';
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
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { useTechMetrics } from '../hooks/use-tech-metrics';

// Formateador para números
const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('es-ES').format(num);
};

// Formateador para segundos a texto legible
const formatUptime = (seconds: number): string => {
	return formatDistanceToNow(Date.now() - seconds * 1000, { locale: es });
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

	if (!technicalMetrics || !fileSystemPerformance || !imageProcessingPerformance) {
		return <div className="p-4 text-center text-muted-foreground">No se pudieron cargar las métricas técnicas.</div>;
	}

	return (
		<Tabs defaultValue="system" className="w-full">
			<TabsList className="grid w-full grid-cols-3">
				<TabsTrigger value="system" className="flex items-center gap-2">
					<Cpu className="h-4 w-4" />
					Sistema
				</TabsTrigger>
				<TabsTrigger value="database" className="flex items-center gap-2">
					<Database className="h-4 w-4" />
					Base de Datos & API
				</TabsTrigger>
				<TabsTrigger value="filesystem" className="flex items-center gap-2">
					<HardDrive className="h-4 w-4" />
					Sistema de Archivos
				</TabsTrigger>
			</TabsList>

			<TabsContent value="system" className="space-y-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Información del sistema */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Información del Sistema</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Plataforma:</span>
								<span className="text-sm font-medium">{technicalMetrics.systemInfo.platform}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Versión de Node:</span>
								<span className="text-sm font-medium">{technicalMetrics.systemInfo.nodeVersion}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tiempo activo:</span>
								<span className="text-sm font-medium">{formatUptime(technicalMetrics.systemInfo.uptime)}</span>
							</div>
						</CardContent>
					</Card>

					{/* Gráfico de CPU */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Uso de CPU</CardTitle>
							<div className="flex items-center gap-2">
								<Progress value={technicalMetrics.systemInfo.cpuUsage.overall} className="h-2" />
								<span className="text-sm font-medium">{technicalMetrics.systemInfo.cpuUsage.overall}%</span>
							</div>
						</CardHeader>
						<CardContent className="h-[180px]">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={cpuHistory}>
									<XAxis dataKey="time" tick={{ fontSize: 10 }} />
									<YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value: number) => [`${value}%`, 'Uso de CPU']}
										labelFormatter={(time) => `Hora: ${time}`}
									/>
									<Line type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={2} />
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Gráfico de Memoria */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Uso de Memoria</CardTitle>
							<div className="flex items-center gap-2">
								<Progress
									value={
										(technicalMetrics.systemInfo.memoryUsage.used / technicalMetrics.systemInfo.memoryUsage.total) * 100
									}
									className="h-2"
								/>
								<span className="text-sm font-medium">
									{technicalMetrics.systemInfo.memoryUsage.used} / {technicalMetrics.systemInfo.memoryUsage.total} MB
								</span>
							</div>
						</CardHeader>
						<CardContent className="h-[180px]">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={memoryHistory}>
									<XAxis dataKey="time" tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value: number) => [`${value} MB`, 'Memoria']}
										labelFormatter={(time) => `Hora: ${time}`}
									/>
									<Area type="monotone" dataKey="used" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
									<Area type="monotone" dataKey="free" stackId="1" stroke="#10b981" fill="#10b981" />
									<Legend />
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Uso por núcleo */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Uso por Núcleo</CardTitle>
						</CardHeader>
						<CardContent className="h-[180px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={technicalMetrics.systemInfo.cpuUsage.cores.map((usage, index) => ({
										name: `CPU ${index + 1}`,
										usage,
									}))}
								>
									<XAxis dataKey="name" tick={{ fontSize: 10 }} />
									<YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip formatter={(value: number) => [`${value}%`, 'Uso']} labelFormatter={(name) => `${name}`} />
									<Bar dataKey="usage" fill="#3b82f6" />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="database" className="space-y-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Métricas de la Base de Datos */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Métricas de Base de Datos</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tamaño del pool:</span>
								<span className="text-sm font-medium">{technicalMetrics.databaseMetrics.connectionPoolSize}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Conexiones activas:</span>
								<span className="text-sm font-medium">{technicalMetrics.databaseMetrics.activeConnections}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tiempo de respuesta:</span>
								<span className="text-sm font-medium">
									{technicalMetrics.databaseMetrics.queryResponseTime.toFixed(2)} ms
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Consultas totales:</span>
								<span className="text-sm font-medium">
									{formatNumber(technicalMetrics.databaseMetrics.totalQueries)}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tasa de error:</span>
								<Badge variant={technicalMetrics.databaseMetrics.errorRate < 1 ? 'default' : 'destructive'}>
									{technicalMetrics.databaseMetrics.errorRate.toFixed(2)}%
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Métricas de la API */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Métricas de API</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Solicitudes por minuto:</span>
								<span className="text-sm font-medium">{technicalMetrics.apiMetrics.requestsPerMinute}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tiempo de respuesta:</span>
								<span className="text-sm font-medium">
									{technicalMetrics.apiMetrics.averageResponseTime.toFixed(2)} ms
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tasa de error:</span>
								<Badge variant={technicalMetrics.apiMetrics.errorRate < 1 ? 'default' : 'destructive'}>
									{technicalMetrics.apiMetrics.errorRate.toFixed(2)}%
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Endpoints principales */}
					<Card className="md:col-span-2">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Endpoints Principales</CardTitle>
						</CardHeader>
						<CardContent className="h-[200px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={technicalMetrics.apiMetrics.topEndpoints}
									layout="vertical"
									margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
								>
									<XAxis type="number" tick={{ fontSize: 10 }} />
									<YAxis dataKey="endpoint" type="category" tick={{ fontSize: 10 }} width={80} />
									<CartesianGrid strokeDasharray="3 3" />
									<Tooltip
										formatter={(value: number) => [formatNumber(value), 'Solicitudes']}
										labelFormatter={(name) => `Endpoint: ${name}`}
									/>
									<Bar dataKey="hits" fill="#3b82f6" />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="filesystem" className="space-y-4 mt-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Rendimiento del sistema de archivos */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Rendimiento de E/S</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-2">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Velocidad de lectura:</span>
								<span className="text-sm font-medium">{fileSystemPerformance.readSpeed} MB/s</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Velocidad de escritura:</span>
								<span className="text-sm font-medium">{fileSystemPerformance.writeSpeed} MB/s</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tiempo de acceso:</span>
								<span className="text-sm font-medium">{fileSystemPerformance.averageAccessTime.toFixed(2)} ms</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">IOPS lectura:</span>
								<span className="text-sm font-medium">{formatNumber(fileSystemPerformance.iopsRead)}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">IOPS escritura:</span>
								<span className="text-sm font-medium">{formatNumber(fileSystemPerformance.iopsWrite)}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Operaciones actuales:</span>
								<span className="text-sm font-medium">{fileSystemPerformance.currentOperations}</span>
							</div>
						</CardContent>
					</Card>

					{/* Comparación de velocidad */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Velocidades de E/S</CardTitle>
						</CardHeader>
						<CardContent className="h-[200px]">
							<ResponsiveContainer width="100%" height="100%">
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
										formatter={(value: number) => [`${value} MB/s`, 'Velocidad']}
										labelFormatter={(name) => `Operación: ${name}`}
									/>
									<Bar dataKey="value" fill="#3b82f6">
										<Cell fill="#10b981" />
										<Cell fill="#3b82f6" />
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Procesamiento de imágenes */}
					<Card className="md:col-span-2">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Procesamiento de Imágenes</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Tiempo promedio de procesamiento</span>
									<span className="text-lg font-medium">{imageProcessingPerformance.averageProcessingTime} ms</span>
								</div>
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Imágenes procesadas por hora</span>
									<span className="text-lg font-medium">
										{formatNumber(imageProcessingPerformance.imagesProcessedPerHour)}
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Tamaño de lote</span>
									<span className="text-lg font-medium">{imageProcessingPerformance.batchSize}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Memoria por imagen</span>
									<span className="text-lg font-medium">
										{imageProcessingPerformance.memoryUsagePerImage.toFixed(2)} MB
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Tamaño de cola</span>
									<span className="text-lg font-medium">{imageProcessingPerformance.queueSize}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Tasa de éxito</span>
									<Badge variant={imageProcessingPerformance.successRate > 99 ? 'default' : 'warning'}>
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
