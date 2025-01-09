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
import { motion } from "motion/react";
import { cn, formatBytes } from "@/lib/utils";
import {
	FolderIcon,
	ImageIcon,
	RefreshCw,
	Settings2,
	Trash2,
	ArrowUpRight,
	Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	getFolders,
	reindexFolder,
	deleteFolder,
	ProcessStatus,
	ErrorResponse,
} from "@/services/folder.service";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/store/navigation";
import { useFileManager } from "@/store/file-manager";
import { eventsService } from "@/services/events.service";

interface FolderCardProps {
	folder: any;
	onReindex: (id: string) => void;
	onDelete: (id: string) => void;
	isProcessing: boolean;
	processStatus: any;
	onClick: () => void;
}

function getRandomGradient() {
	const gradients = [
		"from-blue-500/20 to-cyan-500/20",
		"from-purple-500/20 to-pink-500/20",
		"from-yellow-500/20 to-red-500/20",
		"from-green-500/20 to-emerald-500/20",
		"from-indigo-500/20 to-purple-500/20",
		"from-orange-500/20 to-amber-500/20",
		"from-teal-500/20 to-green-500/20",
		"from-red-500/20 to-orange-500/20",
		"from-cyan-500/20 to-blue-500/20",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

function FolderCard({
	folder,
	onReindex,
	onDelete,
	isProcessing,
	processStatus,
	onClick,
}: FolderCardProps) {
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const router = useRouter();
	const gradient = getRandomGradient();

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isConfirmingDelete) {
			onDelete(folder.id);
			setIsConfirmingDelete(false);
		} else {
			setIsConfirmingDelete(true);
			setTimeout(() => setIsConfirmingDelete(false), 3000);
		}
	};

	const handleReindex = (e: React.MouseEvent) => {
		e.stopPropagation();
		onReindex(folder.id);
	};

	const handleSettings = (e: React.MouseEvent) => {
		e.stopPropagation();
		router.push("/settings/folders");
	};

	const isProcessingThis = isProcessing && processStatus.folderId === folder.id;

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
					background: `linear-gradient(160deg, ${gradient} 0%, transparent 100%)`,
				}}
				onClick={onClick}
			>
				<CardHeader className="p-4 pb-2 flex-none">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div
								className={cn(
									"p-2 rounded-md bg-gradient-to-br",
									"from-blue-500 to-cyan-500"
								)}
							>
								<FolderIcon className="h-5 w-5 text-white" />
							</div>
							<div>
								<CardTitle className="text-xl">{folder.name}</CardTitle>
								<CardDescription className="line-clamp-1">
									{folder.path}
								</CardDescription>
							</div>
						</div>
						<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button
								variant="ghost"
								size="icon"
								className={cn("h-8 w-8", isProcessingThis && "text-primary")}
								onClick={handleReindex}
								disabled={isProcessing}
							>
								<RefreshCw
									className={cn("h-4 w-4", isProcessingThis && "animate-spin")}
								/>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handleSettings}
							>
								<Settings2 className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									"h-8 w-8",
									isConfirmingDelete &&
										"bg-destructive text-destructive-foreground hover:bg-destructive/90"
								)}
								onClick={handleDelete}
								disabled={isProcessing}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<ArrowUpRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-4 pt-2 flex-1 flex flex-col">
					{/* Grid de imágenes recientes */}
					<div className="relative group/grid flex-1">
						<div className="grid grid-cols-3 gap-2 h-full bg-background/50 rounded-lg p-2">
							{folder.recentImages && folder.recentImages.length > 0
								? folder.recentImages.map((src: string, i: number) => (
										<div
											key={i}
											className="relative rounded-md overflow-hidden aspect-square"
										>
											{src ? (
												<img
													src={src}
													alt={`Imagen ${i + 1}`}
													className="object-cover w-full h-full transition-transform group-hover/grid:scale-105"
												/>
											) : (
												<div
													className={cn(
														"w-full h-full flex items-center justify-center bg-gradient-to-br",
														getRandomGradient()
													)}
												>
													<ImageIcon className="w-5 h-5 text-white/80" />
												</div>
											)}
										</div>
								  ))
								: Array.from({ length: 9 }).map((_, i) => (
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
								{folder._count?.images > 0
									? `Ver ${folder._count.images} imágenes`
									: "Carpeta vacía"}
							</Button>
						</div>
					</div>

					{/* Footer con stats */}
					<div className="mt-4 space-y-3">
						<div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
							<div className="flex items-center gap-4">
								<HoverCard openDelay={200}>
									<HoverCardTrigger asChild>
										<div className="flex items-center gap-1.5 cursor-help">
											<ImageIcon className="w-4 h-4" />
											<span>{folder._count?.images || 0}</span>
										</div>
									</HoverCardTrigger>
									<HoverCardContent side="top" className="text-sm">
										Esta carpeta contiene {folder._count?.images || 0} imágenes
									</HoverCardContent>
								</HoverCard>

								<HoverCard openDelay={200}>
									<HoverCardTrigger asChild>
										<div className="flex items-center gap-1.5 cursor-help">
											<Clock className="w-4 h-4" />
											<span>
												{folder.lastIndexed
													? new Date(folder.lastIndexed).toLocaleDateString()
													: "Nunca"}
											</span>
										</div>
									</HoverCardTrigger>
									<HoverCardContent side="top" className="text-sm">
										Última indexación de la carpeta
									</HoverCardContent>
								</HoverCard>
							</div>

							<HoverCard openDelay={200}>
								<HoverCardTrigger asChild>
									<div className="flex items-center gap-1.5 cursor-help">
										<span>{formatBytes(Number(folder.totalSize || 0))}</span>
									</div>
								</HoverCardTrigger>
								<HoverCardContent side="top" className="text-sm">
									Espacio total usado por las imágenes
								</HoverCardContent>
							</HoverCard>
						</div>

						{/* Progress bar if processing */}
						{isProcessingThis && (
							<div className="space-y-2">
								<div className="h-2 bg-muted rounded-full overflow-hidden">
									<div
										className="h-full bg-primary transition-all duration-200"
										style={{ width: `${processStatus.progress || 0}%` }}
									/>
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>{processStatus.status || "Procesando..."}</span>
									<span>
										{processStatus.current}/{processStatus.total}
									</span>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

export function FoldersView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentFolder } = useFileManager();
	const [folders, setFolders] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processStatus, setProcessStatus] = useState({});

	useEffect(() => {
		const loadFolders = async () => {
			try {
				setIsLoading(true);
				const data = await getFolders();
				setFolders(data);
			} catch (error) {
				setError(error instanceof Error ? error.message : "Error desconocido");
			} finally {
				setIsLoading(false);
			}
		};

		// Cargar carpetas inicialmente
		loadFolders();

		// Suscribirse a eventos relevantes
		const unsubscribe = eventsService.subscribe((event) => {
			if (
				event === "folders:added" ||
				event === "folders:deleted" ||
				event === "folders:modified"
			) {
				loadFolders();
			}
		});

		return () => {
			unsubscribe();
		};
	}, []);

	const handleReindex = async (folderId: string) => {
		if (isProcessing) return;

		setIsProcessing(true);
		setProcessStatus({ folderId, progress: 0 });

		try {
			await reindexFolder(folderId, {
				onProgress: (status) => {
					setProcessStatus((prev) => ({
						...prev,
						...status,
						folderId,
					}));
				},
				onError: (error) => {
					toast.error(`Error: ${error.message}`);
					setIsProcessing(false);
					setProcessStatus({});
				},
				onComplete: () => {
					toast.success("Carpeta reindexada correctamente");
					setIsProcessing(false);
					setProcessStatus({});
					// El evento folders:modified ya disparará la recarga
				},
			});
		} catch (error) {
			toast.error(
				`Error: ${error instanceof Error ? error.message : "Error desconocido"}`
			);
			setIsProcessing(false);
			setProcessStatus({});
		}
	};

	const handleDelete = async (folderId: string) => {
		if (isProcessing) return;

		try {
			await deleteFolder(folderId);
			toast.success("Carpeta eliminada correctamente");
			// El evento folders:deleted ya disparará la recarga
		} catch (error) {
			toast.error(
				`Error: ${error instanceof Error ? error.message : "Error desconocido"}`
			);
		}
	};

	const handleFolderClick = useCallback(
		(folder: any) => {
			setCurrentView("folder-content");
			setCurrentFolder(folder.id);
		},
		[setCurrentView, setCurrentFolder]
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

	if (!folders || folders.length === 0) {
		return (
			<EmptyState
				icon={FolderIcon}
				title="No hay carpetas indexadas"
				description="Agrega carpetas desde el panel de configuración para comenzar a indexar tus imágenes."
			/>
		);
	}

	return (
		<ScrollArea className="h-full w-full">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
				{folders.map((folder, index) => (
					<motion.div
						key={folder.id}
						animate={{
							opacity: [0, 1],
							y: [20, 0],
						}}
						transition={{ delay: index * 0.1 }}
					>
						<FolderCard
							folder={folder}
							onReindex={handleReindex}
							onDelete={handleDelete}
							isProcessing={isProcessing}
							processStatus={processStatus}
							onClick={() => handleFolderClick(folder)}
						/>
					</motion.div>
				))}
			</div>
		</ScrollArea>
	);
}
