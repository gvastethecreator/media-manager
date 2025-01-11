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

interface Object {
	id: string;
	name: string;
	description?: string;
	emoji: string;
	count: number;
	createdAt: Date;
	updatedAt: Date;
	tags?: Tag[];
	type?: string;
	material?: string;
	origin?: string;
	properties?: string[];
	usage?: string[];
	lore?: string;
}

export function ObjectContentInfo() {
	const { currentObject } = useFileManager();
	const { stats } = useStatsStore();

	if (!currentObject) return null;

	const object = currentObject as Object;

	return (
		<div className="space-y-2">
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-2xl">{object.emoji}</span>
						<div className="flex flex-col">
							<h3 className="text-sm font-medium">{object.name}</h3>
							<p className="text-xs text-muted-foreground">
								{object.description || "Sin descripción"}
							</p>
						</div>
					</div>

					<Separator className="my-2" />

					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Imágenes</span>
							<span className="text-sm font-medium">{object.count || 0}</span>
						</div>
						{object.type && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Tipo</span>
								<span className="text-sm font-medium">{object.type}</span>
							</div>
						)}
						{object.material && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Material</span>
								<span className="text-sm font-medium">{object.material}</span>
							</div>
						)}
						{object.origin && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Origen</span>
								<span className="text-sm font-medium">{object.origin}</span>
							</div>
						)}
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Creado</span>
							<span className="text-sm font-medium">
								{formatDate(object.createdAt)}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Actualizado</span>
							<span className="text-sm font-medium">
								{formatDate(object.updatedAt)}
							</span>
						</div>
					</div>

					{object.properties && object.properties.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">
									Propiedades
								</span>
								<div className="flex flex-wrap gap-1">
									{object.properties.map((property, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="text-[10px]"
										>
											{property}
										</Badge>
									))}
								</div>
							</div>
						</>
					)}

					{object.usage && object.usage.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Usos</span>
								<div className="flex flex-wrap gap-1">
									{object.usage.map((use, index) => (
										<Badge
											key={index}
											variant="outline"
											className="text-[10px]"
										>
											{use}
										</Badge>
									))}
								</div>
							</div>
						</>
					)}

					{object.lore && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Historia</span>
								<p className="text-xs text-muted-foreground">{object.lore}</p>
							</div>
						</>
					)}

					{object.tags && object.tags.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Etiquetas</span>
								<div className="flex flex-wrap gap-1">
									{object.tags.map((tag: Tag) => (
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
