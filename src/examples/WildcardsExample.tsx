'use client';

/**
 * @file Componente de ejemplo para gestión de wildcards
 * @module examples/WildcardsExample
 */

import { createWildcard, deleteWildcard, getWildcard, getWildcards, updateWildcard } from '@/app/actions/wildcards/wildcard.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useWildcardStore } from '@/store/entities/wildcard';
import { transformWildcardToWithStats } from '@/transformers/wildcard';
import { type CreateWildcardData, type WildcardComplete } from '@/types/entities/wildcard/types';
import { BracesIcon, FolderTreeIcon, HeartIcon, PencilIcon, PlusIcon, TerminalIcon, TrashIcon, VariableIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 🔄 Componente de ejemplo para la gestión de wildcards
 */
export default function WildcardsExample() {
	const [wildcards, setWildcards] = useState<WildcardComplete[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedWildcard, setSelectedWildcard] = useState<WildcardComplete | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<CreateWildcardData>({
		name: '',
		emoji: '🔄',
		color: '#8B5CF6',
		description: '',
		shortcut: '',
		category: 'general',
		children: '[]',
		isFavorite: false,
		parentId: null
	});

	// Store de wildcards
	const wildcardStore = useWildcardStore();

	// Cargar wildcards al iniciar
	useEffect(() => {
		loadWildcards();
	}, []);

	// Cargar wildcards desde la API
	const loadWildcards = async () => {
		try {
			setLoading(true);
			const fetchedWildcards = await getWildcards();
			setWildcards(fetchedWildcards);
			wildcardStore.setWildcards(fetchedWildcards);
			toast.success('Wildcards cargados correctamente');
		} catch (error) {
			console.error('Error al cargar wildcards:', error);
			toast.error('Error al cargar wildcards');
		} finally {
			setLoading(false);
		}
	};

	// Seleccionar un wildcard para editar
	const selectWildcard = async (id: string) => {
		try {
			setLoading(true);
			const wildcard = await getWildcard(id);
			if (wildcard) {
				setSelectedWildcard(wildcard);
				setFormData({
					name: wildcard.name,
					emoji: wildcard.emoji,
					color: wildcard.color,
					description: wildcard.description || '',
					shortcut: wildcard.shortcut || '',
					category: wildcard.category || 'general',
					children: typeof wildcard.children === 'string' ? wildcard.children : JSON.stringify(wildcard.children),
					isFavorite: wildcard.isFavorite,
					parentId: wildcard.parentId
				});
				setIsEditing(true);
			}
		} catch (error) {
			console.error('Error al cargar wildcard:', error);
			toast.error('Error al cargar wildcard');
		} finally {
			setLoading(false);
		}
	};

	// Enviar formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setLoading(true);

			if (isEditing && selectedWildcard) {
				// Actualizar wildcard existente
				const updatedWildcard = await updateWildcard(selectedWildcard.id, formData);
				setWildcards(prev => prev.map(w => w.id === updatedWildcard.id ? updatedWildcard : w));
				wildcardStore.updateWildcard(updatedWildcard.id, formData);
				toast.success(`Wildcard "${updatedWildcard.name}" actualizado`);
			} else {
				// Crear nuevo wildcard
				const newWildcard = await createWildcard(formData);
				setWildcards(prev => [...prev, newWildcard]);
				wildcardStore.addWildcard(newWildcard);
				toast.success(`Wildcard "${newWildcard.name}" creado`);
			}

			// Resetear formulario
			resetForm();
		} catch (error) {
			console.error('Error al guardar wildcard:', error);
			toast.error('Error al guardar wildcard');
		} finally {
			setLoading(false);
		}
	};

	// Eliminar wildcard
	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar este wildcard?')) return;

		try {
			setLoading(true);
			await deleteWildcard(id);

			// Actualizar lista y store
			setWildcards(prev => prev.filter(w => w.id !== id));
			wildcardStore.deleteWildcard(id);

			// Si estamos editando este wildcard, resetear
			if (selectedWildcard?.id === id) {
				resetForm();
			}

			toast.success('Wildcard eliminado');
		} catch (error) {
			console.error('Error al eliminar wildcard:', error);
			toast.error('Error al eliminar wildcard');
		} finally {
			setLoading(false);
		}
	};

	// Resetear formulario
	const resetForm = () => {
		setSelectedWildcard(null);
		setIsCreating(false);
		setIsEditing(false);
		setFormData({
			name: '',
			emoji: '🔄',
			color: '#8B5CF6',
			description: '',
			shortcut: '',
			category: 'general',
			children: '[]',
			isFavorite: false,
			parentId: null
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

	// Agregar un nuevo hijo al wildcard
	const addChild = () => {
		try {
			// Parsear los hijos actuales
			const currentChildren = formData.children ? JSON.parse(formData.children) : [];

			// Agregar un nuevo hijo
			const updatedChildren = [
				...currentChildren,
				{ value: 'Nuevo valor' }
			];

			// Actualizar el formulario
			setFormData(prev => ({
				...prev,
				children: JSON.stringify(updatedChildren, null, 2)
			}));
		} catch (error) {
			console.error('Error al agregar hijo:', error);
			toast.error('Error al procesar los hijos del wildcard');
		}
	};

	// Renderizar icono según categoría
	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'personajes':
				return <BracesIcon className="h-4 w-4" />;
			case 'lugares':
				return <FolderTreeIcon className="h-4 w-4" />;
			case 'sistema':
				return <TerminalIcon className="h-4 w-4" />;
			default:
				return <VariableIcon className="h-4 w-4" />;
		}
	};

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Gestión de Wildcards</h1>
				<div className="flex gap-2">
					<Button onClick={() => setIsCreating(true)} variant="default">
						<PlusIcon className="h-4 w-4 mr-2" />
						Nuevo Wildcard
					</Button>
					<Button onClick={loadWildcards} disabled={loading} variant="outline">
						{loading ? 'Cargando...' : 'Actualizar'}
					</Button>
				</div>
			</div>

			{/* Lista de wildcards */}
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
				{wildcards.length === 0 ? (
					<div className="col-span-full text-center py-8 bg-muted rounded-lg">
						<p className="text-muted-foreground">No hay wildcards disponibles</p>
						<Button onClick={() => setIsCreating(true)} variant="link" className="mt-2">
							Crear tu primer wildcard
						</Button>
					</div>
				) : (
					wildcards.map(wildcard => {
						const stats = transformWildcardToWithStats(wildcard);
						const children = (typeof wildcard.children === 'string' ?
							JSON.parse(wildcard.children) :
							wildcard.children) as any[];

						return (
							<Card key={wildcard.id} className="overflow-hidden">
								<div
									className="h-2"
									style={{ backgroundColor: wildcard.color || '#8B5CF6' }}
								/>
								<CardHeader className="pb-2">
									<div className="flex justify-between items-center">
										<CardTitle className="flex items-center gap-2">
											<span>{wildcard.emoji}</span>
											<span>{wildcard.name}</span>
										</CardTitle>
										{wildcard.isFavorite && (
											<HeartIcon className="h-4 w-4 text-red-500 fill-red-500" />
										)}
									</div>
									<CardDescription className="line-clamp-2">
										{wildcard.description || 'Sin descripción'}
									</CardDescription>
								</CardHeader>
								<CardContent className="pb-2">
									<div className="flex justify-between items-center mb-2">
										<div className="flex items-center gap-1">
											{getCategoryIcon(wildcard.category || 'general')}
											<span className="text-xs text-muted-foreground capitalize">
												{wildcard.category || 'General'}
											</span>
										</div>
										{wildcard.shortcut && (
											<span className="text-xs bg-muted px-2 py-1 rounded-full">
												[{wildcard.shortcut}]
											</span>
										)}
									</div>

									{children && children.length > 0 && (
										<div className="mt-2 mb-3">
											<Label className="text-xs text-muted-foreground">Valores ({children.length}):</Label>
											<ul className="mt-1 pl-5 list-disc text-sm">
												{children.slice(0, 3).map((child: any, index: number) => (
													<li key={`child-value-${index}-${child.value}`} className="text-muted-foreground">
														{child.value}
													</li>
												))}
												{children.length > 3 && (
													<li className="text-muted-foreground">
														+{children.length - 3} más...
													</li>
												)}
											</ul>
										</div>
									)}

									<div className="text-xs text-muted-foreground">
										{stats.stats && (
											<div className="flex justify-between text-xs">
												<span>
													Última act.: {new Date(wildcard.updatedAt).toLocaleDateString()}
												</span>
												<span className="flex items-center gap-1">
													<VariableIcon className="h-3 w-3" />
													{stats.stats.usageCount || 0} usos
												</span>
											</div>
										)}
									</div>
								</CardContent>
								<Separator />
								<CardFooter className="pt-2 flex justify-between">
									<Button
										size="sm"
										variant="destructive"
										onClick={() => handleDelete(wildcard.id)}
									>
										<TrashIcon className="h-4 w-4 mr-1" />
										Eliminar
									</Button>
									<Button
										size="sm"
										variant="default"
										onClick={() => selectWildcard(wildcard.id)}
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
						<DialogTitle>{isEditing ? 'Editar Wildcard' : 'Crear Nuevo Wildcard'}</DialogTitle>
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
									placeholder="Nombre del wildcard"
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
										placeholder="🔄"
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
										placeholder="#8B5CF6"
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
									placeholder="Descripción breve del wildcard"
									className="col-span-3"
									rows={2}
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="shortcut" className="text-right">
									Atajo
								</Label>
								<Input
									id="shortcut"
									name="shortcut"
									value={formData.shortcut || ''}
									onChange={handleChange}
									placeholder="Atajo para usar el wildcard"
									className="col-span-3"
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
										<SelectItem value="general">General</SelectItem>
										<SelectItem value="personajes">Personajes</SelectItem>
										<SelectItem value="lugares">Lugares</SelectItem>
										<SelectItem value="sistema">Sistema</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<div className="text-right flex flex-col">
									<Label htmlFor="children">Valores</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addChild}
										className="mt-2 text-xs px-2 py-1 h-auto"
									>
										Añadir valor
									</Button>
								</div>
								<Textarea
									id="children"
									name="children"
									value={formData.children}
									onChange={handleChange}
									placeholder='[{"value":"Valor 1"},{"value":"Valor 2"}]'
									className="col-span-3 font-mono text-sm"
									rows={8}
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

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="parentId" className="text-right">
									Padre
								</Label>
								<Select
									value={formData.parentId || ''}
									onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value || null }))}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Sin padre" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">Sin padre</SelectItem>
										{wildcards
											.filter(w => w.id !== selectedWildcard?.id)
											.map(w => (
												<SelectItem key={w.id} value={w.id}>
													{w.emoji} {w.name}
												</SelectItem>
											))
										}
									</SelectContent>
								</Select>
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
						<pre className="text-xs">{JSON.stringify(wildcardStore.getState(), null, 2)}</pre>
					</div>
				</details>
			</div>
		</div>
	);
}