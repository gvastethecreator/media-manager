"use client";

import type { ConceptFormData } from "@/components/features/entity-cards/entity-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import type { Concept } from "@/types/entities/entities";
import { Lightbulb, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

type CardData = Concept | ConceptFormData;

interface ConceptCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (concept: Concept) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export function ConceptCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	className,
}: ConceptCardProps) {
	// Para componente preview, detectar cambios y animar
	const [animateUpdate, setAnimateUpdate] = useState(false);
	const prevDataRef = useRef<CardData | null>(null);

	// Verificar si alguna propiedad relevante ha cambiado
	useEffect(() => {
		if (!isPreview) {
			return;
		}

		if (!prevDataRef.current) {
			prevDataRef.current = { ...data };
			return;
		}

		const prevData = prevDataRef.current;
		const hasChanged =
			prevData.name !== data.name ||
			prevData.emoji !== data.emoji ||
			prevData.color !== data.color ||
			("category" in prevData &&
				"category" in data &&
				prevData.category !== data.category) ||
			("content" in prevData &&
				"content" in data &&
				prevData.content !== data.content) ||
			// Verificar si las etiquetas han cambiado
			("tags" in prevData &&
				"tags" in data &&
				JSON.stringify(prevData.tags) !== JSON.stringify(data.tags));

		if (hasChanged) {
			setAnimateUpdate(true);
			const timer = setTimeout(() => setAnimateUpdate(false), 300);
			prevDataRef.current = { ...data };
			return () => clearTimeout(timer);
		}
	}, [data, isPreview]);

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<AnimatePresence mode="wait">
				<motion.div
					key={`${data.name}-${"category" in data ? data.category : ""}-${animateUpdate ? Date.now() : "static"}`}
					className={cn(
						"group relative flex flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 w-full h-full",
						animateUpdate ? "ring-2 ring-primary" : "hover:border-primary",
						className
					)}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{
						opacity: 1,
						scale: 1,
						transition: { type: "spring", stiffness: 500, damping: 30 },
					}}
					exit={{ opacity: 0, scale: 0.9 }}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<motion.div
								className="flex h-10 w-10 items-center justify-center rounded-full"
								style={{ backgroundColor: data.color || "#3b82f6" }}
								animate={{
									backgroundColor: data.color || "#3b82f6",
									transition: { duration: 0.5 },
								}}
							>
								<Lightbulb className="h-5 w-5 text-white" />
							</motion.div>
							<motion.h3
								className="text-xl font-semibold"
								animate={{
									opacity: [0.7, 1],
									y: [5, 0],
									transition: { duration: 0.3 },
								}}
							>
								{data.name || "Sin nombre"}
							</motion.h3>
						</div>

						{"category" in data && data.category && (
							<Badge variant="outline" className="ml-auto">
								{data.category}
							</Badge>
						)}
					</div>

					<div className="mt-4 flex-1">
						{"content" in data && data.content && (
							<motion.div
								className="text-sm line-clamp-3 text-muted-foreground"
								animate={{
									opacity: [0.5, 1],
									y: [10, 0],
									transition: { duration: 0.4 },
								}}
							>
								{data.content}
							</motion.div>
						)}
					</div>

					<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-2">
							{"tags" in data && data.tags && (
								<span>{data.tags.length} etiquetas</span>
							)}
						</div>
						<div className="flex items-center gap-1">
							<span className="inline-flex items-center rounded-full border px-2 py-0.5">
								{data.emoji || "💡"}
							</span>
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		);
	}

	// Renderizar versión normal
	return (
		<Card className={cn("relative rounded-sm bg-muted/30", className)}>
			<CardHeader className="p-3">
				<CardTitle className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<span
							className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
							style={{ backgroundColor: data.color || "#3b82f6" }}
						>
							{data.emoji || <Lightbulb className="h-4 w-4" />}
						</span>
						{data.name}
					</div>
					<div className="flex items-center gap-2">
						{onEdit && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => {
									onEdit(data as Concept);
								}}
							>
								<Pencil className="h-4 w-4" />
								<span className="sr-only">Editar</span>
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => {
									if (data.id) {
										onDelete(data.id);
									}
								}}
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">Eliminar</span>
							</Button>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				{data.description && (
					<p className="text-sm text-muted-foreground mb-2">
						{data.description}
					</p>
				)}
				{"content" in data && data.content && (
					<div className="text-sm whitespace-pre-wrap">{data.content}</div>
				)}
				{"tags" in data && data.tags && (
					<div className="flex flex-wrap gap-2 mt-4">
						{typeof data.tags === "string"
							? JSON.parse(data.tags).map((tag: string) => (
									<Badge key={tag} variant="secondary" className="text-xs">
										{tag}
									</Badge>
								))
							: data.tags.map((tag: string) => (
									<Badge key={tag} variant="secondary" className="text-xs">
										{tag}
									</Badge>
								))}
					</div>
				)}
				{"category" in data && data.category && (
					<div className="absolute top-3 right-3">
						<Badge variant="outline" className="text-xs">
							{data.category}
						</Badge>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
