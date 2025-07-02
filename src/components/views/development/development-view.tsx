import { BarChart, Bug, Code2, FileCode2, Folder, Gauge, Image, Loader2, RefreshCw, Server, Tag } from 'lucide-react';
import { motion } from 'motion/react';
// Se reemplaza react-markdown por el visor de @uiw/react-md-editor
import MDEditor from '@uiw/react-md-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ViewProps } from '../types';
import { FeatureCard, IssueCard, MetricCard, ProcessingMetricCard, ServiceCard } from './cards';
import { FoldersSettings } from '@/components/settings/folders/folders-settings';
import {
	FileDistributionChart,
	IndexingActivityChart,
	ResourceUsageChart,
	SystemPerformanceChart,
} from './charts/system-charts';
import { SystemMetricsPanel } from './charts/tech-metrics';
import { DOCUMENTATION_FILES, useDocumentation } from './hooks/use-documentation';
import { useFeaturesIssues } from './hooks/use-features-issues';
import { useSystemStats } from './hooks/use-system-stats';

export function DevelopmentView(_props: ViewProps) {
	const { metrics, processingMetrics, isLoading: isLoadingStats, refreshData: refreshStats } = useSystemStats();
	const {
		features,
		issues,
		services,
		isLoading: isLoadingFeatures,
		refreshData: refreshFeatures,
	} = useFeaturesIssues();
	const { documentationContent, isLoading: isLoadingDocs, refreshDocumentation } = useDocumentation();

	const isLoading = isLoadingStats || isLoadingFeatures || isLoadingDocs;

	const handleRefresh = () => {
		refreshStats();
		refreshFeatures();
		refreshDocumentation();
	};

	return (
		<ScrollArea className="h-full w-full">
			<div className="p-4 space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Panel de Desarrollo</h1>
						<p className="text-muted-foreground">Monitoreo y gestión del sistema</p>
					</div>
					<Button type="button" variant="outline" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Actualizando...
							</>
						) : (
							<>
								<RefreshCw className="h-4 w-4" />
								Actualizar
							</>
						)}
					</Button>
				</div>

				<Tabs defaultValue="services" className="space-y-4">
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
						<TabsTrigger value="folders" className="gap-2">
							<Folder className="h-4 w-4" />
							Carpetas
						</TabsTrigger>
						<TabsTrigger value="tags" className="gap-2">
							<Tag className="h-4 w-4" />
							Etiquetas
						</TabsTrigger>
						<TabsTrigger value="images" className="gap-2">
							<Image className="h-4 w-4" />
							Imágenes
						</TabsTrigger>
						<TabsTrigger value="stats" className="gap-2">
							<BarChart className="h-4 w-4" />
							Estadísticas
						</TabsTrigger>
						<TabsTrigger value="tech" className="gap-2">
							<Gauge className="h-4 w-4" />
							Métricas Técnicas
						</TabsTrigger>
					</TabsList>

					<TabsContent value="services" className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
							{services.map((service, index) => (
								<motion.div
									key={service.name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<ServiceCard service={service} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="features" className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{features.map((feature, index) => (
								<motion.div
									key={feature.name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<FeatureCard feature={feature} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="issues" className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{issues.map((issue, index) => (
								<motion.div
									key={issue.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<IssueCard issue={issue} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="docs" className="mt-4">
						<Card className="border-2 border-primary/10">
							<CardContent className="p-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
									{DOCUMENTATION_FILES.map((doc) => (
										<HoverCard key={doc}>
											<HoverCardTrigger asChild>
												<Button variant="outline" className="w-full justify-start gap-2">
													<FileCode2 className="h-4 w-4" />
													{doc}
												</Button>
											</HoverCardTrigger>
											<HoverCardContent side="right" className="w-[450px] max-h-[500px] overflow-auto">
												<h4 className="font-medium mb-2">{doc.replace('.md', '')}</h4>
												<div className="prose prose-sm dark:prose-invert">
													{documentationContent[doc] ? (
														<MDEditor.Markdown source={documentationContent[doc]} />
													) : (
														<p className="text-muted-foreground">
															{isLoadingDocs ? 'Cargando documentación...' : 'No se pudo cargar la documentación'}
														</p>
													)}
												</div>
											</HoverCardContent>
										</HoverCard>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="folders" className="mt-4">
						<FoldersSettings />
					</TabsContent>

					<TabsContent value="tags" className="mt-4">
						<Card className="border-2 border-primary/10">
							<CardContent className="p-4">
								<div className="p-4">
									<h3 className="text-lg font-medium">Etiquetas</h3>
									<p className="text-muted-foreground">Gestión de etiquetas en desarrollo</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="images" className="mt-4">
						<Card className="border-2 border-primary/10">
							<CardContent className="p-4">
								<div className="p-4">
									<h3 className="text-lg font-medium">Imágenes</h3>
									<p className="text-muted-foreground">Gestión de imágenes en desarrollo</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="stats" className="mt-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<FileDistributionChart />
							<IndexingActivityChart />
							<ResourceUsageChart />
							<SystemPerformanceChart />
						</div>
					</TabsContent>

					<TabsContent value="tech" className="mt-4">
						<Card className="border-2 border-primary/10">
							<CardContent className="p-4">
								<SystemMetricsPanel />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Métricas de Procesamiento */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{processingMetrics.map((metric, index) => (
						<motion.div
							key={metric.name}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
						>
							<ProcessingMetricCard metric={metric} />
						</motion.div>
					))}
				</div>

				{/* Métricas del Sistema */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
					{metrics.map((metric, index) => (
						<motion.div
							key={metric.name}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
						>
							<MetricCard metric={metric} />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
