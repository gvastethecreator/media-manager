"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Palette } from "lucide-react";
import { useCollectionTagContext } from "@/context/settings-context";
import { GithubPicker } from "react-color";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export function TagsSection() {
	const { settings, updateTag } = useCollectionTagContext();
	const { tags } = settings;
	const [newTag, setNewTag] = React.useState({
		name: "",
		color: "#3b82f6",
		description: "",
		shortcut: "",
	});

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
			await updateTag(id, { id, deleted: true });
		} catch (error) {
			console.error("Error al eliminar el tag:", error);
		}
	};

	return (
		<div className="space-y-4">
			<Card className="p-4">
				<div className="space-y-4">
					<div className="flex gap-4">
						<div className="flex-1">
							<Label>Nombre</Label>
							<Input
								placeholder="Nombre del tag"
								value={newTag.name}
								onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
							/>
						</div>
						<div>
							<Label>Color</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" className="w-[100px] px-3">
										<div className="flex items-center gap-2">
											<div
												className="w-4 h-4 rounded"
												style={{ backgroundColor: newTag.color }}
											/>
											<Palette className="h-4 w-4" />
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
						</div>
					</div>
					<div>
						<Label>Descripción</Label>
						<Input
							placeholder="Descripción del tag"
							value={newTag.description}
							onChange={(e) =>
								setNewTag({ ...newTag, description: e.target.value })
							}
						/>
					</div>
					<div>
						<Label>Atajo de teclado</Label>
						<Input
							placeholder="Atajo de teclado (opcional)"
							value={newTag.shortcut}
							onChange={(e) =>
								setNewTag({ ...newTag, shortcut: e.target.value })
							}
						/>
					</div>
					<Button onClick={handleAddTag} className="w-full">
						Agregar Tag
					</Button>
				</div>
			</Card>

			<div className="space-y-2">
				{tags.map((tag) => (
					<Card key={tag.id} className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div
									className="w-4 h-4 rounded"
									style={{ backgroundColor: tag.color }}
								/>
								<span className="font-medium">{tag.name}</span>
								{tag.shortcut && (
									<Badge variant="outline" className="ml-2">
										{tag.shortcut}
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-4">
								<Badge variant="secondary">{tag.count} imágenes</Badge>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleRemoveTag(tag.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
						{tag.description && (
							<p className="text-sm text-muted-foreground mt-2">
								{tag.description}
							</p>
						)}
					</Card>
				))}
			</div>
		</div>
	);
}
