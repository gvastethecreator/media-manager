// Se reemplaza react-markdown por el visor de @uiw/react-md-editor
import MDEditor from '@uiw/react-md-editor';
import {
	BarChart,
	Bug,
	Code2,
	FileCode2,
	Folder,
	Gauge,
	Image,
	Loader2,
	RefreshCw,
	Server,
	Sparkles,
	Tag,
} from 'lucide-react';
import { ScannedImagesSettings } from '@/components/settings/media/scanned-images-settings';
import { FilesSettingsModern } from '@/components/settings/modern/files-settings-modern';
import { TaxonomySettingsModern } from '@/components/settings/modern/taxonomy-settings-modern';
import { motion } from '@/components/ui/animejs-shim';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ViewProps } from '../types';
import { FeatureCard } from './cards/feature-card';
import { IssueCard } from './cards/issue-card';
import { MetricCard } from './cards/metric-card';
import { ProcessingMetricCard } from './cards/processing-metric-card';
import { ServiceCard } from './cards/service-card';
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
import { TransitionsDemo } from './transitions-demo';

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
			<div className="space-y-4 p-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl">Panel de Desarrollo</h1>
						<p className="text-muted-foreground">Monitoreo y gestión del sistema</p>
					</div>
					<Button className="gap-2" disabled={isLoading} onClick={handleRefresh} type="button" variant="outline">
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

				<Tabs className="space-y-4" defaultValue="services">
					<TabsList>
						<TabsTrigger className="gap-2" value="services">
							<Server className="h-4 w-4" />
							Servicios
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="features">
							<Code2 className="h-4 w-4" />
							Features
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="issues">
							<Bug className="h-4 w-4" />
							Issues
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="docs">
							<FileCode2 className="h-4 w-4" />
							Documentación
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="folders">
							<Folder className="h-4 w-4" />
							Carpetas
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="tags">
							<Tag className="h-4 w-4" />
							Etiquetas
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="images">
							<Image className="h-4 w-4" />
							Imágenes
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="stats">
							<BarChart className="h-4 w-4" />
							Estadísticas
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="tech">
							<Gauge className="h-4 w-4" />
							Métricas Técnicas
						</TabsTrigger>
						<TabsTrigger className="gap-2" value="transitions">
							<Sparkles className="h-4 w-4" />
							Transiciones
						</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="services">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{services.map((service, index) => (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									initial={{ opacity: 0, y: 20 }}
									key={service.name}
									transition={{ delay: index * 0.05 }}
								>
									<ServiceCard service={service} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent className="space-y-4" value="features">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{features.map((feature, index) => (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									initial={{ opacity: 0, y: 20 }}
									key={feature.name}
									transition={{ delay: index * 0.05 }}
								>
									<FeatureCard feature={feature} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent className="space-y-4" value="issues">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{issues.map((issue, index) => (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									initial={{ opacity: 0, y: 20 }}
									key={issue.id}
									transition={{ delay: index * 0.05 }}
								>
									<IssueCard issue={issue} />
								</motion.div>
							))}
						</div>
					</TabsContent>

					<TabsContent className="mt-4" value="docs">
						<Card className="border-2 border-primary/10">
							<CardContent className="p-4">
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
									{DOCUMENTATION_FILES.map((doc) => (
										<HoverCard key={doc}>
											<HoverCardTrigger asChild>
												<Button className="w-full justify-start gap-2" variant="outline">
													<FileCode2 className="h-4 w-4" />
													{doc}
												</Button>
											</HoverCardTrigger>
											<HoverCardContent className="max-h-[500px] w-[450px] overflow-auto" side="right">
												<h4 className="mb-2 font-medium">{doc.replace('.md', '')}</h4>
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

					<TabsContent className="mt-4" value="folders">
						<FilesSettingsModern />
					</TabsContent>

					<TabsContent className="mt-4" value="tags">
						<TaxonomySettingsModern />
					</TabsContent>

					<TabsContent className="mt-4" value="images">
						<ScannedImagesSettings />
					</TabsContent>

					<TabsContent className="mt-4" value="stats">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<FileDistributionChart />
							<IndexingActivityChart />
							<ResourceUsageChart />
							<SystemPerformanceChart />
						</div>
					</TabsContent>

					<TabsContent className="mt-4" value="tech">
						<Card className="border-2 border-primary/10">
							<CardContent className="p-4">
								<SystemMetricsPanel />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-4" value="transitions">
						<TransitionsDemo />
					</TabsContent>
				</Tabs>

				{/* Métricas de Procesamiento */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{processingMetrics.map((metric, index) => (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							initial={{ opacity: 0, y: 20 }}
							key={metric.name}
							transition={{ delay: index * 0.05 }}
						>
							<ProcessingMetricCard metric={metric} />
						</motion.div>
					))}
				</div>

				{/* Métricas del Sistema */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
					{metrics.map((metric, index) => (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							initial={{ opacity: 0, y: 20 }}
							key={metric.name}
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
