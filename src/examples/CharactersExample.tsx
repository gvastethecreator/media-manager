'use client';

import { createCharacter, deleteCharacter, getCharacters, updateCharacter } from '@/app/actions/characters/character.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCharacterStore } from '@/store/entities/character';
import { transformCharacterToWithStats } from '@/transformers/character';
import type { Character } from '@/types/entities/character/types';
import { BookOpenText, HeartIcon, ImageIcon, PencilIcon, PlusIcon, SwordIcon, TagIcon, TrashIcon, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 👤 Componente de ejemplo para personajes
 * Demuestra la creación, edición, eliminación y visualización de personajes
 */
export default function CharactersExample() {
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		emoji: '👤',
		color: '#3B82F6',
		level: 1,
		class: 'Warrior',
		race: 'Human',
		alignment: 'Neutral',
		type: '',
		backstory: '',
		isFavorite: false
	});

	// Obtener personajes del store
	const characters = useCharacterStore(state => state.getCharacters());
	const addCharacters = useCharacterStore(state => state.addCharacters);
	const setLoading_store = useCharacterStore(state => state.setLoading);
	const updateCharacter_store = useCharacterStore(state => state.updateCharacter);
	const deleteCharacter_store = useCharacterStore(state => state.deleteCharacter);

	// Cargar personajes al montar el componente
	useEffect(() => {
		async function loadCharacters() {
			setLoading_store(true);
			try {
				const result = await getCharacters();
				if (result && result.length > 0) {
					addCharacters(result);
				} else {
					toast.error('Error al cargar personajes');
				}
			} catch (error) {
				console.error('Error cargando personajes:', error);
				toast.error('Error al cargar personajes');
			} finally {
				setLoading_store(false);
			}
		}

		loadCharacters();
	}, [addCharacters, setLoading_store]);

	// Manejar cambios en el formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const numValue = Number.parseInt(value);
		if (!isNaN(numValue)) {
			setFormData(prev => ({ ...prev, [name]: numValue }));
		}
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleCheckboxChange = (name: string) => {
		setFormData(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
	};

	// Resetear formulario
	const resetForm = () => {
		setFormData({
			name: '',
			description: '',
			emoji: '👤',
			color: '#3B82F6',
			level: 1,
			class: 'Warrior',
			race: 'Human',
			alignment: 'Neutral',
			type: '',
			backstory: '',
			isFavorite: false
		});
	};

	// Crear nuevo personaje
	const handleCreate = async () => {
		if (!formData.name.trim()) {
			toast.error('El nombre es obligatorio');
			return;
		}

		setLoading(true);
		try {
			const result = await createCharacter({
				name: formData.name,
				description: formData.description,
				emoji: formData.emoji,
				color: formData.color,
				level: formData.level,
				class: formData.class,
				race: formData.race,
				alignment: formData.alignment,
				type: formData.type,
				backstory: formData.backstory,
				isFavorite: formData.isFavorite
			});

			if (result) {
				toast.success('Personaje creado con éxito');
				addCharacters([result]);
				setIsCreating(false);
				resetForm();
			} else {
				toast.error('Error al crear el personaje');
			}
		} catch (error) {
			console.error('Error creando personaje:', error);
			toast.error('Error al crear el personaje');
		} finally {
			setLoading(false);
		}
	};

	// Actualizar personaje existente
	const handleUpdate = async () => {
		if (!selectedCharacter || !formData.name.trim()) {
			toast.error('El nombre es obligatorio');
			return;
		}

		setLoading(true);
		try {
			const result = await updateCharacter(selectedCharacter.id, {
				name: formData.name,
				description: formData.description,
				emoji: formData.emoji,
				color: formData.color,
				level: formData.level,
				class: formData.class,
				race: formData.race,
				alignment: formData.alignment,
				type: formData.type,
				backstory: formData.backstory,
				isFavorite: formData.isFavorite
			});

			if (result) {
				toast.success('Personaje actualizado con éxito');
				updateCharacter_store(selectedCharacter.id, result);
				setIsEditing(false);
				setSelectedCharacter(null);
				resetForm();
			} else {
				toast.error('Error al actualizar el personaje');
			}
		} catch (error) {
			console.error('Error actualizando personaje:', error);
			toast.error('Error al actualizar el personaje');
		} finally {
			setLoading(false);
		}
	};

	// Eliminar personaje
	const handleDelete = async (character: Character) => {
		if (confirm(`¿Estás seguro de eliminar al personaje "${character.name}"?`)) {
			try {
				await deleteCharacter(character.id);
				toast.success('Personaje eliminado con éxito');
				deleteCharacter_store(character.id);
			} catch (error) {
				console.error('Error eliminando personaje:', error);
				toast.error('Error al eliminar el personaje');
			}
		}
	};

	// Preparar edición de personaje
	const handleEdit = (character: Character) => {
		setSelectedCharacter(character);
		setFormData({
			name: character.name,
			description: character.description || '',
			emoji: character.emoji || '👤',
			color: character.color || '#3B82F6',
			level: character.level || 1,
			class: character.class || 'Warrior',
			race: character.race || 'Human',
			alignment: character.alignment || 'Neutral',
			type: character.type || '',
			backstory: character.backstory || '',
			isFavorite: character.isFavorite || false
		});
		setIsEditing(true);
	};

	// Manejar favorito
	const handleToggleFavorite = async (character: Character) => {
		try {
			const result = await updateCharacter(character.id, {
				isFavorite: !character.isFavorite
			});

			if (result) {
				updateCharacter_store(character.id, result);
				toast.success(`Personaje ${character.isFavorite ? 'eliminado de' : 'añadido a'} favoritos`);
			}
		} catch (error) {
			console.error('Error al actualizar favorito:', error);
			toast.error('Error al actualizar favorito');
		}
	};

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Ejemplo de Personajes</h1>
				<Dialog open={isCreating} onOpenChange={setIsCreating}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="h-4 w-4 mr-2" />
							Nuevo Personaje
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Crear Nuevo Personaje</DialogTitle>
							<DialogDescription>
								Introduce la información para el nuevo personaje.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="emoji" className="text-right">
									Emoji
								</Label>
								<Input
									id="emoji"
									name="emoji"
									value={formData.emoji}
									onChange={handleInputChange}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Nombre
								</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="description" className="text-right">
									Descripción
								</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="color" className="text-right">
									Color
								</Label>
								<div className="flex gap-2 col-span-3">
									<Input
										type="color"
										id="color"
										name="color"
										value={formData.color}
										onChange={handleInputChange}
										className="w-12 h-9 p-1"
									/>
									<Input
										type="text"
										value={formData.color}
										onChange={handleInputChange}
										name="color"
										className="flex-1"
									/>
								</div>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="level" className="text-right">
									Nivel
								</Label>
								<Input
									type="number"
									id="level"
									name="level"
									value={formData.level}
									onChange={handleNumberChange}
									min={1}
									max={100}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="class" className="text-right">
									Clase
								</Label>
								<Select
									value={formData.class}
									onValueChange={(value) => handleSelectChange('class', value)}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecciona una clase" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Warrior">Guerrero</SelectItem>
										<SelectItem value="Mage">Mago</SelectItem>
										<SelectItem value="Rogue">Pícaro</SelectItem>
										<SelectItem value="Cleric">Clérigo</SelectItem>
										<SelectItem value="Ranger">Explorador</SelectItem>
										<SelectItem value="Paladin">Paladín</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="race" className="text-right">
									Raza
								</Label>
								<Select
									value={formData.race}
									onValueChange={(value) => handleSelectChange('race', value)}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecciona una raza" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Human">Humano</SelectItem>
										<SelectItem value="Elf">Elfo</SelectItem>
										<SelectItem value="Dwarf">Enano</SelectItem>
										<SelectItem value="Halfling">Mediano</SelectItem>
										<SelectItem value="Orc">Orco</SelectItem>
										<SelectItem value="Undead">No-muerto</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="alignment" className="text-right">
									Alineamiento
								</Label>
								<Select
									value={formData.alignment}
									onValueChange={(value) => handleSelectChange('alignment', value)}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecciona alineamiento" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Lawful Good">Legal Bueno</SelectItem>
										<SelectItem value="Neutral Good">Neutral Bueno</SelectItem>
										<SelectItem value="Chaotic Good">Caótico Bueno</SelectItem>
										<SelectItem value="Lawful Neutral">Legal Neutral</SelectItem>
										<SelectItem value="True Neutral">Neutral Puro</SelectItem>
										<SelectItem value="Chaotic Neutral">Caótico Neutral</SelectItem>
										<SelectItem value="Lawful Evil">Legal Maligno</SelectItem>
										<SelectItem value="Neutral Evil">Neutral Maligno</SelectItem>
										<SelectItem value="Chaotic Evil">Caótico Maligno</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="type" className="text-right">
									Tipo
								</Label>
								<Input
									id="type"
									name="type"
									value={formData.type}
									onChange={handleInputChange}
									className="col-span-3"
									placeholder="NPC, Protagonista, Villano..."
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="backstory" className="text-right">
									Historia
								</Label>
								<Textarea
									id="backstory"
									name="backstory"
									value={formData.backstory}
									onChange={handleInputChange}
									className="col-span-3"
									placeholder="Cuenta la historia del personaje..."
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Opciones</Label>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="isFavorite"
										checked={formData.isFavorite}
										onChange={() => handleCheckboxChange('isFavorite')}
										className="h-4 w-4"
									/>
									<Label htmlFor="isFavorite">Favorito</Label>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreating(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreate} disabled={loading}>
								{loading ? 'Creando...' : 'Crear Personaje'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Dialog open={isEditing} onOpenChange={setIsEditing}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Editar Personaje</DialogTitle>
						<DialogDescription>
							Actualiza la información del personaje.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-emoji" className="text-right">
								Emoji
							</Label>
							<Input
								id="edit-emoji"
								name="emoji"
								value={formData.emoji}
								onChange={handleInputChange}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-name" className="text-right">
								Nombre
							</Label>
							<Input
								id="edit-name"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-description" className="text-right">
								Descripción
							</Label>
							<Textarea
								id="edit-description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-color" className="text-right">
								Color
							</Label>
							<div className="flex gap-2 col-span-3">
								<Input
									type="color"
									id="edit-color"
									name="color"
									value={formData.color}
									onChange={handleInputChange}
									className="w-12 h-9 p-1"
								/>
								<Input
									type="text"
									value={formData.color}
									onChange={handleInputChange}
									name="color"
									className="flex-1"
								/>
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-level" className="text-right">
								Nivel
							</Label>
							<Input
								type="number"
								id="edit-level"
								name="level"
								value={formData.level}
								onChange={handleNumberChange}
								min={1}
								max={100}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-class" className="text-right">
								Clase
							</Label>
							<Select
								value={formData.class}
								onValueChange={(value) => handleSelectChange('class', value)}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Selecciona una clase" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Warrior">Guerrero</SelectItem>
									<SelectItem value="Mage">Mago</SelectItem>
									<SelectItem value="Rogue">Pícaro</SelectItem>
									<SelectItem value="Cleric">Clérigo</SelectItem>
									<SelectItem value="Ranger">Explorador</SelectItem>
									<SelectItem value="Paladin">Paladín</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-race" className="text-right">
								Raza
							</Label>
							<Select
								value={formData.race}
								onValueChange={(value) => handleSelectChange('race', value)}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Selecciona una raza" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Human">Humano</SelectItem>
									<SelectItem value="Elf">Elfo</SelectItem>
									<SelectItem value="Dwarf">Enano</SelectItem>
									<SelectItem value="Halfling">Mediano</SelectItem>
									<SelectItem value="Orc">Orco</SelectItem>
									<SelectItem value="Undead">No-muerto</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-alignment" className="text-right">
								Alineamiento
							</Label>
							<Select
								value={formData.alignment}
								onValueChange={(value) => handleSelectChange('alignment', value)}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Selecciona alineamiento" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Lawful Good">Legal Bueno</SelectItem>
									<SelectItem value="Neutral Good">Neutral Bueno</SelectItem>
									<SelectItem value="Chaotic Good">Caótico Bueno</SelectItem>
									<SelectItem value="Lawful Neutral">Legal Neutral</SelectItem>
									<SelectItem value="True Neutral">Neutral Puro</SelectItem>
									<SelectItem value="Chaotic Neutral">Caótico Neutral</SelectItem>
									<SelectItem value="Lawful Evil">Legal Maligno</SelectItem>
									<SelectItem value="Neutral Evil">Neutral Maligno</SelectItem>
									<SelectItem value="Chaotic Evil">Caótico Maligno</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-type" className="text-right">
								Tipo
							</Label>
							<Input
								id="edit-type"
								name="type"
								value={formData.type}
								onChange={handleInputChange}
								className="col-span-3"
								placeholder="NPC, Protagonista, Villano..."
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-backstory" className="text-right">
								Historia
							</Label>
							<Textarea
								id="edit-backstory"
								name="backstory"
								value={formData.backstory}
								onChange={handleInputChange}
								className="col-span-3"
								placeholder="Cuenta la historia del personaje..."
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right">Opciones</Label>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="edit-isFavorite"
									checked={formData.isFavorite}
									onChange={() => handleCheckboxChange('isFavorite')}
									className="h-4 w-4"
								/>
								<Label htmlFor="edit-isFavorite">Favorito</Label>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => {
							setIsEditing(false);
							setSelectedCharacter(null);
							resetForm();
						}}>
							Cancelar
						</Button>
						<Button onClick={handleUpdate} disabled={loading}>
							{loading ? 'Actualizando...' : 'Actualizar Personaje'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{characters.map((character) => {
					const stats = transformCharacterToWithStats(character);
					return (
						<Card key={character.id} className="overflow-hidden">
							<CardHeader style={{ backgroundColor: character.color || '#3B82F6', color: 'white' }}>
								<div className="flex justify-between items-center">
									<CardTitle className="flex items-center gap-2">
										<span>{character.emoji || '👤'}</span>
										<span>{character.name}</span>
									</CardTitle>
									<Badge variant={character.class === 'Warrior' ? 'default' :
										character.class === 'Mage' ? 'secondary' :
											character.class === 'Rogue' ? 'destructive' :
												'outline'}>
										{character.class || 'Desconocido'}
									</Badge>
								</div>
								<CardDescription className="text-white opacity-90">
									{character.description || 'Sin descripción'}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-6">
								<div className="flex flex-col gap-2">
									<div className="flex justify-between">
										<div className="flex items-center gap-2">
											<SwordIcon className="h-4 w-4" />
											<span>Nivel {character.level || 1}</span>
										</div>
										<div className="flex items-center gap-2">
											<User className="h-4 w-4" />
											<span>{character.race || 'Humano'}</span>
										</div>
									</div>
									<div className="mt-2">
										<div className="flex items-center gap-2">
											<ImageIcon className="h-4 w-4" />
											<span>{stats.imageCount} imágenes</span>
										</div>
										<div className="flex items-center gap-2">
											<TagIcon className="h-4 w-4" />
											<span>{stats.tagCount} etiquetas</span>
										</div>
										<div className="flex items-center gap-2">
											<BookOpenText className="h-4 w-4" />
											<span>Poder: {stats.powerLevel}</span>
										</div>
									</div>
									{character.backstory && (
										<div className="mt-3">
											<Label className="text-xs text-gray-500">Historia:</Label>
											<p className="text-sm line-clamp-2 mt-1">{character.backstory}</p>
										</div>
									)}
								</div>
							</CardContent>
							<Separator />
							<CardFooter className="flex justify-between p-4">
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="icon"
										onClick={() => handleEdit(character)}
									>
										<PencilIcon className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										onClick={() => handleDelete(character)}
									>
										<TrashIcon className="h-4 w-4" />
									</Button>
								</div>
								<Button
									variant={character.isFavorite ? "default" : "outline"}
									size="icon"
									onClick={() => handleToggleFavorite(character)}
								>
									<HeartIcon
										className={`h-4 w-4 ${character.isFavorite ? 'fill-current' : ''}`}
									/>
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			{characters.length === 0 && (
				<div className="text-center py-10">
					<p className="text-muted-foreground">No hay personajes disponibles</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => setIsCreating(true)}
					>
						Crear tu primer personaje
					</Button>
				</div>
			)}
		</div>
	);
}