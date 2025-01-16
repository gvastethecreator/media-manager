"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { ViewProps } from "../types";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { cn, formatBytes } from "@/lib/utils";
import {
	TagIcon,
	ImageIcon,
	Hash,
	Settings2,
	ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import { getTags } from "@/app/actions/tag.actions";

const viewLogger = logger.withContext("TagsView");

interface Tag {
	id: string;
	name: string;
	description: string | null;
	color: string;
	count: number;
	size: string;
	createdAt: Date;
	updatedAt: Date;
	shortcut: string | null;
}

interface TagCardProps {
	tag: Tag;
	onClick: () => void;
}

function getRandomGradient() {
	const gradients = [
		"from-rose-500 to-indigo-500",
		"from-emerald-500 to-sky-500",
		"from-amber-500 to-pink-500",
		"from-violet-500 to-orange-500",
		"from-cyan-500 to-yellow-500",
		"from-fuchsia-500 to-lime-500",
		"from-purple-500 to-teal-500",
		"from-blue-500 to-red-500",
		"from-green-500 to-purple-500",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

const TagCard = memo(function TagCard({ tag, onClick }: TagCardProps) {
	const router = useRouter();
	const gradient = getRandomGradient();

	const handleEdit = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			viewLogger.info("⚙️ Editando etiqueta:", tag.name);
			router.push("/settings/tags");
		},
		[router, tag.name]
	);

	return (
		<motion.div animate={{ scale: 1 }} className="h-full">
			<Card
				className={cn(
					"w-full h-full cursor-pointer overflow-hidden group",
					"transition-all duration-200 hover:shadow-lg",
					"border-2 flex flex-col"
				)}
				style={{
					borderColor: "transparent",
					background: `linear-gradient(160deg, hsl(var(--muted)) 0%, transparent 100%)`,
				}}
				onClick={onClick}
			>
				<CardHeader className="p-4 pb-2 flex-none">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className={cn("p-2 rounded-md bg-gradient-to-br", gradient)}>
								<Hash className="h-5 w-5 text-white" />
							</div>
							<div>
								<CardTitle className="text-xl">{tag.name}</CardTitle>
								<CardDescription className="line-clamp-1">
									{tag.description || `Etiqueta: ${tag.name}`}
								</CardDescription>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-4 pt-2 flex-1 flex flex-col">
					{/* Grid de imágenes placeholder */}
					<div className="relative group/grid flex-1">
						<div className="grid grid-cols-3 gap-2 h-full bg-background/50 rounded-lg p-2">
							{Array.from({ length: 9 }).map((_, i) => (
								<div
									key={i}
									className={cn(
										"relative rounded-md overflow-hidden aspect-square",
										"flex items-center justify-center",
										"bg-gradient-to-br transition-transform hover:scale-105",
										getRandomGradient()
									)}
								>
									<ImageIcon className="w-5 h-5 text-white/80" />
								</div>
							))}
						</div>

						{/* Overlay con hover */}
						<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover/grid:opacity-100 transition-opacity rounded-lg flex items-end justify-center p-4">
							<Button variant="secondary" size="sm" className="gap-2">
								<ImageIcon className="w-4 h-4" />
								{tag.count > 0 ? `Ver ${tag.count} imágenes` : "Sin imágenes"}
							</Button>
						</div>
					</div>

					{/* Footer con stats */}
					<div className="mt-4 space-y-3">
						<div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
							<HoverCard openDelay={200}>
								<HoverCardTrigger asChild>
									<div className="flex items-center gap-1.5 cursor-help">
										<ImageIcon className="w-4 h-4" />
										<span>{tag.count} imágenes</span>
									</div>
								</HoverCardTrigger>
								<HoverCardContent side="top" className="text-sm">
									Esta etiqueta está presente en {tag.count} imágenes
								</HoverCardContent>
							</HoverCard>

							<HoverCard openDelay={200}>
								<HoverCardTrigger asChild>
									<div className="flex items-center gap-1.5 cursor-help">
										<span>{tag.size}</span>
									</div>
								</HoverCardTrigger>
								<HoverCardContent side="top" className="text-sm">
									Espacio total usado por las imágenes con esta etiqueta
								</HoverCardContent>
							</HoverCard>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
});

export function TagsView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentTag } = useFileManager();
	const [tags, setTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTags = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando etiquetas...");
			const data = await getTags();
			const transformedData = data.map((tag) => ({
				...tag,
				count: tag._count.images,
				size: formatBytes(tag.totalSize),
			}));
			setTags(transformedData);
			viewLogger.info(`✅ ${data.length} etiquetas cargadas`);
		} catch (error) {
			viewLogger.error("❌ Error al cargar etiquetas:", error);
			setError(
				error instanceof Error ? error.message : "Error al cargar etiquetas"
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar etiquetas inicialmente
		fetchTags();

		// Suscribirse a eventos relevantes
		const handleTagModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de etiquetas recibido:", data);
			fetchTags();
		};

		eventsService.on("tags:modified", handleTagModified);

		return () => {
			eventsService.off("tags:modified", handleTagModified);
		};
	}, [fetchTags]);

	const handleTagClick = useCallback(
		(tag: Tag) => {
			viewLogger.info("🖱️ Click en etiqueta:", tag.name);
			setCurrentView("tag-content");
			setCurrentTag(tag.id);
		},
		[setCurrentView, setCurrentTag]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!tags || tags.length === 0) {
		return (
			<EmptyState
				icon={TagIcon}
				title="No hay etiquetas"
				description="Las etiquetas te ayudan a organizar y encontrar tus imágenes. Crea una nueva etiqueta desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{tags.map((tag) => (
						<TagCard
							key={tag.id}
							tag={tag}
							onClick={() => handleTagClick(tag)}
						/>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
