"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Palette, PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { useCollectionTagContext } from "@/context/settings-context";
import { GithubPicker } from "react-color";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function TagsSection() {
	const { settings, updateTag, deleteTag } = useCollectionTagContext();
	const { tags } = settings;
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<{
		name: string;
		color: string;
		description: string;
		shortcut: string;
	} | null>(null);
	const [newTag, setNewTag] = React.useState({
		name: "",
		color: "#3b82f6",
		description: "",
		shortcut: "",
	});

	const handleStartEdit = (tag: (typeof tags)[0]) => {
		setEditingId(tag.id);
		setEditForm({
			name: tag.name,
			color: tag.color,
			description: tag.description || "",
			shortcut: tag.shortcut || "",
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		try {
			const { name, color, description, shortcut } = editForm;
			await updateTag(id, {
				name,
				color,
				description,
				shortcut,
			});
			handleCancelEdit();
		} catch (error) {
			console.error("Error al actualizar la etiqueta:", error);
		}
	};

	const handleColorChange = (color: { hex: string }) => {
		setNewTag({ ...newTag, color: color.hex });
	};

	const handleAddTag = async () => {
		if (!newTag.name) return;
		try {
			await updateTag(null, newTag);
			setNewTag({
				name: "",
				color: "#3b82f6",
				description: "",
				shortcut: "",
			});
		} catch (error) {
			console.error("Error al crear el tag:", error);
		}
	};

	const handleRemoveTag = async (id: string) => {
		try {
			await deleteTag(id);
		} catch (error) {
			console.error("Error al eliminar el tag:", error);
		}
	};

	return (
		<div className="space-y-3">
			<Card className="border-none">
				<CardHeader className="px-4 py-2">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Palette className="h-5 w-5" /> Etiquetas
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="space-y-3">
						<div className="flex gap-1.5">
							<div className="flex-1 min-w-0">
								<Input
									placeholder="Nueva etiqueta..."
									value={newTag.name}
									onChange={(e) =>
										setNewTag({ ...newTag, name: e.target.value })
									}
									className="h-7 text-xs"
								/>
							</div>
							<div className="flex gap-1.5">
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" className="h-7 px-2 text-xs">
											<div className="flex items-center gap-1.5">
												<div
													className="w-3.5 h-3.5 rounded"
													style={{ backgroundColor: newTag.color }}
												/>
												<Palette className="h-3.5 w-3.5" />
											</div>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<GithubPicker
											color={newTag.color}
											onChangeComplete={handleColorChange}
										/>
									</PopoverContent>
								</Popover>
								<Button
									size="sm"
									className="h-7 text-xs px-2"
									onClick={handleAddTag}
									disabled={!newTag.name.trim()}
								>
									Crear
								</Button>
							</div>
						</div>

						<div className="space-y-1.5">
							{tags.map((tag) => (
								<Card
									key={tag.id}
									className={cn(
										"bg-muted/30 group",
										editingId === tag.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === tag.id ? (
											<div className="flex gap-2">
												<div className="flex-1 min-w-0 space-y-1.5">
													<div className="flex gap-1.5">
														<Input
															value={editForm?.name}
															onChange={(e) =>
																setEditForm((prev) =>
																	prev
																		? { ...prev, name: e.target.value }
																		: null
																)
															}
															className="h-7 text-xs"
															placeholder="Nombre de la etiqueta"
														/>
														<Input
															value={editForm?.shortcut}
															onChange={(e) =>
																setEditForm((prev) =>
																	prev
																		? { ...prev, shortcut: e.target.value }
																		: null
																)
															}
															className="h-7 text-xs w-24"
															placeholder="Atajo"
														/>
													</div>
													<Input
														value={editForm?.description}
														onChange={(e) =>
															setEditForm((prev) =>
																prev
																	? { ...prev, description: e.target.value }
																	: null
															)
														}
														className="h-7 text-xs"
														placeholder="Descripción (opcional)"
													/>
												</div>
												<div className="flex flex-col gap-1.5">
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7"
															>
																<div
																	className="h-3.5 w-3.5 rounded"
																	style={{ backgroundColor: editForm?.color }}
																/>
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0" align="end">
															<GithubPicker
																color={editForm?.color}
																onChange={(color: { hex: string }) =>
																	setEditForm((prev) =>
																		prev ? { ...prev, color: color.hex } : null
																	)
																}
															/>
														</PopoverContent>
													</Popover>
													<div className="flex gap-1">
														<Button
															size="icon"
															variant="ghost"
															className="h-7 w-7 text-destructive hover:text-destructive/90"
															onClick={handleCancelEdit}
														>
															<XIcon className="h-3.5 w-3.5" />
														</Button>
														<Button
															size="icon"
															variant="ghost"
															className="h-7 w-7 text-green-500 hover:text-green-600"
															onClick={() => handleSaveEdit(tag.id)}
														>
															<CheckIcon className="h-3.5 w-3.5" />
														</Button>
													</div>
												</div>
											</div>
										) : (
											<div className="flex items-center gap-2">
												<div className="flex items-center gap-2 flex-1 min-w-0">
													<div
														className="w-3.5 h-3.5 rounded"
														style={{ backgroundColor: tag.color }}
													/>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5">
															<span className="text-xs font-medium truncate">
																{tag.name}
															</span>
															{tag.shortcut && (
																<Badge
																	variant="outline"
																	className="text-[10px] h-4 px-1"
																>
																	{tag.shortcut}
																</Badge>
															)}
														</div>
														{tag.description && (
															<p className="text-[10px] text-muted-foreground truncate mt-0.5">
																{tag.description}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<Badge
														variant="secondary"
														className="text-[10px] h-4 px-1"
													>
														{tag.count} imágenes
													</Badge>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6"
														onClick={() => handleStartEdit(tag)}
													>
														<PencilIcon className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 text-destructive hover:text-destructive/90"
														onClick={() => handleRemoveTag(tag.id)}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							))}

							{tags.length === 0 && (
								<div className="py-6 text-center">
									<Palette className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
									<p className="text-xs text-muted-foreground">
										No hay etiquetas creadas
									</p>
									<p className="text-[10px] mt-1 text-muted-foreground/75">
										Crea una etiqueta para clasificar tus imágenes
									</p>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
