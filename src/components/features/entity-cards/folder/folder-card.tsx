"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { formatBytes } from "@/lib/utils/utils";
import type { Folder } from "@/types/entities/folders";
import {
	Clock,
	FolderIcon,
	FolderOpenIcon,
	ImageIcon,
	PencilIcon,
	Settings2,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";

interface FolderCardProps {
	folder: Folder;
	onEdit?: (folder: Folder) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
}

function getRandomGradient() {
	const gradients = {
		blue: "from-blue-500/20 via-cyan-500/20 to-blue-500/20",
		purple: "from-purple-500/20 via-pink-500/20 to-purple-500/20",
		green: "from-green-500/20 via-emerald-500/20 to-green-500/20",
		yellow: "from-yellow-500/20 via-amber-500/20 to-yellow-500/20",
		red: "from-red-500/20 via-rose-500/20 to-red-500/20",
		default: "from-slate-500/20 via-gray-500/20 to-slate-500/20",
	};

	const keys = Object.keys(gradients) as Array<keyof typeof gradients>;
	return gradients[keys[Math.floor(Math.random() * keys.length)]];
}

export function FolderCard({
	folder,
	onEdit,
	onDelete,
	onClick,
	className,
}: FolderCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const gradient = React.useMemo(() => getRandomGradient(), []);

	return (
		<motion.div
			className={cn(
				"relative w-full aspect-3/4 rounded-lg overflow-hidden",
				"bg-linear-to-br from-background to-muted",
				"shadow-lg hover:shadow-xl transition-all duration-300",
				className
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.2 }}
			onClick={onClick}
		>
			{/* Fondo holográfico */}
			<div
				className={cn("absolute inset-0 bg-linear-to-br opacity-30", gradient)}
				style={{
					backgroundSize: "200% 200%",
					animation: isHovered ? "gradient 3s ease infinite" : "none",
				}}
			/>

			{/* Patrón de fondo */}
			<div
				className="absolute inset-0 opacity-5"
				style={{
					backgroundImage: `repeating-linear-gradient(
						45deg,
						currentColor,
						transparent 2px,
						transparent 10px
					)`,
				}}
			/>

			{/* Marco ornamentado */}
			<div className="absolute inset-[2px] rounded-lg border-2 border-primary/20" />

			{/* Contenido de la tarjeta */}
			<div className="relative h-full p-4 flex flex-col">
				{/* Encabezado */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"h-12 w-12 rounded-full flex items-center justify-center",
								"bg-linear-to-br shadow-inner",
								gradient
							)}
						>
							<FolderIcon className="h-6 w-6" />
						</div>
						<div>
							<h3 className="font-bold text-lg leading-tight line-clamp-1">
								{folder.name}
							</h3>
							<div className="flex items-center gap-1 text-sm text-muted-foreground">
								<ImageIcon className="h-3 w-3" />
								<span>{folder._count?.images || 0} imágenes</span>
							</div>
						</div>
					</div>
				</div>

				{/* Grid de imágenes recientes */}
				<div className="flex-1 relative group/grid">
					<div className="grid grid-cols-3 gap-2 h-full bg-background/50 rounded-lg p-2">
						{folder.recentImages?.map((src: string | null, i: number) => (
							<div
								key={`folder-image-${folder.id}-${i}-${src?.substring(0, 10) || "empty"}`}
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
											"w-full h-full flex items-center justify-center",
											"bg-linear-to-br",
											gradient
										)}
									>
										<ImageIcon className="w-4 h-4 text-white/80" />
									</div>
								)}
							</div>
						))}
					</div>

					{/* Overlay con hover */}
					<button
						type="button"
						className={cn(
							"absolute inset-0 bg-linear-to-t from-background/80 to-transparent",
							"opacity-0 group-hover/grid:opacity-100 transition-opacity",
							"rounded-lg flex items-end justify-center p-4 border-0"
						)}
						onClick={(e) => {
							e.stopPropagation();
							onClick?.();
						}}
						aria-label="Ver contenido de la carpeta"
					>
						<span className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
							<FolderOpenIcon className="w-4 h-4" />
							Ver contenido
						</span>
					</button>
				</div>

				{/* Estadísticas */}
				<div className="mt-4 space-y-3">
					<div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-1.5">
								<ImageIcon className="w-4 h-4" />
								<span>{folder._count?.images || 0}</span>
							</div>

							<div className="flex items-center gap-1.5">
								<Clock className="w-4 h-4" />
								<span>
									{folder.lastIndexed
										? new Date(folder.lastIndexed).toLocaleDateString()
										: "Nunca"}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-1.5">
							<span>{formatBytes(Number(folder.totalSize || 0))}</span>
						</div>
					</div>
				</div>

				{/* Acciones */}
				<motion.div
					className="absolute top-2 right-2 flex gap-1"
					initial={{ opacity: 0 }}
					animate={{ opacity: isHovered ? 1 : 0 }}
				>
					{onEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={() => {
								onEdit(folder);
							}}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-destructive"
							onClick={() => {
								if (folder.id) {
									onDelete(folder.id);
								}
							}}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</motion.div>
			</div>
		</motion.div>
	);
}
