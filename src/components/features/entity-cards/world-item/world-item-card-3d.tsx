"use client";

import { BaseCard } from "@/components/features/entity-cards/base/base-card";
import type { WorldItemFormData } from "@/components/features/entity-cards/entity-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { formatBytes, formatDate } from "@/lib/utils/utils";
import type { WorldItem as PrismaWorldItem } from "@prisma/client";
import {
	Box,
	Clock,
	Cog,
	Crown,
	Gauge,
	Gem,
	Image as ImageIcon,
	PencilIcon,
	Scroll,
	ScrollText,
	Shield,
	Sparkles,
	Swords,
	Target,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";

type CardData =
	| (PrismaWorldItem & {
			_count?: { images: number };
			totalSize?: number;
			featuredImage?: string | null;
			recentImages?: (string | null)[];
	  })
	| WorldItemFormData;

interface WorldItemCard3DProps {
	worldItem: CardData;
	isPreview?: boolean;
	onEdit?: (worldItem: PrismaWorldItem) => void;
	onDelete?: (id: string) => void;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
}

const getRarityGradient = (rarity: string) => {
	const gradients = {
		Común: "from-zinc-500/20 via-slate-400/20 to-zinc-500/20",
		Poco_común: "from-emerald-500/20 via-green-400/20 to-emerald-500/20",
		Raro: "from-blue-500/20 via-indigo-400/20 to-blue-500/20",
		Muy_raro: "from-violet-500/20 via-purple-400/20 to-violet-500/20",
		Legendario: "from-amber-500/20 via-yellow-400/20 to-amber-500/20",
		Mítico: "from-rose-500/20 via-red-400/20 to-rose-500/20",
		default: "from-zinc-500/20 via-slate-400/20 to-zinc-500/20",
	};
	return (
		gradients[rarity.replace(" ", "_") as keyof typeof gradients] ||
		gradients.default
	);
};

const getTypeIcon = (type: string) => {
	switch (type.toLowerCase()) {
		case "arma":
			return <Swords className="h-4 w-4" />;
		case "armadura":
			return <Shield className="h-4 w-4" />;
		case "accesorio":
			return <Crown className="h-4 w-4" />;
		case "consumible":
			return <Scroll className="h-4 w-4" />;
		case "herramienta":
			return <Cog className="h-4 w-4" />;
		case "gema":
			return <Gem className="h-4 w-4" />;
		case "reliquia":
			return <Sparkles className="h-4 w-4" />;
		default:
			return <Box className="h-4 w-4" />;
	}
};

export function WorldItemCard3D({
	worldItem: data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
}: WorldItemCard3DProps) {
	// Estado para hover - Usado en múltiples places en los botones y estilos condicionales
	const [isHovered, setIsHovered] = React.useState(false);

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<BaseCard
				className={cn("h-52", className)}
				options={{
					enableHolographicEffect: true,
					enableScanlines: false,
					hoverLiftHeight: 5,
					maxRotation: 10,
				}}
			>
				{/* Contenido simplificado para preview */}
				<div className="p-4 flex flex-col h-full relative">
					<div className="flex items-center space-x-2">
						<span className="text-2xl">{data.emoji || "🧩"}</span>
						<h3 className="text-xl font-semibold line-clamp-1">
							{data.name || "Sin nombre"}
						</h3>
						{"category" in data && data.category && (
							<Badge variant="outline" className="ml-auto">
								{data.category}
							</Badge>
						)}
					</div>

					{data.description && (
						<p className="text-sm text-muted-foreground line-clamp-3 mt-2">
							{data.description}
						</p>
					)}

					<div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
						<span className="flex items-center">
							<div
								className="mr-1.5 h-2.5 w-2.5 rounded-full"
								style={{ backgroundColor: data.color || "#f97316" }}
							/>
							Vista previa
						</span>
						<div className="flex items-center space-x-2">
							<Box className="h-3.5 w-3.5 mr-1" />
							<span>Objeto del mundo</span>
						</div>
					</div>
				</div>
			</BaseCard>
		);
	}

	// Determinamos el gradiente basado en la rareza
	let rarityGradient = "from-zinc-500/20 via-slate-400/20 to-zinc-500/20";
	let typeIcon = <Box className="h-4 w-4" />;

	if ("rarity" in data && data.rarity) {
		rarityGradient = getRarityGradient(data.rarity);
	}

	if ("type" in data && data.type) {
		typeIcon = getTypeIcon(data.type);
	}

	// Opciones según la rareza para efectos visuales más impresionantes
	const getCardOptions = () => {
		if ("rarity" in data && data.rarity) {
			// Los items más raros tienen efectos más pronunciados
			if (
				data.rarity.toLowerCase().includes("legend") ||
				data.rarity.toLowerCase().includes("mítico")
			) {
				return {
					enableHolographicEffect: true,
					enableScanlines: true,
					enableLightHalo: true,
					enableGlowEffect: true,
					hoverLiftHeight: 15,
					maxRotation: 18,
					// Colores personalizados según la rareza
					primaryColor: data.rarity.toLowerCase().includes("legend")
						? "255, 184, 0"
						: "255, 0, 106", // dorado o rosa intenso
				};
			}
			// Items raros tienen efectos moderados
			if (data.rarity.toLowerCase().includes("raro")) {
				return {
					enableHolographicEffect: true,
					enableScanlines: true,
					enableLightHalo: true,
					hoverLiftHeight: 12,
					maxRotation: 15,
					primaryColor: "59, 130, 246", // azul
				};
			}
		}

		// Objetos comunes tienen efectos sutiles
		return {
			enableHolographicEffect: true,
			enableScanlines: false,
			enableLightHalo: true,
			hoverLiftHeight: 8,
			maxRotation: 12,
		};
	};

	return (
		<BaseCard
			onClick={onClick}
			className={cn("relative h-[500px] w-full", className)}
			options={getCardOptions()}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
		>
			<div className="relative h-full p-5 flex flex-col">
				{/* Fondo con gradiente según rareza */}
				<div
					className={cn(
						"absolute inset-0 bg-gradient-to-br z-0 opacity-40",
						rarityGradient
					)}
				/>

				{/* Overlay de hover - Usamos isHovered aquí */}
				<div
					className={cn(
						"absolute inset-0 bg-gradient-to-t from-background to-transparent transition-opacity duration-300 z-0",
						isHovered ? "opacity-60" : "opacity-40"
					)}
				/>

				{/* Contenido */}
				<div className="relative h-full z-20">
					{/* Encabezado */}
					<div className="flex items-start gap-3 mb-4">
						<div
							className="flex flex-shrink-0 h-12 w-12 rounded-lg items-center justify-center shadow-md"
							style={{ backgroundColor: data.color || "#f97316" }}
						>
							<span className="text-2xl text-white">{data.emoji}</span>
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-xl font-bold leading-tight truncate">
								{data.name}
							</h3>
							{"type" in data && data.type && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									{typeIcon}
									<span className="truncate">{data.type}</span>
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2">
							{"rarity" in data && data.rarity && (
								<Badge
									variant="outline"
									className={cn(
										"px-2 py-1",
										data.rarity.toLowerCase().includes("legend") &&
											"bg-amber-100/20 text-amber-600 dark:text-amber-400",
										data.rarity.toLowerCase().includes("mítico") &&
											"bg-rose-100/20 text-rose-600 dark:text-rose-400",
										data.rarity.toLowerCase().includes("raro") &&
											"bg-blue-100/20 text-blue-600 dark:text-blue-400"
									)}
								>
									{data.rarity}
								</Badge>
							)}
							{"_count" in data && (
								<div className="flex items-center text-xs text-muted-foreground">
									<ImageIcon className="h-3.5 w-3.5 mr-1" />
									<span>{data._count?.images || 0}</span>
								</div>
							)}
						</div>
					</div>

					{/* Descripción */}
					{data.description && (
						<div className="mb-4">
							<p className="text-sm text-muted-foreground line-clamp-3">
								{data.description}
							</p>
						</div>
					)}

					{/* Propiedades */}
					{"properties" in data && data.properties && (
						<div className="mb-4">
							<h4 className="text-sm font-semibold mb-2 flex items-center">
								<Sparkles className="h-4 w-4 mr-2" />
								Propiedades
							</h4>
							<div className="flex flex-wrap gap-2">
								{(typeof data.properties === "string"
									? JSON.parse(data.properties)
									: data.properties
								)
									.slice(0, 4)
									.map((prop: string) => (
										<Badge
											key={`prop-${prop}`}
											variant="secondary"
											className="text-xs"
										>
											{prop}
										</Badge>
									))}
								{(typeof data.properties === "string"
									? JSON.parse(data.properties)
									: data.properties
								).length > 4 && (
									<Badge variant="secondary" className="text-xs">
										+
										{(typeof data.properties === "string"
											? JSON.parse(data.properties)
											: data.properties
										).length - 4}
									</Badge>
								)}
							</div>
						</div>
					)}

					{/* Requisitos */}
					{"requirements" in data && data.requirements && (
						<div className="mb-4">
							<h4 className="text-sm font-semibold mb-2 flex items-center">
								<Gauge className="h-4 w-4 mr-2" />
								Requisitos
							</h4>
							<div className="text-xs text-muted-foreground">
								{Object.entries(
									typeof data.requirements === "string"
										? JSON.parse(data.requirements)
										: data.requirements
								).map(([key, value]) => (
									<div
										key={`detail-${key}`}
										className="flex justify-between items-center border-b border-muted pb-1 mb-1 last:border-0"
									>
										<span>{key}:</span>
										<span className="font-semibold">
											{Array.isArray(value)
												? value.join(", ")
												: value !== null && value !== undefined
													? String(value)
													: ""}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Origen */}
					{"origin" in data && data.origin && (
						<div className="mb-4">
							<h4 className="text-sm font-semibold mb-1 flex items-center">
								<ScrollText className="h-4 w-4 mr-2" />
								Origen
							</h4>
							<p className="text-xs text-muted-foreground line-clamp-2">
								{data.origin}
							</p>
						</div>
					)}

					{/* Footer */}
					<div className="mt-auto pt-4 flex items-center justify-between">
						<div className="flex items-center text-xs text-muted-foreground">
							<Clock className="h-3.5 w-3.5 mr-1.5" />
							{"createdAt" in data && data.createdAt && (
								<span>{formatDate(data.createdAt as Date)}</span>
							)}
						</div>

						{onEdit && onDelete && (
							<div className="flex gap-2">
								<Button
									size="icon"
									variant="ghost"
									className="h-8 w-8"
									onClick={() => {
										onEdit(data as PrismaWorldItem);
									}}
								>
									<PencilIcon className="h-4 w-4" />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									className="h-8 w-8 text-destructive"
									onClick={() => {
										if (data.id) {
											onDelete(data.id);
										}
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</BaseCard>
	);
}
