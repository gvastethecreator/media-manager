"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	Trash2,
	Smile,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
	Swords,
	Crown,
	Users,
	Heart,
	ScrollText,
	AlertCircle,
} from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { CompactPicker } from "react-color";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { getCharacters, createCharacter, updateCharacter, deleteCharacter, CharacterUpdate, CharacterCreate } from "@/app/actions/character.actions";
import type { Character } from "@prisma/client";

const characterLogger = logger.withContext("CharactersSection");

interface EditForm extends Partial<Character> {
	id: string;
}

export function CharactersSection() {
	const [characters, setCharacters] = React.useState<Character[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<EditForm | null>(null);
	const [newCharacter, setNewCharacter] = React.useState<Partial<Character>>({
		name: "",
		emoji: "👤",
		description: "",
		color: "#3b82f6",
		level: 1,
		class: "",
		race: "",
		alignment: "",
		backstory: "",
	});
	const { toast } = useToast();

	const loadCharacters = React.useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await getCharacters();
			setCharacters(data);
			setError(null);
		} catch (error) {
			setError(error as Error);
			toast({
				title: "Error al cargar personajes",
				description: "No se pudieron cargar los personajes.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	React.useEffect(() => {
		loadCharacters();
	}, [loadCharacters]);

	const handleStartEdit = (character: Character) => {
		setEditingId(character.id);
		setEditForm({
			id: character.id,
			name: character.name,
			emoji: character.emoji,
			description: character.description || "",
			color: character.color,
			level: character.level,
			class: character.class || "",
			race: character.race || "",
			alignment: character.alignment || "",
			backstory: character.backstory || "",
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		setIsLoading(true);
		try {
			characterLogger.info("💾 Guardando cambios en personaje:", {
				id,
				data: editForm,
			});
			const { id: _, ...data } = editForm;
			await updateCharacter(id, data as CharacterUpdate);
			await loadCharacters();
			handleCancelEdit();
			toast({
				title: "Éxito",
				description: "Personaje actualizado correctamente",
			});
		} catch (error) {
			characterLogger.error("❌ Error al actualizar personaje:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el personaje",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreate = async () => {
		if (!newCharacter.name?.trim()) {
			toast({
				title: "Error",
				description: "El nombre es requerido",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		try {
			characterLogger.info("✨ Creando nuevo personaje:", newCharacter);
			await createCharacter(newCharacter as CharacterCreate);
			await loadCharacters();
			setNewCharacter({
				name: "",
				emoji: "👤",
				description: "",
				color: "#3b82f6",
				level: 1,
				class: "",
				race: "",
				alignment: "",
				backstory: "",
			});
			toast({
				title: "Éxito",
				description: "Personaje creado correctamente",
			});
		} catch (error) {
			characterLogger.error("❌ Error al crear personaje:", error);
			toast({
				title: "Error",
				description: "No se pudo crear el personaje",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("¿Estás seguro de eliminar este personaje?")) return;
		setIsLoading(true);
		try {
			characterLogger.info("🗑️ Eliminando personaje:", { id });
			await deleteCharacter(id);
			await loadCharacters();
			toast({
				title: "Éxito",
				description: "Personaje eliminado correctamente",
			});
		} catch (error) {
			characterLogger.error("❌ Error al eliminar personaje:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el personaje",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// El resto del JSX se mantiene igual...
	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Swords className="h-5 w-5" />
							Crear nuevo personaje
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex gap-4">
								<Input
									placeholder="Nombre del personaje"
									value={newCharacter.name}
									onChange={(e) =>
										setNewCharacter({ ...newCharacter, name: e.target.value })
									}
								/>
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" className="w-[60px]">
											{newCharacter.emoji || <Smile className="h-4 w-4" />}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-full p-0" align="start">
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewCharacter({ ...newCharacter, emoji: emoji })
											}
										/>
									</PopoverContent>
								</Popover>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-[60px]"
											style={{
												backgroundColor: newCharacter.color,
											}}
										/>
									</PopoverTrigger>
									<PopoverContent className="w-full p-0" align="start">
										<CompactPicker
											color={newCharacter.color}
											onChange={(color) =>
												setNewCharacter({ ...newCharacter, color: color.hex })
											}
										/>
									</PopoverContent>
								</Popover>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center gap-2">
									<Crown className="h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Nivel"
										type="number"
										value={newCharacter.level}
										onChange={(e) =>
											setNewCharacter({
												...newCharacter,
												level: parseInt(e.target.value) || 1,
											})
										}
									/>
								</div>
								<div className="flex items-center gap-2">
									<Swords className="h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Clase"
										value={newCharacter.class}
										onChange={(e) =>
											setNewCharacter({
												...newCharacter,
												class: e.target.value,
											})
										}
									/>
								</div>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Raza"
										value={newCharacter.race}
										onChange={(e) =>
											setNewCharacter({ ...newCharacter, race: e.target.value })
										}
									/>
								</div>
								<div className="flex items-center gap-2">
									<Heart className="h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Alineamiento"
										value={newCharacter.alignment}
										onChange={(e) =>
											setNewCharacter({
												...newCharacter,
												alignment: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<ScrollText className="h-4 w-4 text-muted-foreground" />
								<Textarea
									placeholder="Descripción"
									value={newCharacter.description || ""}
									onChange={(e) =>
										setNewCharacter({
											...newCharacter,
											description: e.target.value,
										})
									}
								/>
							</div>
							<div className="flex items-center gap-2">
								<ScrollText className="h-4 w-4 text-muted-foreground" />
								<Textarea
									placeholder="Historia del personaje"
									value={newCharacter.backstory || ""}
									onChange={(e) =>
										setNewCharacter({
											...newCharacter,
											backstory: e.target.value,
										})
									}
								/>
							</div>
							<Button onClick={handleCreate} className="w-full">
								Crear personaje
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Personajes
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="h-6 w-6 animate-spin" />
							</div>
						) : error ? (
							<div className="flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
								<AlertCircle className="h-6 w-6" />
								<p>Error al cargar los personajes</p>
								<Button variant="outline" onClick={() => loadCharacters()}>
									Reintentar
								</Button>
							</div>
						) : characters.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
								<Users className="h-6 w-6" />
								<p>No hay personajes creados</p>
							</div>
						) : (
							<div className="space-y-4">
								{characters.map((character) => (
									<motion.div
										key={character.id}
										layout
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
									>
										{editingId === character.id ? (
											<Card>
												<CardContent className="pt-6">
													<div className="space-y-4">
														<div className="flex gap-4">
															<Input
																placeholder="Nombre del personaje"
																value={editForm?.name}
																onChange={(e) =>
																	setEditForm({
																		...editForm!,
																		name: e.target.value,
																	})
																}
															/>
															<Popover>
																<PopoverTrigger asChild>
																	<Button
																		variant="outline"
																		className="w-[60px]"
																	>
																		{editForm?.emoji || (
																			<Smile className="h-4 w-4" />
																		)}
																	</Button>
																</PopoverTrigger>
																<PopoverContent
																	className="w-full p-0"
																	align="start"
																>
																	<EmojiPicker
																		onEmojiSelect={(emoji: string) =>
																			setEditForm({
																				...editForm!,
																				emoji: emoji,
																			})
																		}
																	/>
																</PopoverContent>
															</Popover>
															<Popover>
																<PopoverTrigger asChild>
																	<Button
																		variant="outline"
																		className="w-[60px]"
																		style={{
																			backgroundColor: editForm?.color,
																		}}
																	/>
																</PopoverTrigger>
																<PopoverContent
																	className="w-full p-0"
																	align="start"
																>
																	<CompactPicker
																		color={editForm?.color}
																		onChange={(color) =>
																			setEditForm({
																				...editForm!,
																				color: color.hex,
																			})
																		}
																	/>
																</PopoverContent>
															</Popover>
														</div>
														<div className="grid grid-cols-2 gap-4">
															<div className="flex items-center gap-2">
																<Crown className="h-4 w-4 text-muted-foreground" />
																<Input
																	placeholder="Nivel"
																	type="number"
																	value={editForm?.level}
																	onChange={(e) =>
																		setEditForm({
																			...editForm!,
																			level: parseInt(e.target.value) || 1,
																		})
																	}
																/>
															</div>
															<div className="flex items-center gap-2">
																<Swords className="h-4 w-4 text-muted-foreground" />
																<Input
																	placeholder="Clase"
																	value={editForm?.class}
																	onChange={(e) =>
																		setEditForm({
																			...editForm!,
																			class: e.target.value,
																		})
																	}
																/>
															</div>
															<div className="flex items-center gap-2">
																<Users className="h-4 w-4 text-muted-foreground" />
																<Input
																	placeholder="Raza"
																	value={editForm?.race}
																	onChange={(e) =>
																		setEditForm({
																			...editForm!,
																			race: e.target.value,
																		})
																	}
																/>
															</div>
															<div className="flex items-center gap-2">
																<Heart className="h-4 w-4 text-muted-foreground" />
																<Input
																	placeholder="Alineamiento"
																	value={editForm?.alignment}
																	onChange={(e) =>
																		setEditForm({
																			...editForm!,
																			alignment: e.target.value,
																		})
																	}
																/>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<ScrollText className="h-4 w-4 text-muted-foreground" />
															<Textarea
																placeholder="Descripción"
																value={editForm?.description || ""}
																onChange={(e) =>
																	setEditForm({
																		...editForm!,
																		description: e.target.value,
																	})
																}
															/>
														</div>
														<div className="flex items-center gap-2">
															<ScrollText className="h-4 w-4 text-muted-foreground" />
															<Textarea
																placeholder="Historia del personaje"
																value={editForm?.backstory || ""}
																onChange={(e) =>
																	setEditForm({
																		...editForm!,
																		backstory: e.target.value,
																	})
																}
															/>
														</div>
														<div className="flex gap-2">
															<Button
																onClick={() => handleSaveEdit(character.id)}
																size="icon"
															>
																<CheckIcon className="h-4 w-4" />
															</Button>
															<Button
																onClick={handleCancelEdit}
																variant="outline"
																size="icon"
															>
																<XIcon className="h-4 w-4" />
															</Button>
														</div>
													</div>
												</CardContent>
											</Card>
										) : (
											<Card>
												<CardContent className="pt-6">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-4">
															<span
																className="flex h-8 w-8 items-center justify-center rounded"
																style={{ backgroundColor: character.color }}
															>
																{character.emoji}
															</span>
															<div>
																<h3 className="font-medium">
																	{character.name}
																</h3>
																<div className="flex items-center gap-2 text-sm text-muted-foreground">
																	<Users className="h-3 w-3" />
																	<span>{character.race}</span>
																	<Crown className="h-3 w-3 ml-2" />
																	<span>Nivel {character.level}</span>
																	<Swords className="h-3 w-3 ml-2" />
																	<span>{character.class}</span>
																	{character.alignment && (
																		<>
																			<Heart className="h-3 w-3 ml-2" />
																			<span>{character.alignment}</span>
																		</>
																	)}
																</div>
															</div>
														</div>
														<div className="flex gap-2">
															<Button
																onClick={() => handleStartEdit(character)}
																variant="ghost"
																size="icon"
															>
																<PencilIcon className="h-4 w-4" />
															</Button>
															<Button
																onClick={() => handleDelete(character.id)}
																variant="ghost"
																size="icon"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</div>
													{character.description && (
														<>
															<Separator className="my-4" />
															<p className="text-sm text-muted-foreground">
																{character.description}
															</p>
														</>
													)}
												</CardContent>
											</Card>
										)}
									</motion.div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
