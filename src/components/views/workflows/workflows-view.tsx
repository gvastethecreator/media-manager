import { Workflow } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { WorkflowCard } from '@/components/entities/workflow/workflow-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createWorkflowInApi, getWorkflowsFromApi } from '@/lib/api/client/workflow.client';
import { clientLogger } from '@/lib/logger/client-logger';
import type { WorkflowCreateInput, WorkflowWithStats } from '@/types/entities/workflow';

const viewLogger = clientLogger.withContext('WorkflowsView');

export function WorkflowsView() {
	const [workflows, setWorkflows] = useState<WorkflowWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [showForm, setShowForm] = useState(false);
	const [newWorkflowName, setNewWorkflowName] = useState('');
	const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

	const loadWorkflows = useCallback(async () => {
		if (isLoading) return;
		setIsLoading(true);
		setError(null);
		try {
			const data = await getWorkflowsFromApi();
			setWorkflows(data);
			viewLogger.info(`✅ ${data.length} workflows cargados.`);
		} catch (err) {
			const errorMsg = '❌ Error al cargar los workflows.';
			viewLogger.error(errorMsg, err);
			setError(errorMsg);
		} finally {
			setIsLoading(false);
		}
	}, [isLoading]);

	useEffect(() => {
		loadWorkflows();
	}, []);

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
			const newWorkflow = await createWorkflowInApi(workflowData);
			setWorkflows((prev) => [...prev, newWorkflow]);
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
	}, [newWorkflowName, newWorkflowDescription, toast]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Workflows</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Workflow'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Workflow</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="workflowName">Nombre</Label>
							<Input
								id="workflowName"
								value={newWorkflowName}
								onChange={(e) => setNewWorkflowName(e.target.value)}
								placeholder="Nombre del workflow"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="workflowDescription">Descripción</Label>
							<Textarea
								id="workflowDescription"
								value={newWorkflowDescription}
								onChange={(e) => setNewWorkflowDescription(e.target.value)}
								placeholder="Descripción del workflow (opcional)"
							/>
						</div>
						<Button onClick={handleCreateWorkflow}>Guardar Workflow</Button>
					</div>
				)}

				{(!workflows || workflows.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						icon={Workflow}
						title="No hay workflows creados"
						description="Crea un workflow para automatizar tareas."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{workflows?.map((wf, index) => (
							<motion.div
								key={wf.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<WorkflowCard key={wf.id} name={wf.name} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
