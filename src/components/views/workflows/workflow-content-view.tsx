import { ArrowLeft, Download, Edit, Play, Settings, Share2, Square, Trash2, Workflow } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ViewProps } from '../types';

interface WorkflowContentViewProps extends ViewProps {
	workflowId?: string;
}

export const WorkflowContentView: React.FC<WorkflowContentViewProps> = ({ className, workflowId }) => {
	const { navigateToMainFromContent, currentItem } = useNavigationStore();
	const [isRunning, setIsRunning] = React.useState(false);

	const handleGoBack = () => {
		navigateToMainFromContent();
	};

	const toggleWorkflow = () => {
		setIsRunning(!isRunning);
	};

	// Mock data - en una implementación real vendría del store
	const workflowData = {
		id: workflowId || '1',
		name: currentItem?.name || 'Procesamiento de Imágenes',
		description: 'Workflow para procesar y organizar imágenes automáticamente',
		status: 'idle' as const,
		lastRun: '2024-01-20 14:30',
		totalRuns: 127,
		successRate: 98.5,
		avgDuration: '2.3 min',
		steps: [
			{ id: 1, name: 'Análisis de imágenes', status: 'completed', duration: '45s' },
			{ id: 2, name: 'Extracción de metadatos', status: 'completed', duration: '12s' },
			{ id: 3, name: 'Generación de miniaturas', status: 'running', duration: '1.2 min' },
			{ id: 4, name: 'Indexación', status: 'pending', duration: '--' },
			{ id: 5, name: 'Actualización base de datos', status: 'pending', duration: '--' },
		],
		config: {
			trigger: 'manual',
			timeout: '10 min',
			retries: 3,
			parallel: true,
		},
		tags: ['automatización', 'imagen', 'procesamiento'],
		path: '/workflows/process-images.json',
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
			className={className}
		>
			<div className="h-full flex flex-col">
				{/* Header con navegación */}
				<div className="flex items-center gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm">
					<Button variant="ghost" size="icon" onClick={handleGoBack} className="shrink-0">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex items-center gap-3 min-w-0 flex-1">
						<Workflow className="h-6 w-6 text-primary shrink-0" />
						<div className="min-w-0 flex-1">
							<h1 className="text-xl font-semibold truncate">{workflowData.name}</h1>
							<p className="text-sm text-muted-foreground truncate">{workflowData.description}</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button variant={isRunning ? 'destructive' : 'default'} size="sm" onClick={toggleWorkflow}>
							{isRunning ? (
								<>
									<Square className="h-4 w-4 mr-2" />
									Detener
								</>
							) : (
								<>
									<Play className="h-4 w-4 mr-2" />
									Ejecutar
								</>
							)}
						</Button>
						<Button variant="outline" size="sm">
							<Settings className="h-4 w-4 mr-2" />
							Configurar
						</Button>
						<Button variant="outline" size="sm">
							<Download className="h-4 w-4 mr-2" />
							Exportar
						</Button>
						<Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Contenido principal */}
				<div className="flex-1 flex gap-4 p-4 min-h-0">
					{/* Panel de información lateral */}
					<div className="w-80 shrink-0">
						<ScrollArea className="h-full">
							<div className="space-y-4">
								{/* Estado y estadísticas */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Estado del Workflow</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center gap-2">
											<Badge variant={workflowData.status === 'idle' ? 'secondary' : 'default'}>
												{workflowData.status === 'idle' ? 'Inactivo' : 'Ejecutando'}
											</Badge>
										</div>
										<div className="grid grid-cols-2 gap-2 text-sm">
											<span className="text-muted-foreground">Última ejecución:</span>
											<span className="text-xs">{workflowData.lastRun}</span>
											<span className="text-muted-foreground">Total ejecuciones:</span>
											<span>{workflowData.totalRuns}</span>
											<span className="text-muted-foreground">Tasa de éxito:</span>
											<span className="text-green-600">{workflowData.successRate}%</span>
											<span className="text-muted-foreground">Duración promedio:</span>
											<span>{workflowData.avgDuration}</span>
										</div>
									</CardContent>
								</Card>

								{/* Configuración */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Configuración</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="grid grid-cols-2 gap-2 text-sm">
											<span className="text-muted-foreground">Trigger:</span>
											<Badge variant="outline">{workflowData.config.trigger}</Badge>
											<span className="text-muted-foreground">Timeout:</span>
											<span>{workflowData.config.timeout}</span>
											<span className="text-muted-foreground">Reintentos:</span>
											<span>{workflowData.config.retries}</span>
											<span className="text-muted-foreground">Paralelo:</span>
											<span>{workflowData.config.parallel ? 'Sí' : 'No'}</span>
										</div>
									</CardContent>
								</Card>

								{/* Etiquetas */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Etiquetas</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-2">
											{workflowData.tags.map((tag) => (
												<Badge key={tag} variant="outline" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
									</CardContent>
								</Card>

								{/* Acciones rápidas */}
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Acciones Rápidas</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Edit className="h-4 w-4 mr-2" />
											Editar workflow
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Settings className="h-4 w-4 mr-2" />
											Configurar triggers
										</Button>
										<Button variant="outline" size="sm" className="w-full justify-start">
											<Share2 className="h-4 w-4 mr-2" />
											Duplicar workflow
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Panel de pasos del workflow */}
					<div className="flex-1 min-w-0">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="text-sm">Pasos del Workflow</CardTitle>
							</CardHeader>
							<CardContent className="h-full">
								<ScrollArea className="h-full">
									<div className="space-y-4">
										{workflowData.steps.map((step, index) => (
											<div key={step.id} className="border rounded-lg p-4">
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
															{step.id}
														</div>
														<div>
															<h4 className="font-medium">{step.name}</h4>
															<p className="text-sm text-muted-foreground">Duración: {step.duration}</p>
														</div>
													</div>
													<Badge
														variant={
															step.status === 'completed'
																? 'default'
																: step.status === 'running'
																	? 'secondary'
																	: 'outline'
														}
														className={
															step.status === 'completed'
																? 'bg-green-100 text-green-800'
																: step.status === 'running'
																	? 'bg-blue-100 text-blue-800'
																	: 'bg-gray-100 text-gray-800'
														}
													>
														{step.status === 'completed'
															? 'Completado'
															: step.status === 'running'
																? 'Ejecutando'
																: 'Pendiente'}
													</Badge>
												</div>

												{step.status === 'running' && (
													<div className="mt-3">
														<Progress value={65} className="h-2" />
														<p className="text-xs text-muted-foreground mt-1">Procesando... 65% completado</p>
													</div>
												)}

												{index < workflowData.steps.length - 1 && (
													<div className="flex justify-center mt-4">
														<div className="w-px h-6 bg-border" />
													</div>
												)}
											</div>
										))}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default WorkflowContentView;
