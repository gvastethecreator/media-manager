"use client";

import type { TagFormData } from "@/components/features/entity-cards/forms/entity-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes, formatDate } from "@/lib/utils";
import type { Tag } from "@prisma/client";
import {
	Clock,
	Hash,
	Image as ImageIcon,
	PencilIcon,
	Sparkles,
	Tag as TagIcon,
	Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

type CardData =
	| (Tag & {
			_count?: { images: number };
			totalSize?: number;
	  })
	| TagFormData;

interface TagCardProps {
	data?: CardData;
	tag?: CardData;
	isPreview?: boolean;
	onEdit?: (tag: Tag) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export function TagCard({
	data: propData,
	tag: propTag,
	isPreview = false,
	onEdit,
	onDelete,
	className,
}: TagCardProps) {
	const data = propData || propTag;

	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	// Para componente preview, detectar cambios y animar
	const [animateUpdate, setAnimateUpdate] = useState(false);
	const prevDataRef = useRef<CardData | null>(null);

	// Para modo preview, animar cambios
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
			prevData.color !== data.color ||
			("shortcut" in prevData &&
				"shortcut" in data &&
				prevData.shortcut !== data.shortcut);

		if (hasChanged) {
			setAnimateUpdate(true);
			const timer = setTimeout(() => setAnimateUpdate(false), 300);
			prevDataRef.current = { ...data };
			return () => clearTimeout(timer);
		}
	}, [data, isPreview]);

	// Manejar el movimiento del mouse para efectos místicos
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	if (!data) {
		console.error("TagCard: No se proporcionó 'data' ni 'tag'");
		return null;
	}

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<AnimatePresence mode="wait">
				<motion.div
					key={`${data.name}-${data.color}-${animateUpdate ? Date.now() : "static"}`}
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
					<div className="flex items-center space-x-2">
						<motion.div
							className="flex h-10 w-10 items-center justify-center rounded-full"
							style={{ backgroundColor: data.color || "#10b981" }}
							animate={{
								backgroundColor: data.color || "#10b981",
								transition: { duration: 0.5 },
							}}
						>
							<TagIcon className="h-5 w-5 text-white" />
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

						{"shortcut" in data && data.shortcut && (
							<Badge variant="outline" className="ml-auto">
								{data.shortcut}
							</Badge>
						)}
					</div>

					<div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
						<span>Etiqueta para categorizar imágenes</span>
						<motion.div
							className="h-4 w-4 rounded-full"
							style={{ backgroundColor: data.color || "#10b981" }}
							animate={{
								backgroundColor: data.color || "#10b981",
								scale: [1, 1.2, 1],
								transition: { duration: 0.5 },
							}}
						/>
					</div>
				</motion.div>
			</AnimatePresence>
		);
	}

	return (
		<motion.div
			className={cn(
				"relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden group",
				"bg-linear-to-br from-background/50 to-muted/50",
				"shadow-lg hover:shadow-xl transition-all duration-300",
				"cursor-pointer perspective-1000",
				className
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			onMouseMove={handleMouseMove}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.2 }}
			style={
				{
					"--x": `${mousePosition.x}%`,
					"--y": `${mousePosition.y}%`,
				} as React.CSSProperties
			}
		>
			{/* Fondo iridiscente */}
			<div
				className={cn(
					"absolute inset-0 z-10",
					"before:absolute before:inset-0 before:opacity-70",
					"before:bg-[radial-gradient(circle_at_var(--x)_var(--y),var(--tag-color)_0%,transparent_60%)]"
				)}
				style={
					{ "--tag-color": data?.color || "#3b82f6" } as React.CSSProperties
				}
			/>

			{/* Elementos decorativos */}
			<motion.div
				className="absolute inset-0 z-20 mix-blend-overlay opacity-30"
				animate={{
					opacity: isHovered ? 0.5 : 0.3,
				}}
			>
				<div
					className="absolute top-1/3 left-1/4 h-20 w-20 rounded-full opacity-60"
					style={{
						background: `radial-gradient(circle at center, ${data.color}, transparent 70%)`,
						filter: "blur(10px)",
					}}
				/>
				<div
					className="absolute bottom-1/3 right-1/4 h-24 w-24 rounded-full opacity-60"
					style={{
						background: `radial-gradient(circle at center, ${data.color}, transparent 70%)`,
						filter: "blur(15px)",
					}}
				/>
			</motion.div>

			{/* Partículas brillantes */}
			<motion.div
				className="absolute inset-0 z-20 overflow-hidden"
				animate={{ opacity: isHovered ? 1 : 0.5 }}
				transition={{ duration: 0.3 }}
			>
				{Array.from({ length: 12 }).map((_, i) => (
					<motion.div
						key={`particle-${i}-${data.id || "preview"}-${data.name}-${Date.now()}`}
						className="absolute h-1 w-1 rounded-full bg-white"
						animate={{
							opacity: [0.4, 1, 0.4],
							scale: [0.8, 1.2, 0.8],
							x: `calc(${Math.random() * 100}% - 0.5rem)`,
							y: `calc(${Math.random() * 100}% - 0.5rem)`,
						}}
						transition={{
							duration: Math.random() * 3 + 2,
							repeat: Number.POSITIVE_INFINITY,
							repeatType: "reverse",
							delay: Math.random() * 2,
						}}
						style={{
							boxShadow: `0 0 5px ${data.color}, 0 0 10px ${data.color}`,
						}}
					/>
				))}
			</motion.div>

			{/* Contenido de la tarjeta */}
			<div className="absolute inset-0 z-30 flex flex-col p-4">
				{/* Encabezado */}
				<div className="mb-4 flex items-center gap-2">
					<div
						className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
						style={{ backgroundColor: data.color }}
					>
						<TagIcon className="h-5 w-5 text-white drop-shadow" />
					</div>
					<div>
						<h3 className="text-lg font-bold text-white drop-shadow-lg">
							{data.name}
						</h3>
						{"shortcut" in data && data.shortcut && (
							<div className="mt-1 inline-flex items-center rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
								{data.shortcut}
							</div>
						)}
					</div>
				</div>

				{/* Estadísticas centrales */}
				<div className="mt-auto space-y-3">
					{"_count" in data && data._count && (
						<div className="flex items-center gap-6 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
							<div className="flex items-center gap-2">
								<ImageIcon className="h-4 w-4 text-white/80" />
								<span className="text-sm font-medium text-white">
									{data._count?.images || 0}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<TagIcon className="h-4 w-4 text-white/80" />
								<span className="text-sm font-medium text-white">Etiqueta</span>
							</div>
						</div>
					)}

					<div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Sparkles className="h-3.5 w-3.5 text-white/70" />
								<span className="text-xs text-white/70">Categorización</span>
							</div>
							<div
								className="h-3 w-3 rounded-full"
								style={{ backgroundColor: data.color }}
							/>
						</div>
					</div>

					{"createdAt" in data && (
						<div className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/60">
							<Clock className="h-3 w-3" />
							<span>Creada {formatDate(data.createdAt)}</span>
						</div>
					)}
				</div>

				{/* Acciones */}
				<motion.div
					className="absolute right-2 top-2 flex gap-1 z-40"
					initial={{ opacity: 0 }}
					animate={{ opacity: isHovered ? 1 : 0 }}
				>
					{onEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs"
							onClick={() => {
								onEdit(data as Tag);
							}}
						>
							<PencilIcon className="h-4 w-4 text-white" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs text-destructive"
							onClick={() => {
								if (data.id) {
									onDelete(data.id);
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
