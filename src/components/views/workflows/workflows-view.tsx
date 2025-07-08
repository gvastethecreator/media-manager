import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { WorkflowCard } from '@/components/entities/workflow/workflow-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflowStore } from '@/store/entities/workflow';
import { clientLogger } from '@/lib/logger/client-logger';
import { useToast } from '@/components/ui/use-toast';
import { Workflow } from 'lucide-react';

const viewLogger = clientLogger.withContext('WorkflowsView');

export function WorkflowsView() {
	const { workflows, isLoading, error, loadWorkflows, createWorkflow } = useWorkflowStore((state) => ({
		workflows: Object.values(state.workflows),
		isLoading: state.isLoading,
		error: state.error,
		loadWorkflows: state.loadWorkflows,
		createWorkflow: state.createWorkflow,
	}));

	const [showForm, setShowForm] = useState(false);
	const [newWorkflowName, setNewWorkflowName] = useState('');
	const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

	useEffect(() => {
		if (workflows.length === 0 && !isLoading) {
			viewLogger.info('Store de workflows vacío, cargando desde el servidor...');
			loadWorkflows();
		}
	}, [loadWorkflows, workflows.length, isLoading]);

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
		await createWorkflow({ name: newWorkflowName, description: newWorkflowDescription });
		setNewWorkflowName('');
		setNewWorkflowDescription('');
		setShowForm(false);
	}, [newWorkflowName, newWorkflowDescription, createWorkflow]);

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

				{workflows.length === 0 && !isLoading && !showForm ? (
					<EmptyState
						icon={Workflow}
						title="No hay workflows creados"
						description="Crea un workflow para automatizar tareas."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{workflows.map((wf, index) => (
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
