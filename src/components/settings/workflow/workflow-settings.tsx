import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Settings2, PlusCircle, Trash, Edit2 } from 'lucide-react';
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow, useUpdateWorkflow } from '@/lib/api/workflows';
import type { WorkflowWithStats, WorkflowCreateInput } from '@/types/entities/workflow';
import { toastService } from '@/lib/ui/toast';

export function WorkflowSettings() {
	const { data, isLoading, error } = useWorkflows();
	const createWorkflow = useCreateWorkflow();
	const updateWorkflow = useUpdateWorkflow();
	const deleteWorkflow = useDeleteWorkflow();

	const [search, setSearch] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [editing, setEditing] = useState<WorkflowWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');
	const [descriptionInput, setDescriptionInput] = useState('');

	const workflows = data ?? [];
	const filtered = useMemo(
		() =>
			workflows.filter(
				(w: WorkflowWithStats) =>
					w.name.toLowerCase().includes(search.toLowerCase()) ||
					w.description?.toLowerCase().includes(search.toLowerCase())
			),
		[workflows, search]
	);

	const handleCreate = async () => {
		try {
			if (!nameInput.trim()) return;
			const createData: WorkflowCreateInput = {
				name: nameInput.trim(),
				description: descriptionInput.trim() || null,
				emoji: null,
				color: null,
				category: null,
				isFavorite: false,
				isActive: true,
				version: '1.0',
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
			await createWorkflow.mutateAsync(createData);
			setNameInput('');
			setDescriptionInput('');
			setShowCreate(false);
			toastService.success('Workflow creado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al crear workflow', { description: msg });
		}
	};

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateWorkflow.mutateAsync({
				id: editing.id,
				data: {
					name: nameInput.trim(),
					description: descriptionInput.trim() || null,
				},
			});
			setEditing(null);
			setNameInput('');
			setDescriptionInput('');
			toastService.success('Workflow actualizado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al actualizar workflow', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteWorkflow.mutateAsync(id);
			toastService.success('Workflow eliminado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al eliminar workflow', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Settings2 className="h-4 w-4" />
						<span>Workflows</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input placeholder="Buscar workflows..." value={search} onChange={(e) => setSearch(e.target.value)} />
						<Button size="sm" onClick={() => setShowCreate(true)}>
							<PlusCircle className="mr-2 h-4 w-4" /> Nuevo
						</Button>
					</div>

					{isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" /> Cargando...
						</div>
					) : error ? (
						<div className="text-destructive text-sm">{error.message}</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((w: WorkflowWithStats) => (
								<Card key={w.id} className="p-3">
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{w.name}</div>
											{w.description && <div className="text-muted-foreground mt-1 text-xs">{w.description}</div>}
											<div className="mt-1 flex items-center gap-2">
												<div
													className={`rounded px-1.5 py-0.5 text-xs ${
														w.isActive
															? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
															: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
													}`}
												>
													{w.isActive ? 'Activo' : 'Inactivo'}
												</div>
												<div className="text-muted-foreground text-xs">v{w.version}</div>
											</div>
										</div>
										<div className="flex items-center gap-1">
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8"
												title="Editar"
												onClick={() => {
													setEditing(w);
													setNameInput(w.name);
													setDescriptionInput(w.description || '');
												}}
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 hover:text-destructive"
												title="Eliminar"
												onClick={() => handleDelete(w.id)}
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={showCreate}
				onOpenChange={(o) => {
					if (!o) {
						setShowCreate(false);
						setNameInput('');
						setDescriptionInput('');
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Nuevo workflow</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input placeholder="Nombre" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
						<Input
							placeholder="Descripción (opcional)"
							value={descriptionInput}
							onChange={(e) => setDescriptionInput(e.target.value)}
						/>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowCreate(false);
									setNameInput('');
									setDescriptionInput('');
								}}
							>
								Cancelar
							</Button>
							<Button onClick={handleCreate}>Crear</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(editing)}
				onOpenChange={(o) => {
					if (!o) {
						setEditing(null);
						setNameInput('');
						setDescriptionInput('');
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Editar workflow</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input placeholder="Nombre" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
						<Input
							placeholder="Descripción (opcional)"
							value={descriptionInput}
							onChange={(e) => setDescriptionInput(e.target.value)}
						/>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setEditing(null);
									setNameInput('');
									setDescriptionInput('');
								}}
							>
								Cancelar
							</Button>
							<Button onClick={handleUpdate}>Guardar</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</ScrollArea>
	);
}
