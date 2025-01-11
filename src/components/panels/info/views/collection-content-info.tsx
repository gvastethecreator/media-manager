"use client";

import { useFileManager } from "@/store/file-manager";
import { useStatsStore } from "@/store/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface Collection {
	id: string;
	name: string;
	count: number;
	color?: string;
	emoji?: string;
	description?: string;
	createdAt: Date;
	tags?: Tag[];
}

export function CollectionContentInfo() {
	const { currentCollection } = useFileManager();
	const { stats } = useStatsStore();

	if (!currentCollection) return null;

	const collection = currentCollection as Collection;

	return (
		<div className="space-y-2">
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-2xl">{collection.emoji}</span>
						<div className="flex flex-col">
							<h3 className="text-sm font-medium">{collection.name}</h3>
							<p className="text-xs text-muted-foreground">
								{collection.description || "Sin descripción"}
							</p>
						</div>
					</div>

					<Separator className="my-2" />

					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Imágenes</span>
							<span className="text-sm font-medium">
								{collection.count || 0}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Creada</span>
							<span className="text-sm font-medium">
								{formatDate(collection.createdAt)}
							</span>
						</div>
					</div>

					{collection.tags && collection.tags.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Etiquetas</span>
								<div className="flex flex-wrap gap-1">
									{collection.tags.map((tag: Tag) => (
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
