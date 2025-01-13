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

interface Character {
	id: string;
	name: string;
	description?: string;
	emoji: string;
	count: number;
	createdAt: Date;
	updatedAt: Date;
	tags?: Tag[];
	age?: number;
	gender?: string;
	occupation?: string;
	origin?: string;
}

export function CharacterContentInfo() {
	const { currentCharacter } = useFileManager();
	const { stats } = useStatsStore();

	if (!currentCharacter) return null;

	const character = currentCharacter as Character;

	return (
		<div className="space-y-2">
			<Card>
				<CardContent className="p-4 space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-2xl">{character.emoji}</span>
						<div className="flex flex-col">
							<h3 className="text-sm font-medium">{character.name}</h3>
							<p className="text-xs text-muted-foreground">
								{character.description || "Sin descripción"}
							</p>
						</div>
					</div>

					<Separator className="my-2" />

					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Imágenes</span>
							<span className="text-sm font-medium">
								{character.count || 0}
							</span>
						</div>
						{character.age && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Edad</span>
								<span className="text-sm font-medium">{character.age}</span>
							</div>
						)}
						{character.gender && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Género</span>
								<span className="text-sm font-medium">{character.gender}</span>
							</div>
						)}
						{character.occupation && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Ocupación</span>
								<span className="text-sm font-medium">
									{character.occupation}
								</span>
							</div>
						)}
						{character.origin && (
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">Origen</span>
								<span className="text-sm font-medium">{character.origin}</span>
							</div>
						)}
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Creado</span>
							<span className="text-sm font-medium">
								{formatDate(character.createdAt)}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted-foreground">Actualizado</span>
							<span className="text-sm font-medium">
								{formatDate(character.updatedAt)}
							</span>
						</div>
					</div>

					{character.tags && character.tags.length > 0 && (
						<>
							<Separator className="my-2" />
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground">Etiquetas</span>
								<div className="flex flex-wrap gap-1">
									{character.tags.map((tag: Tag) => (
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
