"use client";

import { useFileManager } from "@/store/file-manager.store";
import { useStatsStore } from "@/store/stats.store";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { TagIcon } from "lucide-react";

interface Tag {
	id: string;
	name: string;
	color: string;
	count: number;
	createdAt: Date;
	updatedAt: Date;
}

export function TagContentInfo() {
	const { currentTag } = useFileManager();
	const { stats } = useStatsStore();

	if (!currentTag) return null;

	const tag = currentTag as unknown as Tag;

	return (
		<div className="space-y-2">
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-center gap-2">
						<div
							className="h-8 w-8 rounded-sm flex items-center justify-center"
							style={{ backgroundColor: tag.color }}
						>
							<TagIcon className="h-4 w-4 text-white" />
						</div>
						<div className="flex flex-col">
							<h3 className="text-sm font-medium">{tag.name}</h3>
							<p className="text-xs text-muted-foreground">
								{tag.count} {tag.count === 1 ? "imagen" : "imágenes"}
							</p>
						</div>
					</div>

					<Separator className="my-2" />

					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Creada</span>
							<span className="text-sm font-medium">
								{formatDate(tag.createdAt)}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Actualizada</span>
							<span className="text-sm font-medium">
								{formatDate(tag.updatedAt)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
