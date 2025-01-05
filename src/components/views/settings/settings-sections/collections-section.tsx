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
import { CompactPicker } from "react-color";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Check, UserX } from "lucide-react";

const MotionCard = motion(Card);

export function CollectionsSection() {
	const { settings, updateCollection, deleteCollection } = useCollectionTagContext();
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

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Smile className="h-5 w-5" /> Colecciones
					</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: newCollection.color }}>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
										<span className="text-lg">{newCollection.emoji}</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[320px] p-0" align="start">
									<EmojiPicker onEmojiSelect={handleEmojiSelect} />
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex-1 min-w-0">
							<Input
								value={newCollection.name}
								onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
								className="h-8 text-base border-none p-3"
								placeholder="Nombre de la colección"
							/>
						</div>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
									<div
										className="h-4 w-4 rounded-full"
										style={{ backgroundColor: newCollection.color }}
									/>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0 bg-transparent border-none" align="end">
								<CompactPicker
									color={newCollection.color}
									className="bg-black/90 text-white overflow-hidden"
									onChange={(color) => handleColorChange(color)}
								/>
							</PopoverContent>
						</Popover>
						<Button
							size="sm"
							className="h-8 text-xs px-3"
							onClick={handleAddCollection}
							disabled={!newCollection.name.trim()}
						>
							Crear
						</Button>
					</div>

					<Separator className="my-0" />

					<div className="grid grid-cols-2 gap-2">
						<AnimatePresence>
							{collections.map((collection) => (
								<MotionCard
									key={collection.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									className={cn(
										"bg-muted/30 group rounded-sm",
										editingId === collection.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === collection.id ? (
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<div className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: editForm?.color }}>
														<Popover>
															<PopoverTrigger asChild>
																<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
																	<span className="text-lg">{editForm?.emoji}</span>
																</Button>
															</PopoverTrigger>
															<PopoverContent className="w-[320px] p-0" align="start">
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
													<div className="flex-1 min-w-0">
														<Input
															value={editForm?.name}
															onChange={(e) =>
																setEditForm((prev) =>
																	prev ? { ...prev, name: e.target.value } : null
																)
															}
															className="h-8 text-base border-none p-3"
															placeholder="Nombre de la colección"
														/>
													</div>
													<Popover>
														<PopoverTrigger asChild>
															<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
																<div
																	className="h-4 w-4 rounded-full"
																	style={{ backgroundColor: editForm?.color }}
																/>
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0 bg-transparent border-none" align="end">
															<CompactPicker
																color={editForm?.color}
																className="bg-black/90 text-white overflow-hidden"
																onChange={(color) =>
																	setEditForm((prev) =>
																		prev ? { ...prev, color: color.hex } : null
																	)
																}
															/>
														</PopoverContent>
													</Popover>
												</div>
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={handleCancelEdit}
														className="h-7 text-xs text-destructive hover:text-destructive/90"
													>
														<XIcon className="h-3.5 w-3.5 mr-1" />
														Cancelar
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleSaveEdit(collection.id)}
														className="h-7 text-xs text-green-500 hover:text-green-600"
													>
														<CheckIcon className="h-3.5 w-3.5 mr-1" />
														Guardar
													</Button>
												</div>
											</div>
										) : (
											<div className="flex items-center gap-2 relative">
												<div className="flex items-center gap-2 min-w-0">
													<div
														className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
														style={{ backgroundColor: collection.color }}
													>
														<span className="text-lg">{collection.emoji}</span>
													</div>
													<div className="flex-1 min-w-0">
														<span className="text-xs font-semibold truncate pl-1">
															{collection.name}
														</span>
														{collection.description && (
															<p className="text-[10px] text-muted-foreground truncate pl-1">
																{collection.description}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-8 shadow-lg">
													<Button
														variant="outline"
														onClick={() => handleStartEdit(collection)}
														className="h-4 text-xs gap-1 text-[9px] rounded-sm p-2"
													>
														<PencilIcon className="h-3 w-3" />
														Editar
													</Button>
													<Button
														variant="ghost"
														onClick={() => deleteCollection(collection.id)}
														className="h-4 text-red-500 hover:text-red-500/90 text-[9px] rounded-sm p-1 py-2"
													>
														<Trash2 className="h-2 w-2" />
													</Button>
												</div>
											</div>
										)}
									</CardContent>
								</MotionCard>
							))}
						</AnimatePresence>

						{collections.length === 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								className="py-4 text-center col-span-2"
							>
								<Smile className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									No hay colecciones creadas
								</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Crea una colección para organizar tus imágenes
								</p>
							</motion.div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
