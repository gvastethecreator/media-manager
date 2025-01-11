"use client";

import { useEffect, useState, useCallback } from "react";
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
import { cn } from "@/lib/utils";
import { Album, ImageIcon, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useNavigationStore } from "@/store/navigation";
import { useFileManager } from "@/store/file-manager";

interface AlbumCardProps {
	album: any;
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

function AlbumCard({ album, onClick }: AlbumCardProps) {
	const gradient = getRandomGradient();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<HoverCard>
				<HoverCardTrigger asChild>
					<Card
						className={cn(
							"group relative overflow-hidden transition-all hover:shadow-md",
							"cursor-pointer border-2 border-primary/10"
						)}
						onClick={onClick}
					>
						<CardHeader className="p-4">
							<CardTitle className="flex items-center gap-2 text-base">
								{album.emoji && <span>{album.emoji}</span>}
								<span className="truncate">{album.name}</span>
							</CardTitle>
							<CardDescription className="flex items-center gap-2 text-xs">
								<ImageIcon className="h-3 w-3" />
								<span>{album.count} imágenes</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-0">
							<div
								className={cn(
									"absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r",
									gradient
								)}
							/>
						</CardContent>
					</Card>
				</HoverCardTrigger>
				<HoverCardContent
					align="start"
					className="w-[300px] border-2 border-primary/10"
				>
					<div className="flex justify-between">
						<div className="space-y-1">
							<h4 className="text-sm font-semibold">
								{album.emoji && <span className="mr-2">{album.emoji}</span>}
								{album.name}
							</h4>
							<div className="flex items-center gap-4">
								<Badge variant="secondary" className="font-normal">
									{album.count} imágenes
								</Badge>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground"
						>
							<Settings2 className="h-4 w-4" />
						</Button>
					</div>
				</HoverCardContent>
			</HoverCard>
		</motion.div>
	);
}

export function AlbumsView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentAlbum } = useFileManager();
	const [albums, setAlbums] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchAlbums = async () => {
			try {
				setIsLoading(true);
				const response = await fetch("/api/albums");
				const data = await response.json();
				setAlbums(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Error desconocido");
			} finally {
				setIsLoading(false);
			}
		};

		fetchAlbums();
	}, []);

	const handleAlbumClick = useCallback(
		(album: any) => {
			setCurrentView("album-content");
			setCurrentAlbum(album.id);
		},
		[setCurrentView, setCurrentAlbum]
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

	if (!albums || albums.length === 0) {
		return (
			<EmptyState
				icon={Album}
				title="No hay álbumes"
				description="Los álbumes te ayudan a organizar tus imágenes. Crea un nuevo álbum desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{albums.map((album) => (
						<AlbumCard
							key={album.id}
							album={album}
							onClick={() => handleAlbumClick(album)}
						/>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
