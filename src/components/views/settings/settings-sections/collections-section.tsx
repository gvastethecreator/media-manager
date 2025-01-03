"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	KeyboardIcon,
	Trash2,
	Smile,
	PencilIcon,
	CheckIcon,
	XIcon,
} from "lucide-react";
import { useCollectionTagContext } from "@/context/settings-context";
import { GithubPicker } from "react-color";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CollectionsSection() {
	const { settings, updateCollection } = useCollectionTagContext();
	const { collections } = settings;
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<{
		name: string;
		emoji: string;
		description: string;
		color: string;
	} | null>(null);
	const [newCollection, setNewCollection] = React.useState({
		name: "",
		emoji: "🌟",
		description: "",
		color: "#3b82f6",
	});

	const handleStartEdit = (collection: (typeof collections)[0]) => {
		setEditingId(collection.id);
		setEditForm({
			name: collection.name,
			emoji: collection.emoji,
			description: collection.description || "",
			color: collection.color,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		try {
			await updateCollection(id, editForm);
			handleCancelEdit();
		} catch (error) {
			console.error("Error al actualizar la colección:", error);
		}
	};

	const handleEmojiSelect = (emoji: string) => {
		setNewCollection({ ...newCollection, emoji });
	};

	const handleColorChange = (color: { hex: string }) => {
		setNewCollection({ ...newCollection, color: color.hex });
	};

	const handleAddCollection = async () => {
		if (!newCollection.name) return;

		try {
			const newCollectionData = {
				...newCollection,
				sortBy: "name" as const,
				filters: [],
			};

			await updateCollection(null, newCollectionData);

			setNewCollection({
				name: "",
				emoji: "🌟",
				description: "",
				color: "#3b82f6",
			});
		} catch (error) {
			console.error("Error al crear la colección:", error);
		}
	};

	const handleRemoveCollection = async (id: string) => {
		await updateCollection(id, { id, count: 0, size: "0 B" });
	};

	const handleUpdateCollection = async (
		id: string,
		updates: Partial<(typeof collections)[0]>
	) => {
		await updateCollection(id, updates);
	};

	return (
		<div className="space-y-3">
			<Card className="border-none">
				<CardHeader className="px-4 py-2">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Smile className="h-5 w-5" /> Colecciones
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="space-y-3">
						<div className="flex gap-1.5 items-start">
							<div className="flex-shrink-0">
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" size="icon" className="h-7 w-7">
											{newCollection.emoji ? (
												<span className="text-base">{newCollection.emoji}</span>
											) : (
												<Smile className="h-3.5 w-3.5" />
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[320px] p-0" align="start">
										<EmojiPicker onEmojiSelect={handleEmojiSelect} />
									</PopoverContent>
								</Popover>
							</div>
							<div className="flex-1 min-w-0">
								<Input
									placeholder="Nueva colección..."
									value={newCollection.name}
									onChange={(e) =>
										setNewCollection({ ...newCollection, name: e.target.value })
									}
									className="h-7 text-xs"
								/>
								<Textarea
									placeholder="Descripción (opcional)"
									value={newCollection.description}
									onChange={(e) =>
										setNewCollection({
											...newCollection,
											description: e.target.value,
										})
									}
									className="mt-1.5 h-12 text-xs min-h-[48px] resize-none"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" size="icon" className="h-7 w-7">
											<div
												className="h-3.5 w-3.5 rounded-full"
												style={{ backgroundColor: newCollection.color }}
											/>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="end">
										<GithubPicker
											color={newCollection.color}
											onChange={handleColorChange}
										/>
									</PopoverContent>
								</Popover>
								<Button
									size="sm"
									className="h-7 text-xs px-2"
									onClick={handleAddCollection}
									disabled={!newCollection.name.trim()}
								>
									Crear
								</Button>
							</div>
						</div>

						<div className="space-y-1.5">
							{collections.map((collection) => (
								<Card
									key={collection.id}
									className={cn(
										"bg-muted/30 group",
										editingId === collection.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === collection.id ? (
											<div className="flex gap-1.5 items-start">
												<div className="flex-shrink-0">
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7"
															>
																{editForm?.emoji}
															</Button>
														</PopoverTrigger>
														<PopoverContent
															className="w-[320px] p-0"
															align="start"
														>
															<EmojiPicker
																onEmojiSelect={(emoji) =>
																	setEditForm((prev) =>
																		prev ? { ...prev, emoji } : null
																	)
																}
															/>
														</PopoverContent>
													</Popover>
												</div>
												<div className="flex-1 min-w-0 space-y-1.5">
													<Input
														value={editForm?.name}
														onChange={(e) =>
															setEditForm((prev) =>
																prev ? { ...prev, name: e.target.value } : null
															)
														}
														className="h-7 text-xs"
													/>
													<Textarea
														value={editForm?.description}
														onChange={(e) =>
															setEditForm((prev) =>
																prev
																	? { ...prev, description: e.target.value }
																	: null
															)
														}
														className="h-12 text-xs min-h-[48px] resize-none"
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
																	className="h-3.5 w-3.5 rounded-full"
																	style={{ backgroundColor: editForm?.color }}
																/>
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0" align="end">
															<GithubPicker
																color={editForm?.color}
																onChange={(color) =>
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
															onClick={() => handleSaveEdit(collection.id)}
														>
															<CheckIcon className="h-3.5 w-3.5" />
														</Button>
													</div>
												</div>
											</div>
										) : (
											<div className="flex items-center gap-2">
												<div className="flex items-center gap-2 flex-1 min-w-0">
													<span className="text-base">{collection.emoji}</span>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5">
															<span className="text-xs font-medium truncate">
																{collection.name}
															</span>
															{collection.shortcut && (
																<Badge
																	variant="outline"
																	className="text-[10px] h-4 px-1"
																>
																	{collection.shortcut}
																</Badge>
															)}
														</div>
														{collection.description && (
															<p className="text-[10px] text-muted-foreground truncate mt-0.5">
																{collection.description}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<Badge
														variant="secondary"
														className="text-[10px] h-4 px-1"
													>
														{collection.count} imágenes
													</Badge>
													<div
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: collection.color }}
													/>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6"
														onClick={() => handleStartEdit(collection)}
													>
														<PencilIcon className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 text-destructive hover:text-destructive/90"
														onClick={() =>
															handleRemoveCollection(collection.id)
														}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							))}

							{collections.length === 0 && (
								<div className="py-6 text-center">
									<Smile className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
									<p className="text-xs text-muted-foreground">
										No hay colecciones creadas
									</p>
									<p className="text-[10px] mt-1 text-muted-foreground/75">
										Crea una colección para organizar tus imágenes
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
