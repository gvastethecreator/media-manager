"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Edit, Eye, Plus, Trash, Trash2 } from "lucide-react";
import React from "react";
import type { TextureConfig } from "../../types/base-card-types";
import { TexturePreview } from "./texture-preview";

interface TextureListProps {
	textures: TextureConfig[];
	selectedTextureId: string | null;
	onSelectTexture: (id: string) => void;
	onAddTexture: () => void;
	onDeleteTexture: (id: string) => void;
}

export function TextureList({
	textures,
	selectedTextureId,
	onSelectTexture,
	onAddTexture,
	onDeleteTexture,
}: TextureListProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">Texturas</h3>
				<Button
					variant="outline"
					size="sm"
					onClick={onAddTexture}
					className="h-8 w-8 p-0"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			<ScrollArea className="h-[300px] rounded-md border p-4">
				<div className="space-y-4">
					{textures.map((texture) => (
						<button
							key={texture.id}
							type="button"
							className={`group relative w-full cursor-pointer rounded-lg border p-2 text-left transition-colors hover:bg-accent ${
								selectedTextureId === texture.id
									? "border-primary bg-accent"
									: "border-transparent"
							}`}
							onClick={() => onSelectTexture(texture.id)}
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">
									{texture.name || "Textura sin nombre"}
								</span>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
									onClick={(e) => {
										e.stopPropagation();
										onDeleteTexture(texture.id);
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>

							<div className="mt-2 aspect-video w-full overflow-hidden rounded-md">
								<TexturePreview texture={texture} />
							</div>

							<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
								<span>{texture.patternType}</span>
								<span>Opacidad: {texture.opacity}</span>
							</div>
						</button>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
