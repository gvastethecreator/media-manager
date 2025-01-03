"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { KeyboardIcon, Trash2, Smile } from "lucide-react";
import { useCollectionTagContext } from "@/context/settings-context";
import { GithubPicker } from "react-color";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";

export function CollectionsSection() {
	const { settings, updateCollection } = useCollectionTagContext();
	const { collections } = settings;
	const [newCollection, setNewCollection] = React.useState({
		name: "",
		emoji: "🌟",
		description: "",
		color: "#3b82f6",
	});

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
		<div className="space-y-6">
			<Card className="p-4">
				<div className="space-y-4">
					<h4 className="text-sm font-medium">Nueva Colección</h4>

					<div className="flex gap-2">
						<div className="flex-shrink-0">
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" size="icon" className="h-9 w-9">
										{newCollection.emoji ? (
											<span className="text-lg">{newCollection.emoji}</span>
										) : (
											<Smile className="h-4 w-4" />
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[320px] p-0" align="start">
									<EmojiPicker onEmojiSelect={handleEmojiSelect} />
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex-1">
							<Input
								placeholder="Título de la colección"
								value={newCollection.name}
								onChange={(e) =>
									setNewCollection({ ...newCollection, name: e.target.value })
								}
							/>
						</div>
						<div className="flex-shrink-0">
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" size="icon" className="h-9 w-9">
										<div
											className="h-4 w-4 rounded-full"
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
						</div>
					</div>

					<Textarea
						placeholder="Descripción de la colección..."
						className="h-20"
						value={newCollection.description}
						onChange={(e) =>
							setNewCollection({
								...newCollection,
								description: e.target.value,
							})
						}
					/>

					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" className="flex gap-2">
							<KeyboardIcon className="h-4 w-4" />
							<span>Ctrl + Shift + S</span>
						</Button>
						<Button className="ml-auto" onClick={handleAddCollection}>
							Crear Colección
						</Button>
					</div>
				</div>
			</Card>

			<div className="space-y-4">
				<h4 className="text-sm font-medium">Colecciones Existentes</h4>

				<div className="grid gap-4">
					{collections.map((collection) => (
						<Card key={collection.id} className="p-4">
							<div className="space-y-4">
								<div className="flex items-start gap-3">
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 shrink-0"
											>
												{collection.emoji}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-[320px] p-0" align="start">
											<EmojiPicker
												onEmojiSelect={(emoji) =>
													handleUpdateCollection(collection.id, { emoji })
												}
											/>
										</PopoverContent>
									</Popover>
									<div className="flex-1 space-y-1">
										<Input
											value={collection.name}
											className="h-8 font-medium"
											onChange={(e) =>
												handleUpdateCollection(collection.id, {
													name: e.target.value,
												})
											}
										/>
										<Textarea
											value={collection.description}
											className="h-16 text-sm"
											onChange={(e) =>
												handleUpdateCollection(collection.id, {
													description: e.target.value,
												})
											}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<div
														className="h-4 w-4 rounded-full"
														style={{ backgroundColor: collection.color }}
													/>
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="end">
												<GithubPicker
													color={collection.color}
													onChange={(color) =>
														handleUpdateCollection(collection.id, {
															color: color.hex,
														})
													}
												/>
											</PopoverContent>
										</Popover>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive"
											onClick={() => handleRemoveCollection(collection.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="text-xs">
										{collection.shortcut || "Sin atajo"}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{collection.count} imágenes · {collection.size}
									</span>
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
