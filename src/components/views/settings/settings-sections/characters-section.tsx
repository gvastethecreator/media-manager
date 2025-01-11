"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Trash2,
	Smile,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
} from "lucide-react";
import { useCharactersStore } from "@/store/characters";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { cn } from "@/lib/utils";
import { CompactPicker } from "react-color";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import type {
	CharacterCreate,
	CharacterUpdate,
	CharacterWithStats,
} from "@/services/character.service";

const characterLogger = logger.withContext("CharactersSection");

export function CharactersSection() {
	const { toast } = useToast();
	const [isCreating, setIsCreating] = React.useState(false);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [emoji, setEmoji] = React.useState("👤");
	const [color, setColor] = React.useState("#3b82f6");
	const [shortcut, setShortcut] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	const {
		characters,
		loadCharacters,
		createCharacter,
		updateCharacter,
		deleteCharacter,
	} = useCharactersStore();

	React.useEffect(() => {
		loadCharacters();
	}, [loadCharacters]);

	const handleStartCreate = () => {
		setIsCreating(true);
		setName("");
		setDescription("");
		setEmoji("👤");
		setColor("#3b82f6");
		setShortcut("");
	};

	const handleCancelCreate = () => {
		setIsCreating(false);
		setName("");
		setDescription("");
		setEmoji("👤");
		setColor("#3b82f6");
		setShortcut("");
	};

	const handleCreate = async () => {
		if (!name) {
			toast({
				title: "Error",
				description: "El nombre es requerido",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsLoading(true);
			await createCharacter({
				name,
				description,
				emoji,
				color,
				shortcut,
			});
			setIsCreating(false);
			setName("");
			setDescription("");
			setEmoji("👤");
			setColor("#3b82f6");
			setShortcut("");
			toast({
				title: "Éxito",
				description: "Personaje creado correctamente",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "No se pudo crear el personaje",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleStartEdit = (character: CharacterWithStats) => {
		setEditingId(character.id);
		setName(character.name);
		setDescription(character.description || "");
		setEmoji(character.emoji || "👤");
		setColor(character.color || "#3b82f6");
		setShortcut(character.shortcut || "");
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setName("");
		setDescription("");
		setEmoji("👤");
		setColor("#3b82f6");
		setShortcut("");
	};

	const handleUpdate = async (id: string) => {
		if (!name) {
			toast({
				title: "Error",
				description: "El nombre es requerido",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsLoading(true);
			await updateCharacter(id, {
				id,
				name,
				description,
				emoji,
				color,
				shortcut,
			});
			setEditingId(null);
			setName("");
			setDescription("");
			setEmoji("👤");
			setColor("#3b82f6");
			setShortcut("");
			toast({
				title: "Éxito",
				description: "Personaje actualizado correctamente",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "No se pudo actualizar el personaje",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteCharacter = async (id: string) => {
		try {
			await deleteCharacter(id);
			toast({
				title: "Éxito",
				description: "Personaje eliminado correctamente",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "No se pudo eliminar el personaje",
				variant: "destructive",
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Personajes</span>
					<Button
						variant="outline"
						size="sm"
						onClick={handleStartCreate}
						disabled={isCreating}
					>
						Agregar personaje
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				{isCreating && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="grid gap-4"
					>
						<div className="flex items-center gap-2">
							<div className="flex items-center gap-2 flex-1 min-w-0">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											disabled={isLoading}
										>
											<span className="text-lg">{emoji}</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-full p-0" align="start">
										<EmojiPicker onSelect={setEmoji} />
									</PopoverContent>
								</Popover>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											style={{ backgroundColor: color }}
											disabled={isLoading}
										>
											<Smile className="h-4 w-4 text-white" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-full p-0" align="start">
										<CompactPicker
											color={color}
											onChange={(color) => setColor(color.hex)}
										/>
									</PopoverContent>
								</Popover>
								<div className="grid gap-1 flex-1 min-w-0">
									<Input
										placeholder="Nombre del personaje"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="h-8"
										disabled={isLoading}
									/>
									<Input
										placeholder="Descripción (opcional)"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										className="h-8"
										disabled={isLoading}
									/>
									<Input
										placeholder="Atajo de teclado (opcional)"
										value={shortcut}
										onChange={(e) => setShortcut(e.target.value)}
										className="h-8"
										disabled={isLoading}
									/>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={handleCreate}
									disabled={isLoading}
									className="h-8 w-8"
								>
									{isLoading ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<CheckIcon className="h-4 w-4" />
									)}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={handleCancelCreate}
									disabled={isLoading}
									className="h-8 w-8"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<Separator />
					</motion.div>
				)}
				<div className="grid gap-4">
					{characters.map((character) => (
						<motion.div
							key={character.id}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className={cn("group relative", {
								"opacity-50": isLoading && editingId === character.id,
							})}
						>
							{editingId === character.id ? (
								<div className="flex items-center gap-2">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													size="icon"
													className="h-8 w-8"
													disabled={isLoading}
												>
													<span className="text-lg">{emoji}</span>
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-full p-0" align="start">
												<EmojiPicker onSelect={setEmoji} />
											</PopoverContent>
										</Popover>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													size="icon"
													className="h-8 w-8"
													style={{ backgroundColor: color }}
													disabled={isLoading}
												>
													<Smile className="h-4 w-4 text-white" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-full p-0" align="start">
												<CompactPicker
													color={color}
													onChange={(color) => setColor(color.hex)}
												/>
											</PopoverContent>
										</Popover>
										<div className="grid gap-1 flex-1 min-w-0">
											<Input
												placeholder="Nombre del personaje"
												value={name}
												onChange={(e) => setName(e.target.value)}
												className="h-8"
												disabled={isLoading}
											/>
											<Input
												placeholder="Descripción (opcional)"
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												className="h-8"
												disabled={isLoading}
											/>
											<Input
												placeholder="Atajo de teclado (opcional)"
												value={shortcut}
												onChange={(e) => setShortcut(e.target.value)}
												className="h-8"
												disabled={isLoading}
											/>
										</div>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleUpdate(character.id)}
											disabled={isLoading}
											className="h-8 w-8"
										>
											{isLoading ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<CheckIcon className="h-4 w-4" />
											)}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={handleCancelEdit}
											disabled={isLoading}
											className="h-8 w-8"
										>
											<XIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>
							) : (
								<div className="flex items-center gap-2 relative">
									<div className="flex items-center gap-2 min-w-0">
										<div
											className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
											style={{ backgroundColor: character.color }}
										>
											<span className="text-lg">{character.emoji}</span>
										</div>
										<div className="flex-1 min-w-0">
											<span className="text-xs font-semibold truncate pl-1">
												{character.name}
											</span>
											{character.description && (
												<p className="text-[10px] text-muted-foreground truncate pl-1">
													{character.description}
												</p>
											)}
											{character.count > 0 && (
												<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
													{character.count}{" "}
													{character.count === 1 ? "imagen" : "imágenes"} •{" "}
													{character.size}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg rounded-l-sm px-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleStartEdit(character)}
											className="h-6 w-6"
										>
											<PencilIcon className="h-3 w-3" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDeleteCharacter(character.id)}
											className="h-6 w-6 text-red-500 hover:text-red-500/90"
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</div>
							)}
						</motion.div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
