"use client";

import { useFileManager } from "@/store/file-manager.store";
import { useStatsStore } from "@/store/stats.store";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface Album {
	id: string;
	name: string;
	description?: string;
	emoji: string;
	count: number;
	createdAt: Date;
	updatedAt: Date;
	tags?: Tag[];
}

export function AlbumContentInfo() {
	const { currentAlbum } = useFileManager();
	const { stats } = useStatsStore();

	if (!currentAlbum) return null;

	const album = currentAlbum as Album;

	return (
		<div className="space-y-2">
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-2xl">{album.emoji}</span>
						<div className="flex flex-col">
							<h3 className="text-sm font-medium">{album.name}</h3>
							<p className="text-xs text-muted-foreground">
								{album.description || "Sin descripción"}
							</p>
						</div>
					</div>

					<Separator className="my-2" />

					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Imágenes</span>
							<span className="text-sm font-medium">{album.count || 0}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Creado</span>
							<span className="text-sm font-medium">
								{formatDate(album.createdAt)}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Actualizado</span>
							<span className="text-sm font-medium">
								{formatDate(album.updatedAt)}
							</span>
						</div>
					</div>

					{album.tags && album.tags.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Etiquetas</span>
								<div className="flex flex-wrap gap-1">
									{album.tags.map((tag: Tag) => (
										<Badge
											key={tag.id}
											variant="secondary"
											style={{ backgroundColor: tag.color }}
											className="text-[10px]"
										>
											{tag.name}
										</Badge>
									))}
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
