import { ArrowLeft, Download, Edit, Play, Settings, Share2, Square, Trash2, Workflow } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import type { ViewProps } from '../types';

interface WorkflowContentViewProps extends ViewProps {
	workflowId?: string;
}

export const WorkflowContentView: React.FC<WorkflowContentViewProps> = ({ className, workflowId }) => {
	const { navigateWithTransition } = useSeamlessNavigation();
	const [isRunning, setIsRunning] = React.useState(false);

	const handleGoBack = () => {
		navigateWithTransition(-1);
	};

	const toggleWorkflow = () => {
		setIsRunning(!isRunning);
	};

	// Mock data - en una implementación real vendría del store
	const workflowData = {
		id: workflowId || '1',
		name: 'Procesamiento de Imágenes',
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
			animate={{ opacity: 1, x: 0 }}
			className={className}
			exit={{ opacity: 0, x: -20 }}
			initial={{ opacity: 0, x: 20 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex h-full flex-col">
				{/* Header con navegación */}
				<div className="flex items-center gap-4 border-border border-b bg-background/50 p-4 backdrop-blur-sm">
					<Button className="shrink-0" onClick={handleGoBack} size="icon" variant="ghost">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<Workflow className="h-6 w-6 shrink-0 text-primary" />
						<div className="min-w-0 flex-1">
							<h1 className="truncate font-semibold text-xl">{workflowData.name}</h1>
							<p className="truncate text-muted-foreground text-sm">{workflowData.description}</p>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button onClick={toggleWorkflow} size="sm" variant={isRunning ? 'destructive' : 'default'}>
							{isRunning ? (
								<>
									<Square className="mr-2 h-4 w-4" />
									Detener
								</>
							) : (
								<>
									<Play className="mr-2 h-4 w-4" />
									Ejecutar
								</>
							)}
						</Button>
						<Button size="sm" variant="outline">
							<Settings className="mr-2 h-4 w-4" />
							Configurar
						</Button>
						<Button size="sm" variant="outline">
							<Download className="mr-2 h-4 w-4" />
							Exportar
						</Button>
						<Button className="text-destructive hover:text-destructive" size="sm" variant="outline">
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Contenido principal */}
				<div className="flex min-h-0 flex-1 gap-4 p-4">
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
												<Badge className="text-xs" key={tag} variant="outline">
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
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Edit className="mr-2 h-4 w-4" />
											Editar workflow
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Settings className="mr-2 h-4 w-4" />
											Configurar triggers
										</Button>
										<Button className="w-full justify-start" size="sm" variant="outline">
											<Share2 className="mr-2 h-4 w-4" />
											Duplicar workflow
										</Button>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</div>

					<Separator orientation="vertical" />

					{/* Panel de pasos del workflow */}
					<div className="min-w-0 flex-1">
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="text-sm">Pasos del Workflow</CardTitle>
							</CardHeader>
							<CardContent className="h-full">
								<ScrollArea className="h-full">
									<div className="space-y-4">
										{workflowData.steps.map((step, index) => (
											<div className="rounded-lg border p-4" key={step.id}>
												<div className="mb-2 flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-sm">
															{step.id}
														</div>
														<div>
															<h4 className="font-medium">{step.name}</h4>
															<p className="text-muted-foreground text-sm">Duración: {step.duration}</p>
														</div>
													</div>
													<Badge
														className={
															step.status === 'completed'
																? 'bg-green-100 text-green-800'
																: step.status === 'running'
																	? 'bg-blue-100 text-blue-800'
																	: 'bg-gray-100 text-gray-800'
														}
														variant={
															step.status === 'completed'
																? 'default'
																: step.status === 'running'
																	? 'secondary'
																	: 'outline'
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
														<Progress className="h-2" value={65} />
														<p className="mt-1 text-muted-foreground text-xs">Procesando... 65% completado</p>
													</div>
												)}

												{index < workflowData.steps.length - 1 && (
													<div className="mt-4 flex justify-center">
														<div className="h-6 w-px bg-border" />
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
