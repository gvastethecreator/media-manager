"use client";

import { useFileManager } from "@/store/file-manager";
import { useStatsStore } from "@/store/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatBytes } from "@/lib/utils";
import { FolderIcon } from "lucide-react";

interface Folder {
	id: string;
	name: string;
	path: string;
	count: number;
	size?: number;
	createdAt: Date;
	updatedAt: Date;
}

export function FolderContentInfo() {
	const { currentFolder } = useFileManager();
	const { stats } = useStatsStore();

	if (!currentFolder) return null;

	const folder = currentFolder as Folder;

	return (
		<div className="space-y-2">
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-sm bg-primary/10 flex items-center justify-center">
							<FolderIcon className="h-4 w-4" />
						</div>
						<div className="flex flex-col">
							<h3 className="text-sm font-medium">{folder.name}</h3>
							<p className="text-xs text-muted-foreground truncate">
								{folder.path}
							</p>
						</div>
					</div>

					<Separator className="my-2" />

					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Imágenes</span>
							<span className="text-sm font-medium">{folder.count || 0}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Tamaño</span>
							<span className="text-sm font-medium">
								{formatBytes(folder.size || 0)}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Creada</span>
							<span className="text-sm font-medium">
								{formatDate(folder.createdAt)}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Actualizada</span>
							<span className="text-sm font-medium">
								{formatDate(folder.updatedAt)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
