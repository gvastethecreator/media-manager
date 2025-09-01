import { Workflow } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { MultiEntityViewer } from '@/components/features/file-viewer/multi-entity-viewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateWorkflow, useWorkflows } from '@/lib/api/workflows';
import { clientLogger } from '@/lib/logger/client-logger';
import { useMultiEntityViewerStore } from '@/stores/multi-entity-viewer.store';
import type { AnyEntityWithStats } from '@/types/entities';
import type { WorkflowCreateInput, WorkflowWithStats } from '@/types/entities/workflow';

const viewLogger = clientLogger.withContext('WorkflowsView');

export function WorkflowsView() {
	const { data: workflows, isLoading, error } = useWorkflows();
	const { mutate: createWorkflow } = useCreateWorkflow();
	const { isOpen, entities, currentIndex, openViewer, closeViewer, setCurrentIndex } = useMultiEntityViewerStore();

	const [showForm, setShowForm] = useState(false);
	const [newWorkflowName, setNewWorkflowName] = useState('');
	const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

	useEffect(() => {
		if (workflows && workflows.length > 0) {
			viewLogger.info(`✅ ${workflows.length} workflows cargados.`);
		}
	}, [workflows]);

	const { toast } = useToast();
	const handleCreateWorkflow = useCallback(async () => {
		if (newWorkflowName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre del workflow no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}
		try {
			const workflowData: WorkflowCreateInput = {
				name: newWorkflowName,
				description: newWorkflowDescription || null,
				emoji: null,
				color: null,
				category: null,
				isFavorite: false,
				isActive: true,
				version: '1.0.0',
				config: null,
				steps: null,
				triggers: null,
				conditions: null,
				actions: null,
				schedule: null,
				lastRun: null,
				nextRun: null,
				runCount: 0,
				successCount: 0,
				errorCount: 0,
			};
			createWorkflow(workflowData);
			toast({
				title: '✅ Éxito',
				description: `Workflow "${newWorkflowName}" creado.`,
			});
			setNewWorkflowName('');
			setNewWorkflowDescription('');
			setShowForm(false);
		} catch (err) {
			toast({
				title: '❌ Error',
				description: `Error al crear el workflow "${newWorkflowName}".`,
				variant: 'destructive',
			});
		}
	}, [newWorkflowName, newWorkflowDescription, toast, createWorkflow]);

	const handleWorkflowClick = useCallback((item: AnyEntityWithStats) => {
		const workflow = item as unknown as WorkflowWithStats;
		viewLogger.info('🖱️ Click en workflow:', workflow.name);
		// TODO: Implementar navegación a detalle de workflow
	}, []);

	const handleWorkflowDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			const workflow = item as unknown as WorkflowWithStats;
			viewLogger.info('🖱️ Doble click en workflow:', workflow.name);

			// Abrir MultiEntityViewer con todos los workflows
			const workflowItems = (workflows || []) as unknown as AnyEntityWithStats[];
			const currentIndex = workflowItems.findIndex((w) => w.id === workflow.id);
			openViewer(workflowItems, currentIndex >= 0 ? currentIndex : 0);
		},
		[workflows, openViewer]
	);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	const workflowItems = (workflows || []) as unknown as AnyEntityWithStats[];

	return (
		<>
			<ScrollArea className="h-full">
				<div className="container mx-auto p-6">
					<h2 className="mb-4 font-bold text-xl">Vista de Workflows</h2>

					<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
						{showForm ? 'Cancelar' : 'Crear Workflow'}
					</Button>

					{showForm && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-6 rounded-lg border p-4 shadow-sm"
							initial={{ opacity: 0, y: -20 }}
						>
							<h3 className="mb-3 font-semibold text-lg">Nuevo Workflow</h3>
							<div className="mb-3 grid gap-2">
								<Label htmlFor="workflowName">Nombre</Label>
								<Input
									id="workflowName"
									onChange={(e) => setNewWorkflowName(e.target.value)}
									placeholder="Nombre del workflow"
									value={newWorkflowName}
								/>
							</div>
							<div className="mb-4 grid gap-2">
								<Label htmlFor="workflowDescription">Descripción</Label>
								<Textarea
									id="workflowDescription"
									onChange={(e) => setNewWorkflowDescription(e.target.value)}
									placeholder="Descripción del workflow (opcional)"
									value={newWorkflowDescription}
								/>
							</div>
							<Button onClick={handleCreateWorkflow}>Guardar Workflow</Button>
						</motion.div>
					)}

					{(!workflowItems || workflowItems.length === 0) && !isLoading && !showForm ? (
						<EmptyState
							description="Crea un workflow para automatizar tareas."
							icon={Workflow}
							title="No hay workflows creados"
						/>
					) : (
						<div className="h-[calc(100vh-200px)]">
							<FileBrowser
								isLoading={isLoading}
								items={workflowItems}
								onItemClick={handleWorkflowClick}
								onItemDoubleClick={handleWorkflowDoubleClick}
							/>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* MultiEntityViewer */}
			<MultiEntityViewer
				currentIndex={currentIndex}
				entities={entities}
				isOpen={isOpen}
				onClose={closeViewer}
				onIndexChange={setCurrentIndex}
			/>
		</>
	);
}
