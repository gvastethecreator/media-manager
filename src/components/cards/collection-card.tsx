"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import { motion } from "motion/react";
import {
	ImageIcon,
	TagIcon,
	FolderIcon,
	Trash2,
	PencilIcon,
} from "lucide-react";
import type { Collection } from "@prisma/client";
import Image from "next/image";

interface CollectionCardProps {
	collection: Collection & {
		_count?: { images: number };
		totalSize?: number;
		recentImages?: string[];
		topTags?: { name: string; count: number }[];
	};
	onEdit?: (
		collection: Collection,
		e: React.MouseEvent<HTMLButtonElement>
	) => void;
	onDelete?: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
}

function getRandomGradient() {
	const gradients = [
		"from-rose-500/20 to-indigo-500/20",
		"from-emerald-500/20 to-sky-500/20",
		"from-amber-500/20 to-pink-500/20",
		"from-violet-500/20 to-orange-500/20",
		"from-cyan-500/20 to-yellow-500/20",
		"from-fuchsia-500/20 to-lime-500/20",
		"from-purple-500/20 to-teal-500/20",
		"from-blue-500/20 to-red-500/20",
		"from-green-500/20 to-purple-500/20",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

export function CollectionCard({
	collection,
	onEdit,
	onDelete,
	onClick,
	className,
}: CollectionCardProps) {
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const [isHovered, setIsHovered] = React.useState(false);
	const gradient = getRandomGradient();

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	return (
		<motion.div
			className={cn("group relative", className)}
			onMouseMove={handleMouseMove}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClick}
		>
			<div
				className={cn(
					"relative w-full aspect-[3/4] rounded-lg overflow-hidden cursor-pointer",
					"bg-gradient-to-br from-background to-muted",
					"shadow-lg hover:shadow-xl transition-all duration-300"
				)}
			>
				{/* Efecto holográfico base */}
				<div
					className={cn(
						"absolute inset-0 z-10",
						"before:absolute before:inset-0",
						"before:bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_60%)]",
						"after:absolute after:inset-0",
						"after:bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_30%)]",
						"after:opacity-0 after:transition-opacity after:duration-300",
						"group-hover:after:opacity-100"
					)}
					style={
						{
							"--x": `${mousePosition.x}%`,
							"--y": `${mousePosition.y}%`,
						} as React.CSSProperties
					}
				/>

				{/* Fondo con patrón de constelaciones */}
				<div
					className="absolute inset-0 bg-repeat opacity-10"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
					}}
				/>

				{/* Marco holográfico */}
				<div
					className="absolute inset-0 border-[3px] rounded-lg z-20"
					style={{
						background: `linear-gradient(${mousePosition.x}deg, ${collection.color}20, ${collection.color}40)`,
						borderImage: `linear-gradient(${mousePosition.y}deg, ${collection.color}, transparent) 1`,
					}}
				/>

				{/* Contenido de la tarjeta */}
				<div className="relative z-30 h-full p-4 flex flex-col">
					{/* Encabezado */}
					<div className="flex items-center gap-2">
						<div
							className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
							style={{
								background: `linear-gradient(135deg, ${collection.color}, ${collection.color}80)`,
							}}
						>
							<span className="text-2xl filter drop-shadow-lg">
								{collection.emoji}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-bold truncate text-white drop-shadow-lg">
								{collection.name}
							</h3>
							{collection.description && (
								<p className="text-sm text-white/80 truncate">
									{collection.description}
								</p>
							)}
						</div>
					</div>

					{/* Grid de imágenes recientes */}
					<div className="relative mt-4 flex-1">
						<div className="grid grid-cols-3 gap-2 h-full bg-background/50 rounded-lg p-2">
							{collection.recentImages && collection.recentImages.length > 0 ?
								collection.recentImages.map((src, i) => (
									<div
										key={i}
										className="relative rounded-md overflow-hidden aspect-square"
									>
										{src ?
											<div className="relative w-full h-full">
												<Image
													src={src}
													alt={`Imagen ${i + 1}`}
													fill
													className="object-cover transition-transform group-hover:scale-105"
												/>
											</div>
										:	<div
												className={cn(
													"w-full h-full flex items-center justify-center",
													"bg-gradient-to-br",
													gradient
												)}
											>
												<ImageIcon className="w-4 h-4 text-white/80" />
											</div>
										}
									</div>
								))
							:	Array.from({ length: 9 }).map((_, i) => (
									<div
										key={i}
										className={cn(
											"relative rounded-md overflow-hidden aspect-square",
											"flex items-center justify-center",
											"bg-gradient-to-br",
											gradient
										)}
									>
										<ImageIcon className="w-4 h-4 text-white/80" />
									</div>
								))
							}
						</div>

						{/* Overlay con hover */}
						<div
							className={cn(
								"absolute inset-0 bg-gradient-to-t from-background/80 to-transparent",
								"opacity-0 group-hover:opacity-100 transition-opacity",
								"rounded-lg flex items-end justify-center p-4"
							)}
						>
							<Button variant="secondary" size="sm" className="gap-2">
								<ImageIcon className="w-4 h-4" />
								{collection.recentImages && collection.recentImages.length > 0 ?
									"Ver todas las imágenes"
								:	"Colección vacía"}
							</Button>
						</div>
					</div>

					{/* Estadísticas */}
					<div className="mt-4 space-y-2">
						<div className="flex items-center justify-between px-1 text-sm text-white/60">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-1.5">
									<FolderIcon className="w-4 h-4" />
									<span>{collection._count?.images || 0}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<TagIcon className="w-4 h-4" />
									<span>{collection.topTags?.length || 0}</span>
								</div>
							</div>
							<span>{formatBytes(collection.totalSize || 0)}</span>
						</div>

						{/* Etiquetas */}
						{collection.topTags && collection.topTags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{collection.topTags.slice(0, 3).map((tag, i) => (
									<div
										key={i}
										className="px-2 py-0.5 rounded-full text-[10px] bg-white/10"
									>
										{tag.name} ({tag.count})
									</div>
								))}
							</div>
						)}
					</div>

					{/* Acciones */}
					<motion.div
						className="absolute top-2 right-2 flex gap-1 z-40"
						initial={{ opacity: 0 }}
						animate={{ opacity: isHovered ? 1 : 0 }}
					>
						{onEdit && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.stopPropagation();
									onEdit?.(collection, e);
								}}
							>
								<PencilIcon className="h-4 w-4 text-white" />
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-red-400"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.stopPropagation();
									onDelete?.(collection.id, e);
								}}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</motion.div>
				</div>
			</div>
		</motion.div>
	);
}
