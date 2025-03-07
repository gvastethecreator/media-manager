'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileManager } from '@/lib/hooks/use-file-manager';
import { useSettings } from '@/lib/hooks/use-settings';
import { cn, formatBytes } from '@/lib/utils';
import {
	Activity,
	AlertTriangle,
	BarChart,
	Boxes,
	Bug,
	CheckCircle2,
	Clock,
	Code2,
	Cpu,
	Database,
	FileCode2,
	FileJson,
	Folder,
	HardDrive,
	ImageIcon,
	Info,
	Library,
	RefreshCw,
	Server,
	Settings,
	Tag,
	XCircle,
	Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import {
	Area,
	AreaChart,
	Bar,
	CartesianGrid,
	Cell,
	Line,
	Pie,
	BarChart as RechartsBarChart,
	LineChart as RechartsLineChart,
	PieChart as RechartsPieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import type { ViewProps } from '../types';

interface ServiceStatus {
	name: string;
	status: 'online' | 'offline' | 'warning';
	description: string;
	icon: ReactNode;
}

interface SystemMetric {
	name: string;
	value: number | string;
	unit: string;
	icon: ReactNode;
	change?: {
		value: number;
		type: 'increase' | 'decrease';
	};
	chart?: {
		data: number[];
		labels: string[];
	};
}

interface ProcessingMetric {
	name: string;
	value: number;
	max: number;
	icon: ReactNode;
}

interface Feature {
	name: string;
	status: 'completed' | 'in-progress' | 'pending' | 'failed';
	description: string;
	progress?: number;
}

interface Issue {
	id: string;
	title: string;
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	status: 'open' | 'in-progress' | 'resolved';
}

function StatusBadge({ status }: { status: string }) {
	const getStatusColor = () => {
		switch (status) {
			case 'online':
			case 'completed':
			case 'resolved':
				return 'bg-green-500/20 text-green-500 hover:bg-green-500/30';
			case 'warning':
			case 'in-progress':
				return 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30';
			case 'offline':
			case 'failed':
			case 'critical':
				return 'bg-red-500/20 text-red-500 hover:bg-red-500/30';
			case 'pending':
				return 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30';
			default:
				return 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30';
		}
	};

	return (
		<Badge
			variant="secondary"
			className={cn(
				'transition-colors text-[10px] absolute top-2 right-2 p-2 h-4 rounded-lg border-2 border-primary/10',
				getStatusColor()
			)}
		>
			{status}
		</Badge>
	);
}

function ServiceCard({ service }: { service: ServiceStatus }) {
	const Icon = service.icon;

	return (
		<Card className="relative overflow-hidden h-full border-2 border-primary/10">
			<CardHeader className="p-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								'p-2 rounded-md border-2 border-primary/10',
								service.status === 'online' && 'bg-green-500/20',
								service.status === 'warning' && 'bg-yellow-500/20',
								service.status === 'offline' && 'bg-red-500/20'
							)}
						>
							<Icon className="h-4 w-4" />
						</div>
						<div>
							<CardTitle className="text-sm">{service.name}</CardTitle>
							<CardDescription className="text-[10px] truncate">{service.description}</CardDescription>
						</div>
					</div>
					<StatusBadge status={service.status} />
				</div>
			</CardHeader>
		</Card>
	);
}

function MetricCard({ metric }: { metric: SystemMetric }) {
	const Icon = metric.icon;

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardContent className="p-3">
				<div className="flex items-center gap-4">
					<div className="p-2 rounded-md bg-primary/10 border-2 border-primary/10">
						<Icon className="h-8 w-8" />
					</div>
					<div className="flex-1">
						<p className="text-sm text-muted-foreground">{metric.name}</p>
						<div className="flex items-end gap-2">
							<p className="text-2xl font-semibold">
								{metric.value}
								<span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
							</p>
							{metric.change && (
								<div
									className={cn(
										'text-xs font-medium flex items-center gap-1',
										metric.change.type === 'increase' ? 'text-green-500' : 'text-red-500'
									)}
								>
									{metric.change.type === 'increase' ? '+' : '-'}
									{metric.change.value}%
								</div>
							)}
						</div>
					</div>
				</div>
				{metric.chart && (
					<div className="mt-4 h-[60px]">
						{metric.chart.data.map((value, index) => (
							<div
								key={`chart-bar-${metric.name}-${index}`}
								className="inline-block w-[8px] mx-[2px] bg-primary/20 rounded-sm"
								style={{
									height: metric.chart.data.length > 0 ? `${(value / Math.max(...metric.chart.data)) * 100}%` : '0%',
								}}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function ProcessingMetricCard({ metric }: { metric: ProcessingMetric }) {
	const Icon = metric.icon;
	const percentage = (metric.value / metric.max) * 100;

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardContent className="p-3 py-2">
				<div className="flex items-center gap-4 mb-2">
					<div className="p-2 rounded-md bg-primary/10 border-2 border-primary/10">
						<Icon className="h-6 w-6" />
					</div>
					<div className="flex-1">
						<p className="text-sm text-muted-foreground">{metric.name}</p>
						<p className="text-lg font-semibold">
							{metric.value} / {metric.max}
						</p>
					</div>
				</div>
				<Progress value={percentage} className="h-1" />
			</CardContent>
		</Card>
	);
}

function FeatureCard({ feature }: { feature: Feature }) {
	return (
		<Card className="h-full border-2 border-primary/10">
			<CardContent className="py-1 px-4">
				<div className="flex items-center justify-between mb-2 relative">
					<div>
						<h3 className="font-medium">{feature.name}</h3>
						<p className="text-sm text-muted-foreground">{feature.description}</p>
					</div>
					<StatusBadge status={feature.status} />
				</div>
				{feature.progress !== undefined && (
					<div className="space-y-1">
						<Progress value={feature.progress} className="h-1" />
						<p className="text-xs text-right text-muted-foreground">{feature.progress}%</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function IssueCard({ issue }: { issue: Issue }) {
	const getSeverityIcon = () => {
		switch (issue.severity) {
			case 'critical':
				return <XCircle className="h-4 w-4 text-red-500" />;
			case 'high':
				return <AlertTriangle className="h-4 w-4 text-orange-500" />;
			case 'medium':
				return <Info className="h-4 w-4 text-yellow-500" />;
			case 'low':
				return <CheckCircle2 className="h-4 w-4 text-green-500" />;
		}
	};

	return (
		<Card className="h-full border-2 border-primary/10 relative">
			<CardContent className="p-4">
				<div className="flex items-start gap-4">
					<div className="mt-1">{getSeverityIcon()}</div>
					<div className="flex-1">
						<div className="flex items-center justify-between mb-1">
							<h3 className="font-medium">{issue.title}</h3>
							<StatusBadge status={issue.status} />
						</div>
						<p className="text-sm text-muted-foreground">{issue.description}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function DevelopmentView(_props: ViewProps) {
	const _fileManager = useFileManager();
	const _settings = useSettings();
	const [processingMetrics] = useState<ProcessingMetric[]>([
		{
			name: 'Cola de Procesamiento',
			value: 24,
			max: 100,
			icon: Activity,
		},
		{
			name: 'Uso de CPU',
			value: 45,
			max: 100,
			icon: Cpu,
		},
		{
			name: 'Memoria en Uso',
			value: 2.1,
			max: 8,
			icon: Boxes,
		},
	]);

	const [metrics] = useState<SystemMetric[]>([
		{
			name: 'Archivos Indexados',
			value: 12458,
			unit: 'archivos',
			icon: FileJson,
			change: {
				value: 5.2,
				type: 'increase',
			},
			chart: {
				data: [45, 52, 38, 65, 42, 58, 72],
				labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
			},
		},
		{
			name: 'Espacio Total',
			value: formatBytes(275_409_203_200),
			unit: 'usados',
			icon: HardDrive,
			change: {
				value: 2.8,
				type: 'increase',
			},
		},
		{
			name: 'Carpetas Monitoreadas',
			value: 8,
			unit: 'carpetas',
			icon: Folder,
			chart: {
				data: [8, 8, 7, 7, 8, 8, 8],
				labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
			},
		},
		{
			name: 'Colecciones',
			value: 24,
			unit: 'total',
			icon: Library,
			change: {
				value: 12.5,
				type: 'increase',
			},
		},
		{
			name: 'Etiquetas',
			value: 156,
			unit: 'total',
			icon: Tag,
			chart: {
				data: [120, 125, 135, 142, 148, 152, 156],
				labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
			},
		},
		{
			name: 'Tiempo de Indexado',
			value: '1.2',
			unit: 's/archivo',
			icon: Clock,
			change: {
				value: 15.3,
				type: 'decrease',
			},
		},
	]);

	const [features] = useState<Feature[]>([
		{
			name: 'Indexación de Carpetas',
			status: 'completed',
			description: 'Sistema base de indexación de archivos',
			progress: 100,
		},
		{
			name: 'Procesamiento de Imágenes',
			status: 'in-progress',
			description: 'Optimización y generación de thumbnails',
			progress: 75,
		},
		{
			name: 'Sistema de Etiquetas',
			status: 'in-progress',
			description: 'Gestión y organización de etiquetas',
			progress: 60,
		},
		{
			name: 'Búsqueda Avanzada',
			status: 'pending',
			description: 'Sistema de búsqueda con filtros',
			progress: 0,
		},
	]);

	const [issues] = useState<Issue[]>([
		{
			id: 'ISS-001',
			title: 'Optimización de Thumbnails',
			description: 'El proceso de generación de thumbnails consume demasiada memoria',
			severity: 'high',
			status: 'in-progress',
		},
		{
			id: 'ISS-002',
			title: 'Monitoreo de Carpetas',
			description: 'Falsos positivos en la detección de cambios',
			severity: 'medium',
			status: 'open',
		},
		{
			id: 'ISS-003',
			title: 'Caché de Imágenes',
			description: 'El sistema de caché no limpia entradas antiguas',
			severity: 'low',
			status: 'resolved',
		},
	]);

	const [markdownContent, setMarkdownContent] = useState<{
		[key: string]: string;
	}>({});

	useEffect(() => {
		const loadMarkdownFiles = async () => {
			try {
				const files: string[] = [];
				const contents: { [key: string]: string } = {};

				for (const file of files) {
					const response = await fetch(`/docs/${file}`);
					if (response.ok) {
						contents[file] = await response.text();
					}
				}

				setMarkdownContent(contents);
			} catch (error) {
				console.error('Error loading markdown files:', error);
			}
		};

		loadMarkdownFiles();
	}, []);

	return (
		<ScrollArea className="h-full w-full">
			<div className="p-6 space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Panel de Desarrollo</h1>
						<p className="text-muted-foreground">Monitoreo y gestión del sistema</p>
					</div>
					<Button variant="outline" className="gap-2">
						<RefreshCw className="h-4 w-4" />
						Actualizar
					</Button>
				</div>

				<Tabs defaultValue="services">
					<TabsList>
						<TabsTrigger value="services" className="gap-2">
							<Server className="h-4 w-4" />
							Servicios
						</TabsTrigger>
						<TabsTrigger value="features" className="gap-2">
							<Code2 className="h-4 w-4" />
							Features
						</TabsTrigger>
						<TabsTrigger value="issues" className="gap-2">
							<Bug className="h-4 w-4" />
							Issues
						</TabsTrigger>
						<TabsTrigger value="docs" className="gap-2">
							<FileCode2 className="h-4 w-4" />
							Documentación
						</TabsTrigger>
						<TabsTrigger value="stats" className="gap-2">
							<BarChart className="h-4 w-4" />
							Estadísticas
						</TabsTrigger>
					</TabsList>

					<TabsContent value="services" className="space-y-4 mt-4">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{[
								{
									name: 'Indexación de Archivos',
									status: 'online' as const,
									description: 'Servicio de indexado y monitoreo',
									icon: Folder,
								},
								{
									name: 'Procesamiento de Imágenes',
									status: 'warning' as const,
									description: 'Generación de thumbnails y optimización',
									icon: ImageIcon,
								},
								{
									name: 'Base de Datos',
									status: 'online' as const,
									description: 'SQLite y Prisma ORM',
									icon: Database,
								},
								{
									name: 'API REST',
									status: 'online' as const,
									description: 'Endpoints y servicios',
									icon: Server,
								},
								{
									name: 'Sistema de Caché',
									status: 'warning' as const,
									description: 'Caché de archivos y consultas',
									icon: Zap,
								},
								{
									name: 'Background Jobs',
									status: 'online' as const,
									description: 'Procesamiento en segundo plano',
									icon: Settings,
								},
							].map((service, index) => (
								<motion.div
									key={service.name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<ServiceCard service={service} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="features" className="space-y-4 mt-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{features.map((feature, index) => (
								<motion.div
									key={feature.name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<FeatureCard feature={feature} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="issues" className="space-y-4 mt-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{issues.map((issue, index) => (
								<motion.div
									key={issue.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<IssueCard issue={issue} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="docs" className="mt-4 space-y-4">
						<Card className="h-full border-2 border-primary/10">
							<CardContent className="p-2">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{[
										{
											name: 'PRD.md',
											title: 'Product Requirements Document',
											description: 'Documento de requerimientos del producto',
										},
										{
											name: 'FRONTEND.md',
											title: 'Frontend Documentation',
											description: 'Documentación del frontend',
										},
										{
											name: 'BACKEND.md',
											title: 'Backend Documentation',
											description: 'Documentación del backend',
										},
										{
											name: 'ROADMAP.md',
											title: 'Roadmap',
											description: 'Plan de desarrollo y features',
										},
									].map((doc) => (
										<HoverCard key={doc.name}>
											<HoverCardTrigger asChild>
												<Button variant="outline" className="w-full justify-start gap-2">
													<FileCode2 className="h-4 w-4" />
													{doc.name}
												</Button>
											</HoverCardTrigger>
											<HoverCardContent side="right" className="w-[450px] max-h-[500px] overflow-auto">
												<h4 className="font-medium mb-2">{doc.title}</h4>
												<div className="prose prose-sm dark:prose-invert">
													{markdownContent[doc.name] ? (
														<ReactMarkdown>{markdownContent[doc.name]}</ReactMarkdown>
													) : (
														<p className="text-muted-foreground">Cargando documentación...</p>
													)}
												</div>
											</HoverCardContent>
										</HoverCard>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="stats" className="mt-4">
						<Card className="h-full border-2 border-primary/10">
							<CardContent className="p-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Card className="h-full border-2 border-primary/10">
										<CardHeader>
											<CardTitle className="text-sm font-medium">Distribución de Archivos</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="h-[200px]">
												<ResponsiveContainer width="100%" height="100%">
													<RechartsPieChart>
														<Pie
															data={[
																{ name: 'Imágenes', value: 8500 },
																{ name: 'Videos', value: 2500 },
																{ name: 'Documentos', value: 1458 },
															]}
															cx="50%"
															cy="50%"
															innerRadius={60}
															outerRadius={80}
															fill="#8884d8"
															paddingAngle={5}
															dataKey="value"
														>
															<Cell fill="#3b82f6" />
															<Cell fill="#10b981" />
															<Cell fill="#f59e0b" />
														</Pie>
														<Tooltip />
													</RechartsPieChart>
												</ResponsiveContainer>
											</div>
										</CardContent>
									</Card>

									<Card className="h-full border-2 border-primary/10">
										<CardHeader>
											<CardTitle className="text-sm font-medium">Actividad de Indexación</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="h-[200px]">
												<ResponsiveContainer width="100%" height="100%">
													<AreaChart
														data={[
															{ name: 'Lun', archivos: 450 },
															{ name: 'Mar', archivos: 520 },
															{ name: 'Mie', archivos: 380 },
															{ name: 'Jue', archivos: 650 },
															{ name: 'Vie', archivos: 420 },
															{ name: 'Sab', archivos: 580 },
															{ name: 'Dom', archivos: 720 },
														]}
														margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
													>
														<defs>
															<linearGradient id="colorArchivos" x1="0" y1="0" x2="0" y2="1">
																<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
																<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
															</linearGradient>
														</defs>
														<XAxis dataKey="name" />
														<YAxis />
														<CartesianGrid strokeDasharray="3 3" />
														<Tooltip />
														<Area
															type="monotone"
															dataKey="archivos"
															stroke="#3b82f6"
															fillOpacity={1}
															fill="url(#colorArchivos)"
														/>
													</AreaChart>
												</ResponsiveContainer>
											</div>
										</CardContent>
									</Card>

									<Card className="h-full border-2 border-primary/10">
										<CardHeader>
											<CardTitle className="text-sm font-medium">Uso de Recursos</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="h-[200px]">
												<ResponsiveContainer width="100%" height="100%">
													<RechartsBarChart
														data={[
															{ name: 'CPU', valor: 45 },
															{ name: 'RAM', valor: 62 },
															{ name: 'Disco', valor: 78 },
															{ name: 'Red', valor: 25 },
														]}
														margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
													>
														<XAxis dataKey="name" />
														<YAxis />
														<CartesianGrid strokeDasharray="3 3" />
														<Tooltip />
														<Bar dataKey="valor" fill="#10b981" />
													</RechartsBarChart>
												</ResponsiveContainer>
											</div>
										</CardContent>
									</Card>

									<Card className="h-full border-2 border-primary/10">
										<CardHeader>
											<CardTitle className="text-sm font-medium">Rendimiento del Sistema</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="h-[200px]">
												<ResponsiveContainer width="100%" height="100%">
													<RechartsLineChart
														data={[
															{ name: '00:00', valor: 85 },
															{ name: '04:00', valor: 92 },
															{ name: '08:00', valor: 78 },
															{ name: '12:00', valor: 65 },
															{ name: '16:00', valor: 88 },
															{ name: '20:00', valor: 95 },
														]}
														margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
													>
														<XAxis dataKey="name" />
														<YAxis />
														<CartesianGrid strokeDasharray="3 3" />
														<Tooltip />
														<Line type="monotone" dataKey="valor" stroke="#f59e0b" strokeWidth={2} />
													</RechartsLineChart>
												</ResponsiveContainer>
											</div>
										</CardContent>
									</Card>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Métricas de Procesamiento */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{processingMetrics.map((metric, index) => (
						<motion.div
							key={metric.name}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<ProcessingMetricCard metric={metric} />
						</motion.div>
					))}
				</div>

				{/* Métricas del Sistema */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{metrics.map((metric, index) => (
						<motion.div
							key={metric.name}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<MetricCard metric={metric} />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
