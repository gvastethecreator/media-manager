import { AlertCircle, Check, Delete, Edit, Loader2, Plus, Search, Star, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
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
import { useDeletePrompt, usePrompts } from '@/lib/api/prompts';
import { toastService } from '@/lib/ui/toast';
import type { PromptBase } from '@/types/entities/prompt/base';
import { PromptCategory } from '@/types/entities/prompt/enums';
import { CreatePromptForm } from './create-prompt-form';

// Interfaz para PropntWithNullable que funciona como adaptador para el componente CreatePromptForm
interface PromptWithNullable {
	id: string;
	name: string;
	emoji: string | null;
	color: string | null;
	description: string | null;
	content: string | null;
	category: string | null;
	parameters: string | null;
	tags: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	presetId: string | null;
	// Propiedades adicionales requeridas

	totalImages: number;
	totalVideos: number;
	type: string | null;
	style: string | null;
	mood: string | null;
	lighting: string | null;
	composition: string | null;
	technique: string | null;
	inspiration: string | null;
	notes: string | null;
	parentId: string | null;
}

// Interfaz para el tipo que espera el componente CreatePromptForm
interface CreatePromptFormPrompt {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;

	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	content: string | null;
	parameters: string | null;
	style: string | null;
	mood: string | null;
	lighting: string | null;
	composition: string | null;
	technique: string | null;
	inspiration: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
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
		if (!Array.isArray(promptsData)) {
			return [];
		}
		return promptsData.map((prompt: any) => ({
			...prompt,
			emoji: prompt.emoji || null,
			description: prompt.description || null,
			category: prompt.category || null,
			isFavorite: prompt.isFavorite,

			totalImages: prompt.totalImages || 0,
			totalVideos: prompt.totalVideos || 0,
			type: prompt.type || null,
			content: prompt.content || null,
			parameters: prompt.parameters || null,
			style: prompt.style || null,
			mood: prompt.mood || null,
			lighting: prompt.lighting || null,
			composition: prompt.composition || null,
			technique: prompt.technique || null,
			inspiration: prompt.inspiration || null,
			notes: prompt.notes || null,
			parentId: prompt.parentId || null,
		})) as PromptWithNullable[];
	}, [promptsData]);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await deletePromptMutation.mutateAsync(id);
				toastService.success('Prompt eliminado correctamente');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
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

			totalImages: prompt.totalImages || 0,
			totalVideos: prompt.totalVideos || 0,
			type: prompt.type || null,
			content: prompt.content || null,
			parameters: prompt.parameters || null,
			style: prompt.style || null,
			mood: prompt.mood || null,
			lighting: prompt.lighting || null,
			composition: prompt.composition || null,
			technique: prompt.technique || null,
			inspiration: prompt.inspiration || null,
			notes: prompt.notes || null,
			parentId: prompt.parentId || null,
		});
		setShowCreateDialog(true);
	};

	const handlePromptCreated = useCallback((_newPrompt: PromptBase) => {
		setShowCreateDialog(false);
		toastService.success('Prompt creado correctamente');
	}, []);

	const handlePromptUpdated = useCallback((_updatedPrompt: PromptBase) => {
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
				<div className="flex h-full items-center justify-center">
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Cargando prompts...</p>
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
							<h3 className="font-semibold text-lg">Error al cargar prompts</h3>
							<p className="mt-1 text-muted-foreground text-sm">
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
					<div className="flex items-center justify-between">
						<h2 className="font-bold text-2xl tracking-tight">Prompts</h2>
						<Dialog onOpenChange={setShowCreateDialog} open={showCreateDialog}>
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
									isEditing={!!editingPrompt}
									onCancel={() => {
										setShowCreateDialog(false);
										setEditingPrompt(null);
									}}
									onCreated={handlePromptCreated}
									onUpdated={handlePromptUpdated}
									prompt={editingPrompt}
								/>
							</DialogContent>
						</Dialog>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="relative">
							<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
							<Input
								className="pl-8"
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Buscar prompts..."
								value={searchTerm}
							/>
						</div>

						<Select onValueChange={setCategoryFilter} value={categoryFilter}>
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
							onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
							variant={showOnlyFavorites ? 'default' : 'outline'}
						>
							<Star className={`mr-2 h-4 w-4 ${showOnlyFavorites ? 'fill-yellow-300 text-yellow-300' : ''}`} />
							Solo favoritos
						</Button>
					</div>
				</div>

				<Tabs defaultValue="grid">
					<TabsList className="mb-4">
						<TabsTrigger value="grid">Cuadrícula</TabsTrigger>
						<TabsTrigger value="list">Lista</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="grid">
						{loading ? (
							<div className="py-8 text-center">Cargando prompts...</div>
						) : filteredPrompts.length === 0 ? (
							<div className="py-8 text-center">No se encontraron prompts.</div>
						) : (
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{filteredPrompts.map((prompt) => (
									<div
										className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
										key={prompt.id}
									>
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-2">
												<span className="text-2xl">{prompt.emoji || '📝'}</span>
												<div>
													<h3 className="font-semibold">{prompt.name}</h3>
													<p className="text-muted-foreground text-xs">{prompt.category}</p>
												</div>
											</div>
											{prompt.isFavorite && <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />}
										</div>

										<p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
											{prompt.description || 'Sin descripción'}
										</p>

										<div className="mt-4 flex justify-end gap-2">
											<Button onClick={() => handleEdit(prompt)} size="sm" variant="ghost">
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												className="text-destructive"
												data-id={prompt.id}
												onClick={handleDeleteButtonClick as unknown as () => void}
												size="sm"
												variant="ghost"
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
							<div className="py-8 text-center">Cargando prompts...</div>
						) : filteredPrompts.length === 0 ? (
							<div className="py-8 text-center">No se encontraron prompts.</div>
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
														<Button onClick={() => handleEdit(prompt)} size="sm" variant="outline">
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															className="text-destructive"
															data-id={prompt.id}
															onClick={handleDeleteButtonClick as unknown as () => void}
															size="sm"
															variant="outline"
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
