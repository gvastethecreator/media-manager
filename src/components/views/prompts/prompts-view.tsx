import { AlertCircle, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { MemoizedPromptCard } from '@/components/cards/prompt-card';
import { EmptyState } from '@/components/core/data-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { useCreatePrompt, usePrompts } from '@/lib/api/prompts';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePromptStore } from '@/store/entities/prompt/store';
import type { PromptWithStats } from '@/types/entities/prompt/base';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PromptsView');

export function PromptsView({ isVisible }: ViewProps) {
	const { navigateWithTransition } = useSeamlessNavigation();
	const { selectedPrompt, selectPrompt } = usePromptStore();
	const { mutate: createPrompt } = useCreatePrompt();

	const [localSearch, setLocalSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [newPromptName, setNewPromptName] = useState('');
	const [newPromptContent, setNewPromptContent] = useState('');
	const [newPromptDescription, setNewPromptDescription] = useState('');

	// Usar React Query hook en lugar de server action
	const {
		data: promptsResponse,
		isLoading,
		error,
		refetch,
	} = usePrompts({
		search: localSearch,
		sortBy: 'name',
		sortOrder: 'asc',
	});

	const prompts = promptsResponse?.data || [];

	const handlePromptSelect = useCallback(
		(promptId: string) => {
			viewLogger.info('🤖 Seleccionando prompt', { promptId });
			const prompt = prompts.find((p) => p.id === promptId) as PromptWithStats | undefined;
			if (prompt) {
				selectPrompt(prompt);
			}
			clientEvents.emit('prompt:selected', { promptId });
		},
		[selectPrompt, prompts]
	);

	const handlePromptEdit = useCallback(
		(promptId: string) => {
			viewLogger.info('✏️ Editando prompt', { promptId });
			navigateWithTransition(`/prompts/${promptId}/edit`);
		},
		[navigateWithTransition]
	);

	const { toast } = useToast();
	const handleCreatePrompt = useCallback(() => {
		if (newPromptName.trim() === '' || newPromptContent.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre y el contenido del prompt no pueden estar vacíos.',
				variant: 'destructive',
			});
			return;
		}
		createPrompt({ name: newPromptName, content: newPromptContent, description: newPromptDescription });
		setNewPromptName('');
		setNewPromptContent('');
		setNewPromptDescription('');
		setShowForm(false);
	}, [newPromptName, newPromptContent, newPromptDescription, createPrompt, toast]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar prompts');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<Spinner size="lg" />
					<p className="text-muted-foreground text-sm">Cargando prompts...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error al cargar prompts</AlertTitle>
					<AlertDescription>
						{error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
						<button className="ml-2 underline hover:no-underline" onClick={handleRetry}>
							Reintentar
						</button>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Vista de Prompts</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Prompt'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Prompt</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="promptName">Nombre</Label>
							<Input
								id="promptName"
								onChange={(e) => setNewPromptName(e.target.value)}
								placeholder="Nombre del prompt"
								value={newPromptName}
							/>
						</div>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="promptContent">Contenido</Label>
							<Textarea
								id="promptContent"
								onChange={(e) => setNewPromptContent(e.target.value)}
								placeholder="Contenido del prompt"
								value={newPromptContent}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="promptDescription">Descripción</Label>
							<Textarea
								id="promptDescription"
								onChange={(e) => setNewPromptDescription(e.target.value)}
								placeholder="Descripción del prompt (opcional)"
								value={newPromptDescription}
							/>
						</div>
						<Button onClick={handleCreatePrompt}>Guardar Prompt</Button>
					</div>
				)}

				{prompts.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
					>
						{prompts.map((prompt, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={prompt.id}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<MemoizedPromptCard
									className={prompt.id === selectedPrompt?.id ? 'ring-2 ring-primary' : ''}
									onClick={() => handlePromptSelect(prompt.id)}
									promptId={prompt.id}
								/>
							</motion.div>
						))}
					</motion.div>
				) : (
					<EmptyState
						description={
							localSearch
								? `No se encontraron prompts que coincidan con "${localSearch}"`
								: 'No hay prompts disponibles'
						}
						icon={MessageSquare}
						title="Sin prompts"
					/>
				)}
			</div>
		</ScrollArea>
	);
}
