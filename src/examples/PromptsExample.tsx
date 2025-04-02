'use client';

/**
 * @file Componente de ejemplo para gestión de prompts
 * @module examples/PromptsExample
 */

import { createPrompt, deletePrompt, getPrompt, getPrompts, updatePrompt } from '@/app/actions/prompts/prompt.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { usePromptStore } from '@/store/entities/prompt';
import { transformPromptToWithStats } from '@/transformers/prompt';
import { PromptCategory } from '@/types/entities/prompt/enums';
import { type CreatePromptData, type PromptComplete } from '@/types/entities/prompt/types';
import { Braces, Code2, HeartIcon, ImageIcon, MessagesSquare, PencilIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 📝 Componente de ejemplo para la gestión de prompts
 */
export default function PromptsExample() {
	const [prompts, setPrompts] = useState<PromptComplete[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedPrompt, setSelectedPrompt] = useState<PromptComplete | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<CreatePromptData>({
		name: '',
		emoji: '📝',
		color: '#3B82F6',
		description: '',
		content: '',
		purpose: '',
		category: 'general',
		parameters: '{}',
		tags: '[]',
		isFavorite: false
	});

	// Store de prompts
	const promptStore = usePromptStore();

	// Cargar prompts al iniciar
	useEffect(() => {
		loadPrompts();
	}, []);

	// Cargar prompts desde la API
	const loadPrompts = async () => {
		try {
			setLoading(true);
			const fetchedPrompts = await getPrompts();
			setPrompts(fetchedPrompts);
			promptStore.setPrompts(fetchedPrompts);
			toast.success('Prompts cargados correctamente');
		} catch (error) {
			console.error('Error al cargar prompts:', error);
			toast.error('Error al cargar prompts');
		} finally {
			setLoading(false);
		}
	};

	// Seleccionar un prompt para editar
	const selectPrompt = async (id: string) => {
		try {
			setLoading(true);
			const prompt = await getPrompt(id);
			if (prompt) {
				setSelectedPrompt(prompt);
				setFormData({
					name: prompt.name,
					emoji: prompt.emoji,
					color: prompt.color,
					description: prompt.description || '',
					content: prompt.content,
					purpose: prompt.purpose,
					category: prompt.category,
					parameters: typeof prompt.parameters === 'string' ? prompt.parameters : JSON.stringify(prompt.parameters),
					tags: typeof prompt.tags === 'string' ? prompt.tags : JSON.stringify(prompt.tags),
					isFavorite: prompt.isFavorite
				});
				setIsEditing(true);
			}
		} catch (error) {
			console.error('Error al cargar prompt:', error);
			toast.error('Error al cargar prompt');
		} finally {
			setLoading(false);
		}
	};

	// Enviar formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setLoading(true);

			if (isEditing && selectedPrompt) {
				// Actualizar prompt existente
				const updatedPrompt = await updatePrompt(selectedPrompt.id, formData);
				setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
				promptStore.updatePrompt(updatedPrompt.id, formData);
				toast.success(`Prompt "${updatedPrompt.name}" actualizado`);
			} else {
				// Crear nuevo prompt
				const newPrompt = await createPrompt(formData);
				setPrompts(prev => [...prev, newPrompt]);
				promptStore.addPrompt(newPrompt);
				toast.success(`Prompt "${newPrompt.name}" creado`);
			}

			// Resetear formulario
			resetForm();
		} catch (error) {
			console.error('Error al guardar prompt:', error);
			toast.error('Error al guardar prompt');
		} finally {
			setLoading(false);
		}
	};

	// Eliminar prompt
	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar este prompt?')) return;

		try {
			setLoading(true);
			await deletePrompt(id);

			// Actualizar lista y store
			setPrompts(prev => prev.filter(p => p.id !== id));
			promptStore.deletePrompt(id);

			// Si estamos editando este prompt, resetear
			if (selectedPrompt?.id === id) {
				resetForm();
			}

			toast.success('Prompt eliminado');
		} catch (error) {
			console.error('Error al eliminar prompt:', error);
			toast.error('Error al eliminar prompt');
		} finally {
			setLoading(false);
		}
	};

	// Resetear formulario
	const resetForm = () => {
		setSelectedPrompt(null);
		setIsCreating(false);
		setIsEditing(false);
		setFormData({
			name: '',
			emoji: '📝',
			color: '#3B82F6',
			description: '',
			content: '',
			purpose: '',
			category: 'general',
			parameters: '{}',
			tags: '[]',
			isFavorite: false
		});
	};

	// Manejar cambios en el formulario
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else {
			setFormData(prev => ({ ...prev, [name]: value }));
		}
	};

	// Renderizar icono según categoría
	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'image':
				return <ImageIcon className="h-4 w-4" />;
			case 'text':
				return <MessagesSquare className="h-4 w-4" />;
			case 'code':
				return <Code2 className="h-4 w-4" />;
			default:
				return <Braces className="h-4 w-4" />;
		}
	};

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Gestión de Prompts</h1>
				<div className="flex gap-2">
					<Button onClick={() => setIsCreating(true)} variant="default">
						<PlusIcon className="h-4 w-4 mr-2" />
						Nuevo Prompt
					</Button>
					<Button onClick={loadPrompts} disabled={loading} variant="outline">
						{loading ? 'Cargando...' : 'Actualizar'}
					</Button>
				</div>
			</div>

			{/* Lista de prompts */}
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
				{prompts.length === 0 ? (
					<div className="col-span-full text-center py-8 bg-muted rounded-lg">
						<p className="text-muted-foreground">No hay prompts disponibles</p>
						<Button onClick={() => setIsCreating(true)} variant="link" className="mt-2">
							Crear tu primer prompt
						</Button>
					</div>
				) : (
					prompts.map(prompt => {
						const stats = transformPromptToWithStats(prompt);
						return (
							<Card key={prompt.id} className="overflow-hidden">
								<div
									className="h-2"
									style={{ backgroundColor: prompt.color || '#3B82F6' }}
								/>
								<CardHeader className="pb-2">
									<div className="flex justify-between items-center">
										<CardTitle className="flex items-center gap-2">
											<span>{prompt.emoji}</span>
											<span>{prompt.name}</span>
										</CardTitle>
										{prompt.isFavorite && (
											<HeartIcon className="h-4 w-4 text-red-500 fill-red-500" />
										)}
									</div>
									<CardDescription className="line-clamp-2">
										{prompt.description || 'Sin descripción'}
									</CardDescription>
								</CardHeader>
								<CardContent className="pb-2">
									<div className="flex justify-between items-center mb-2">
										<div className="flex items-center gap-1">
											{getCategoryIcon(prompt.category)}
											<span className="text-xs text-muted-foreground capitalize">
												{prompt.category}
											</span>
										</div>
										{prompt.purpose && (
											<span className="text-xs text-muted-foreground">
												{prompt.purpose}
											</span>
										)}
									</div>
									<div className="text-sm line-clamp-3 bg-muted p-2 rounded text-muted-foreground mb-2">
										{prompt.content || 'Sin contenido'}
									</div>
									<div className="text-xs text-muted-foreground">
										{stats.stats && (
											<div>
												<div className="flex items-center gap-2">
													<TagIcon className="h-3 w-3" />
													<span>{stats.stats.tagCount || 0} etiquetas</span>
												</div>
												<div className="flex justify-between">
													<span>Uso: {stats.stats.totalContentItems || 0} elementos</span>
													<span>Última act.: {new Date(prompt.updatedAt).toLocaleDateString()}</span>
												</div>
											</div>
										)}
									</div>
								</CardContent>
								<Separator />
								<CardFooter className="pt-2 flex justify-between">
									<Button
										size="sm"
										variant="destructive"
										onClick={() => handleDelete(prompt.id)}
									>
										<TrashIcon className="h-4 w-4 mr-1" />
										Eliminar
									</Button>
									<Button
										size="sm"
										variant="default"
										onClick={() => selectPrompt(prompt.id)}
									>
										<PencilIcon className="h-4 w-4 mr-1" />
										Editar
									</Button>
								</CardFooter>
							</Card>
						);
					})
				)}
			</div>

			{/* Modal de creación/edición */}
			<Dialog open={isCreating || isEditing} onOpenChange={(open) => {
				if (!open) resetForm();
				else if (!isEditing) setIsCreating(open);
			}}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{isEditing ? 'Editar Prompt' : 'Crear Nuevo Prompt'}</DialogTitle>
						<DialogDescription>
							{isEditing
								? `Editando "${selectedPrompt?.name}"`
								: 'Crea un nuevo prompt para generar contenido'}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit}>
						<div className="grid grid-cols-1 gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Nombre
								</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									placeholder="Nombre del prompt"
									className="col-span-3"
									required
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Apariencia</Label>
								<div className="col-span-3 flex gap-2">
									<Input
										name="emoji"
										value={formData.emoji}
										onChange={handleChange}
										placeholder="📝"
										className="w-16"
									/>
									<Input
										name="color"
										type="color"
										value={formData.color}
										onChange={handleChange}
										className="w-16"
									/>
									<Input
										name="color"
										value={formData.color}
										onChange={handleChange}
										placeholder="#3B82F6"
										className="flex-1"
									/>
								</div>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="description" className="text-right">
									Descripción
								</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description || ''}
									onChange={handleChange}
									placeholder="Descripción breve del prompt"
									className="col-span-3"
									rows={2}
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="category" className="text-right">
									Categoría
								</Label>
								<Select
									name="category"
									value={formData.category}
									onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecciona una categoría" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(PromptCategory).map(([key, value]) => (
											<SelectItem key={key} value={value.toLowerCase()}>
												{value}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="purpose" className="text-right">
									Propósito
								</Label>
								<Input
									id="purpose"
									name="purpose"
									value={formData.purpose}
									onChange={handleChange}
									placeholder="¿Para qué sirve este prompt?"
									className="col-span-3"
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="content" className="text-right">
									Contenido
								</Label>
								<Textarea
									id="content"
									name="content"
									value={formData.content}
									onChange={handleChange}
									placeholder="Contenido del prompt"
									className="col-span-3"
									rows={5}
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="parameters" className="text-right">
									Parámetros
								</Label>
								<Textarea
									id="parameters"
									name="parameters"
									value={formData.parameters}
									onChange={handleChange}
									placeholder='{"temperatura": 0.7, "maxTokens": 2000}'
									className="col-span-3 font-mono text-sm"
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="tags" className="text-right">
									Etiquetas
								</Label>
								<Input
									id="tags"
									name="tags"
									value={formData.tags}
									onChange={handleChange}
									placeholder='["etiqueta1", "etiqueta2"]'
									className="col-span-3 font-mono text-sm"
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Favorito</Label>
								<div className="col-span-3 flex items-center">
									<input
										id="isFavorite"
										name="isFavorite"
										type="checkbox"
										checked={formData.isFavorite}
										onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
										className="h-4 w-4 mr-2"
									/>
									<Label htmlFor="isFavorite">Marcar como favorito</Label>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={resetForm}>
								Cancelar
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Vista de depuración */}
			<div className="mt-8 border-t pt-4">
				<details>
					<summary className="font-medium cursor-pointer">Vista de depuración</summary>
					<div className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-96">
						<pre className="text-xs">{JSON.stringify(promptStore.getState(), null, 2)}</pre>
					</div>
				</details>
			</div>
		</div>
	);
}