import { AlertTriangle, Calendar, CheckCircle, Clock, FileText, Info, Network, Play, User } from 'lucide-react';
import { memo, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ComfyUIWorkflowService } from '@/services/workflow/comfyui.service';
import type { WorkflowWithStats } from '@/types/workflow';
import { ComfyNodeCategory } from '@/types/workflow';

interface WorkflowViewerProps {
	workflow: WorkflowWithStats;
	className?: string;
}

/**
 * Componente para visualizar workflows ComfyUI
 * Muestra información del workflow, nodos, y metadatos
 */
export const WorkflowViewer = memo(function WorkflowViewer({ workflow, className }: WorkflowViewerProps) {
	// Calcular información derivada
	const workflowInfo = useMemo(() => {
		const complexity = ComfyUIWorkflowService.calculateComplexity(workflow);
		const validation = ComfyUIWorkflowService.validateWorkflowForExecution(workflow);
		const nodesByCategory = ComfyUIWorkflowService.groupNodesByCategory(workflow);
		const requiredModels = ComfyUIWorkflowService.extractRequiredModels(workflow);

		return {
			complexity,
			validation,
			nodesByCategory,
			requiredModels,
		};
	}, [workflow]);

	const getComplexityColor = (level: string) => {
		switch (level) {
			case 'simple':
				return 'text-green-600';
			case 'medium':
				return 'text-yellow-600';
			case 'complex':
				return 'text-orange-600';
			case 'advanced':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	};

	const getCategoryColor = (category: ComfyNodeCategory) => {
		const colors = {
			[ComfyNodeCategory.INPUT]: '#4f46e5',
			[ComfyNodeCategory.OUTPUT]: '#be123c',
			[ComfyNodeCategory.PROCESSING]: '#059669',
			[ComfyNodeCategory.CONDITIONING]: '#7c3aed',
			[ComfyNodeCategory.MODEL]: '#dc2626',
			[ComfyNodeCategory.SAMPLING]: '#ea580c',
			[ComfyNodeCategory.LATENT]: '#0891b2',
			[ComfyNodeCategory.IMAGE]: '#16a34a',
			[ComfyNodeCategory.UTILS]: '#6b7280',
			[ComfyNodeCategory.UNKNOWN]: '#9ca3af',
		};
		return colors[category] || '#6b7280';
	};

	return (
		<div className={`flex flex-col space-y-4 ${className || ''}`}>
			{/* Header con información general */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<Network className="h-5 w-5 text-primary" />
						{workflow.extra?.info?.name || workflow.fileName}
						<Badge className={getComplexityColor(workflowInfo.complexity.level)} variant="outline">
							{workflowInfo.complexity.level}
						</Badge>
						{workflowInfo.validation.isValid ? (
							<CheckCircle className="h-4 w-4 text-green-600" />
						) : (
							<AlertTriangle className="h-4 w-4 text-red-600" />
						)}
					</CardTitle>
					{workflow.extra?.info?.description && (
						<p className="text-muted-foreground text-sm">{workflow.extra.info.description}</p>
					)}
				</CardHeader>
				<CardContent className="pt-0">
					<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-blue-500" />
							<span className="text-muted-foreground">Nodos:</span>
							<span className="font-medium">{workflow.stats.nodeCount}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-muted-foreground">Conexiones:</span>
							<span className="font-medium">{workflow.stats.linkCount}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-orange-500" />
							<span className="text-muted-foreground">Grupos:</span>
							<span className="font-medium">{workflow.stats.groupCount}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-purple-500" />
							<span className="text-muted-foreground">Modelos:</span>
							<span className="font-medium">{workflow.stats.modelCount}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Grid con información detallada */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Metadatos del workflow */}
				{workflow.extra?.info && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-sm">
								<Info className="h-4 w-4" />
								Información del Workflow
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{workflow.extra.info.author && (
								<div className="flex items-center gap-2 text-sm">
									<User className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">Autor:</span>
									<span>{workflow.extra.info.author}</span>
								</div>
							)}
							{workflow.extra.info.version && (
								<div className="flex items-center gap-2 text-sm">
									<FileText className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">Versión:</span>
									<span>{workflow.extra.info.version}</span>
								</div>
							)}
							{workflow.extra.info.created && (
								<div className="flex items-center gap-2 text-sm">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">Creado:</span>
									<span>{new Date(workflow.extra.info.created).toLocaleDateString()}</span>
								</div>
							)}
							{workflow.extra.info.modified && (
								<div className="flex items-center gap-2 text-sm">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">Modificado:</span>
									<span>{new Date(workflow.extra.info.modified).toLocaleDateString()}</span>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Validación */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							{workflowInfo.validation.isValid ? (
								<CheckCircle className="h-4 w-4 text-green-600" />
							) : (
								<AlertTriangle className="h-4 w-4 text-red-600" />
							)}
							Estado de Validación
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center gap-2">
							<Badge variant={workflowInfo.validation.isValid ? 'default' : 'destructive'}>
								{workflowInfo.validation.isValid ? 'Válido para ejecución' : 'Requiere corrección'}
							</Badge>
						</div>

						{workflowInfo.validation.errors.length > 0 && (
							<div className="space-y-2">
								<p className="font-medium text-red-600 text-sm">Errores:</p>
								<ul className="space-y-1 text-red-600 text-xs">
									{workflowInfo.validation.errors.map((error, index) => (
										<li className="flex items-start gap-2" key={index}>
											<span className="text-red-500">•</span>
											<span>{error}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{workflowInfo.validation.warnings.length > 0 && (
							<div className="space-y-2">
								<p className="font-medium text-sm text-yellow-600">Advertencias:</p>
								<ul className="space-y-1 text-xs text-yellow-600">
									{workflowInfo.validation.warnings.map((warning, index) => (
										<li className="flex items-start gap-2" key={index}>
											<span className="text-yellow-500">•</span>
											<span>{warning}</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Nodos por categoría */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm">
						<Network className="h-4 w-4" />
						Nodos por Categoría
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ScrollArea className="h-64">
						<div className="space-y-4">
							{Object.entries(workflowInfo.nodesByCategory)
								.filter(([, nodes]) => nodes.length > 0)
								.map(([category, nodes]) => (
									<div key={category}>
										<div className="mb-2 flex items-center gap-2">
											<div
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: getCategoryColor(category as ComfyNodeCategory) }}
											/>
											<span className="font-medium text-sm capitalize">{category}</span>
											<Badge className="text-xs" variant="outline">
												{nodes.length}
											</Badge>
										</div>
										<div className="space-y-1 pl-5">
											{nodes.slice(0, 5).map((node) => {
												const typeInfo = ComfyUIWorkflowService.getNodeTypeInfo(node.type);
												return (
													<div className="flex items-center gap-2 text-muted-foreground text-xs" key={node.id}>
														<span className="rounded bg-muted px-1 font-mono">{node.id}</span>
														<span>{typeInfo.displayName}</span>
													</div>
												);
											})}
											{nodes.length > 5 && (
												<p className="pl-2 text-muted-foreground text-xs">... y {nodes.length - 5} más</p>
											)}
										</div>
									</div>
								))}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>

			{/* Modelos requeridos */}
			{workflowInfo.requiredModels.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<Play className="h-4 w-4" />
							Modelos Requeridos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{workflowInfo.requiredModels.map((model, index) => (
								<Badge className="text-xs" key={index} variant="outline">
									{model}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
});

WorkflowViewer.displayName = 'WorkflowViewer';
