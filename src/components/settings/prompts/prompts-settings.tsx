import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toastService from '@/services/toast';
import type { PromptBase } from '@/types/entities/prompt/base';
import { PromptCategory } from '@/types/entities/prompt/enums';
import { useDeletePrompt, usePrompts } from '@/lib/api/prompts';
import { AlertCircle, Check, Delete, Edit, Loader2, Plus, Search, Star, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CreatePromptForm } from './create-prompt-form';

// Interfaz para PropntWithNullable que funciona como adaptador para el componente CreatePromptForm
interface PromptWithNullable {
	id: string;
	name: string;
	emoji: string | null;
	color: string;
	description: string | null;
	content: string;
	category: string | null;
	parameters: string;
	tags: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	presetId: string | null;
}

// Interfaz para el tipo que espera el componente CreatePromptForm
interface CreatePromptFormPrompt {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	category: string;
	parameters: string;
	tags: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	presetId: string | null;
}

export const PromptSettings = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [editingPrompt, setEditingPrompt] = useState<CreatePromptFormPrompt | null>(null);

	// React Query hooks
	const { data: promptsData = [], isLoading: loading, error } = usePrompts({});
	const deletePromptMutation = useDeletePrompt();

	// Convertir los datos para que coincidan con nuestra interfaz usando useMemo
	const prompts = useMemo(() => {
		return promptsData.map((prompt) => ({
			...prompt,
			emoji: prompt.emoji || null,
			description: prompt.description || null,
			category: prompt.category || null,
			isFavorite: prompt.isFavorite || false,
		})) as PromptWithNullable[];
	}, [promptsData]);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await deletePromptMutation.mutateAsync(id);
				toastService.success('Prompt eliminado correctamente');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				toastService.error('Error al eliminar prompt', {
					description: errorMessage,
				});
			}
		},
		[deletePromptMutation]
	);

	const handleDeleteButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		const target = e.currentTarget as HTMLButtonElement;
		const id = target.getAttribute('data-id');
		if (id) {
			handleDelete(id);
		}
	};

	const handleEdit = (prompt: PromptWithNullable) => {
		// Convertir PromptWithNullable a CreatePromptFormPrompt
		setEditingPrompt({
			...prompt,
			emoji: prompt.emoji || '📝',
			category: prompt.category || '',
		});
		setShowCreateDialog(true);
	};

	const handlePromptCreated = useCallback((newPrompt: PromptBase) => {
		setShowCreateDialog(false);
		toastService.success('Prompt creado correctamente');
	}, []);

	const handlePromptUpdated = useCallback((updatedPrompt: PromptBase) => {
		setShowCreateDialog(false);
		setEditingPrompt(null);
		toastService.success('Prompt actualizado correctamente');
	}, []);

	// Filtrar prompts usando useMemo para optimización
	const filteredPrompts = useMemo(() => {
		return prompts.filter((prompt) => {
			const matchesSearch = searchTerm
				? prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					prompt.description?.toLowerCase().includes(searchTerm.toLowerCase())
				: true;

			const matchesCategory = categoryFilter && categoryFilter !== 'all' ? prompt.category === categoryFilter : true;

			const matchesFavorites = showOnlyFavorites ? prompt.isFavorite : true;

			return matchesSearch && matchesCategory && matchesFavorites;
		});
	}, [prompts, searchTerm, categoryFilter, showOnlyFavorites]);

	// Estados de carga y error
	if (loading) {
		return (
			<ScrollArea className="h-[calc(100vh-8rem)] w-full">
				<div className="flex items-center justify-center h-full">
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando prompts...</p>
					</div>
				</div>
			</ScrollArea>
		);
	}

	if (error) {
		return (
			<ScrollArea className="h-[calc(100vh-8rem)] w-full">
				<div className="p-6">
					<div className="flex flex-col items-center gap-4 text-center">
						<AlertCircle className="h-12 w-12 text-destructive" />
						<div>
							<h3 className="text-lg font-semibold">Error al cargar prompts</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{error instanceof Error ? error.message : 'Error desconocido'}
							</p>
						</div>
						<Button onClick={() => window.location.reload()} variant="outline">
							Intentar de nuevo
						</Button>
					</div>
				</div>
			</ScrollArea>
		);
	}

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<div className="space-y-6">
				<div className="flex flex-col space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-2xl font-bold tracking-tight">Prompts</h2>
						<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
							<DialogTrigger asChild>
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									Nuevo Prompt
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-4xl">
								<DialogHeader>
									<DialogTitle>{editingPrompt ? 'Editar Prompt' : 'Crear Nuevo Prompt'}</DialogTitle>
									<DialogDescription>
										{editingPrompt
											? 'Actualiza los detalles del prompt existente'
											: 'Completa el formulario para crear un nuevo prompt'}
									</DialogDescription>
								</DialogHeader>
								<CreatePromptForm
									prompt={editingPrompt}
									isEditing={!!editingPrompt}
									onCreated={handlePromptCreated}
									onUpdated={handlePromptUpdated}
									onCancel={() => {
										setShowCreateDialog(false);
										setEditingPrompt(null);
									}}
								/>
							</DialogContent>
						</Dialog>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar prompts..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>

						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Todas las categorías" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas las categorías</SelectItem>
								{Object.values(PromptCategory).map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Button
							variant={showOnlyFavorites ? 'default' : 'outline'}
							onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
						>
							<Star className={`mr-2 h-4 w-4 ${showOnlyFavorites ? 'text-yellow-300 fill-yellow-300' : ''}`} />
							Solo favoritos
						</Button>
					</div>
				</div>

				<Tabs defaultValue="grid">
					<TabsList className="mb-4">
						<TabsTrigger value="grid">Cuadrícula</TabsTrigger>
						<TabsTrigger value="list">Lista</TabsTrigger>
					</TabsList>

					<TabsContent value="grid" className="space-y-4">
						{loading ? (
							<div className="text-center py-8">Cargando prompts...</div>
						) : filteredPrompts.length === 0 ? (
							<div className="text-center py-8">No se encontraron prompts.</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredPrompts.map((prompt) => (
									<div
										key={prompt.id}
										className="bg-card rounded-lg border p-4 shadow-sm transition-all hover:shadow-md"
									>
										<div className="flex justify-between items-start">
											<div className="flex items-center gap-2">
												<span className="text-2xl">{prompt.emoji || '📝'}</span>
												<div>
													<h3 className="font-semibold">{prompt.name}</h3>
													<p className="text-xs text-muted-foreground">{prompt.category}</p>
												</div>
											</div>
											{prompt.isFavorite && <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />}
										</div>

										<p className="mt-2 text-sm text-muted-foreground line-clamp-2">
											{prompt.description || 'Sin descripción'}
										</p>

										<div className="mt-4 flex justify-end gap-2">
											<Button variant="ghost" size="sm" onClick={() => handleEdit(prompt)}>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												data-id={prompt.id}
												onClick={handleDeleteButtonClick as unknown as () => void}
												className="text-destructive"
											>
												<Delete className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="list">
						{loading ? (
							<div className="text-center py-8">Cargando prompts...</div>
						) : filteredPrompts.length === 0 ? (
							<div className="text-center py-8">No se encontraron prompts.</div>
						) : (
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Emoji</TableHead>
											<TableHead>Nombre</TableHead>
											<TableHead>Categoría</TableHead>
											<TableHead>Descripción</TableHead>
											<TableHead>Favorito</TableHead>
											<TableHead className="text-right">Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredPrompts.map((prompt) => (
											<TableRow key={prompt.id}>
												<TableCell className="text-xl">{prompt.emoji || '📝'}</TableCell>
												<TableCell className="font-medium">{prompt.name}</TableCell>
												<TableCell>{prompt.category}</TableCell>
												<TableCell className="max-w-[300px] truncate">
													{prompt.description || 'Sin descripción'}
												</TableCell>
												<TableCell>
													{prompt.isFavorite ? (
														<Check className="h-4 w-4 text-green-500" />
													) : (
														<X className="h-4 w-4 text-muted-foreground" />
													)}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button variant="outline" size="sm" onClick={() => handleEdit(prompt)}>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															variant="outline"
															size="sm"
															data-id={prompt.id}
															onClick={handleDeleteButtonClick as unknown as () => void}
															className="text-destructive"
														>
															<Delete className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</ScrollArea>
	);
};
