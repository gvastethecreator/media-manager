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

interface Place {
	id: string;
	name: string;
	description?: string;
	emoji: string;
	count: number;
	createdAt: Date;
	updatedAt: Date;
	tags?: Tag[];
	region?: string;
	climate?: string;
	type?: string;
	dangers?: string[];
	resources?: string[];
	lore?: string;
}

export function PlaceContentInfo() {
	const { currentPlace } = useFileManager();
	const { stats } = useStatsStore();

	if (!currentPlace) return null;

	const place = currentPlace as Place;

	return (
		<div className="space-y-2">
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-2xl">{place.emoji}</span>
						<div className="flex flex-col">
							<h3 className="text-sm font-medium">{place.name}</h3>
							<p className="text-xs text-muted-foreground">
								{place.description || "Sin descripción"}
							</p>
						</div>
					</div>

					<Separator className="my-2" />

					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Imágenes</span>
							<span className="text-sm font-medium">{place.count || 0}</span>
						</div>
						{place.region && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Región</span>
								<span className="text-sm font-medium">{place.region}</span>
							</div>
						)}
						{place.climate && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Clima</span>
								<span className="text-sm font-medium">{place.climate}</span>
							</div>
						)}
						{place.type && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Tipo</span>
								<span className="text-sm font-medium">{place.type}</span>
							</div>
						)}
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Creado</span>
							<span className="text-sm font-medium">
								{formatDate(place.createdAt)}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Actualizado</span>
							<span className="text-sm font-medium">
								{formatDate(place.updatedAt)}
							</span>
						</div>
					</div>

					{place.dangers && place.dangers.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Peligros</span>
								<div className="flex flex-wrap gap-1">
									{place.dangers.map((danger, index) => (
										<Badge
											key={index}
											variant="destructive"
											className="text-[10px]"
										>
											{danger}
										</Badge>
									))}
								</div>
							</div>
						</>
					)}

					{place.resources && place.resources.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Recursos</span>
								<div className="flex flex-wrap gap-1">
									{place.resources.map((resource, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="text-[10px]"
										>
											{resource}
										</Badge>
									))}
								</div>
							</div>
						</>
					)}

					{place.lore && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Historia</span>
								<p className="text-xs text-muted-foreground">{place.lore}</p>
							</div>
						</>
					)}

					{place.tags && place.tags.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Etiquetas</span>
								<div className="flex flex-wrap gap-1">
									{place.tags.map((tag: Tag) => (
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
