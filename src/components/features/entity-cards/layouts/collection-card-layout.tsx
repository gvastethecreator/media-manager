"use client";

import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils/utils";
import type { Collection } from "@prisma/client";
import {
	ArrowUpRight,
	BookOpen,
	Clock,
	FolderIcon,
	Globe,
	ImageIcon,
	PencilIcon,
	Star,
	TagIcon,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import type * as React from "react";
import { useState } from "react";
import { EntityCardWrapper } from "../base/entity-card-wrapper";
import { VisualizationConfig } from "../config/visualization-config";
import type { CollectionFormData } from "../forms/entity-types";
import type { CardDesignPreset, CardOptions } from "../types/base-card-types";

type CardData =
	| (Collection & {
			_count?: { images: number };
			totalSize?: number;
			recentImages?: string[];
			topTags?: { name: string; count: number }[];
	  })
	| CollectionFormData;

// Opciones visuales optimizadas para tarjetas de colecciones inspiradas en Magic
const DEFAULT_COLLECTION_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño específico para colecciones
	designSystem: {
		preset: "collection" as CardDesignPreset,
		variant: "default",
		aspectRatio: "2/3", // Proporción similar a Magic
		cornerStyle: "rounded" as "rounded" | "sharp" | "beveled",
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: "soft" as "soft" | "none" | "hard" | "layered",
	},

	// Configuración de movimiento
	hoverLiftHeight: 8,
	maxRotation: 12,
	primaryColor: "60, 120, 200", // Tonos de azul para colecciones
	secondaryColor: "100, 200, 255",

	// Opciones de efectos
	holographicOptions: {
		patternType: "rainbow",
		intensity: 0.5,
		animationSpeed: 1.2,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 20,
		animationType: "follow-mouse",
		visibleOnHover: true,
	},

	grainOptions: {
		intensity: 0.1,
		density: 0.4,
		animated: false,
		noise: "light",
	},
};

// Sistema de rareza basado en el tamaño y la cantidad de imágenes
const COLLECTION_RARITY = {
	legendary: {
		color: "#ff9d00",
		borderWidth: "2px",
		borderEffect: "animated",
		label: "Legendaria",
	},
	epic: {
		color: "#a335ee",
		borderWidth: "2px",
		borderEffect: "static",
		label: "Épica",
	},
	rare: {
		color: "#0070dd",
		borderWidth: "1px",
		borderEffect: "static",
		label: "Rara",
	},
	uncommon: {
		color: "#1eff00",
		borderWidth: "1px",
		borderEffect: "static",
		label: "Poco común",
	},
	common: {
		color: "#ffffff",
		borderWidth: "1px",
		borderEffect: "static",
		label: "Común",
	},
};

// Determinar la rareza basada en el tamaño y cantidad de imágenes
function determineCollectionRarity(
	imageCount: number,
	totalSize = 0
): keyof typeof COLLECTION_RARITY {
	// Convertir totalSize a GB para facilitar comparación
	const sizeInGB = totalSize / (1024 * 1024 * 1024);

	if (imageCount > 200 || sizeInGB > 2) {
		return "legendary";
	}
	if (imageCount > 100 || sizeInGB > 1) {
		return "epic";
	}
	if (imageCount > 50 || sizeInGB > 0.5) {
		return "rare";
	}
	if (imageCount > 20 || sizeInGB > 0.1) {
		return "uncommon";
	}
	return "common";
}

function getRandomGradient() {
	const gradients = [
		"from-blue-700 to-indigo-900",
		"from-emerald-700 to-teal-900",
		"from-orange-700 to-amber-900",
		"from-rose-700 to-pink-900",
		"from-violet-700 to-purple-900",
		"from-cyan-700 to-blue-900",
		"from-green-700 to-emerald-900",
		"from-red-700 to-rose-900",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

function isFormData(data: CardData): data is CollectionFormData {
	return !("id" in data) || !data.id;
}

interface CollectionCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (collection: Collection) => void;
	onDelete?: (id: string) => void;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
	showVisualizationConfig?: boolean;
	options?: Partial<typeof DEFAULT_COLLECTION_OPTIONS>;
}

export function CollectionCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualizationConfig = false,
	options,
}: CollectionCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [gradient] = useState(getRandomGradient());
	const [configOpen, setConfigOpen] = useState(false);
	const [cardOptions, setCardOptions] = useState({
		...DEFAULT_COLLECTION_OPTIONS,
		...options,
	});

	// Determinar el número de imágenes
	const imageCount =
		"_count" in data && data._count?.images ? data._count.images : 0;

	// Determinar el tamaño total en bytes
	const totalSizeBytes =
		"totalSize" in data && data.totalSize ? data.totalSize : 0;

	// Determinar rareza
	const rarityKey = determineCollectionRarity(imageCount, totalSizeBytes);
	const rarityConfig = {
		name: rarityKey,
		color: COLLECTION_RARITY[rarityKey].color,
		borderWidth: COLLECTION_RARITY[rarityKey].borderWidth,
		borderEffect: COLLECTION_RARITY[rarityKey].borderEffect,
		glowColor:
			rarityKey === "legendary"
				? "#ff9d00"
				: rarityKey === "epic"
					? "#a335ee"
					: undefined,
	};

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					options={cardOptions}
					onOptionsChange={(newOptions) => {
						setCardOptions({
							...cardOptions,
							...newOptions,
						});
					}}
					onClose={() => setConfigOpen(false)}
				/>
			)}

			<EntityCardWrapper
				className={cn(`bg-gradient-to-b ${gradient}`, className)}
				options={cardOptions}
				entityType="collection"
				rarity={rarityConfig}
				onClick={onClick ? (e) => onClick(e) : undefined}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				showVisualizationConfig={showVisualizationConfig}
				onVisualizationConfigClick={() => setConfigOpen(true)}
			>
				{/* Estructura de la carta estilo TCG */}
				<div className="flex flex-col h-full p-3">
					{/* Franja superior con nombre y nivel */}
					<div className="flex justify-between items-center mb-3 border-b border-white/20 pb-2">
						<div className="flex items-center gap-1.5">
							<h3 className="text-base font-bold text-white">
								{"name" in data && data.name}
							</h3>
							{"url" in data && data.url && (
								<Globe className="h-3.5 w-3.5 text-blue-200 ml-1" />
							)}
						</div>

						{/* Indicador de nivel */}
						<div className="flex items-center justify-center bg-blue-500 text-white w-7 h-7 rounded-full font-bold text-sm">
							{Math.min(9, Math.max(1, Math.ceil(imageCount / 20)))}
						</div>
					</div>

					{/* Área de ilustración */}
					<div className="flex-none h-32 relative rounded-md overflow-hidden border border-white/20 mb-3">
						{/* Imágenes recientes como mosaico */}
						{"recentImages" in data &&
							data.recentImages &&
							data.recentImages.length > 0 && (
								<div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
									{data.recentImages.slice(0, 4).map((img) => (
										<div
											key={
												img ||
												`img-${Math.random().toString(36).substring(2, 9)}`
											}
											className="relative overflow-hidden"
										>
											{img && (
												<Image src={img} alt="" fill className="object-cover" />
											)}
										</div>
									))}
								</div>
							)}

						{/* Overlay para mejorar legibilidad */}
						<div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />

						{/* Iconos flotantes - contador de imágenes */}
						{imageCount > 0 && (
							<div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
								<ImageIcon className="w-3 h-3" />
								<span>{imageCount}</span>
							</div>
						)}

						{/* Emblema de rareza */}
						<div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white">
							{COLLECTION_RARITY[rarityKey].label}
						</div>

						{/* Icono principal si no hay imágenes */}
						{(!("recentImages" in data) ||
							!data.recentImages ||
							data.recentImages.length === 0) && (
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
									<BookOpen className="w-8 h-8 text-white/80" />
								</div>
							</div>
						)}
					</div>

					{/* Tipo y descripción */}
					<div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-md p-2 mb-3">
						{/* Información de tipo */}
						<div className="text-xs text-white/80 font-semibold mb-1 flex items-center">
							<span>Colección</span>
							{"platform" in data && data.platform && (
								<span className="ml-1">• {data.platform}</span>
							)}
							{"price" in data &&
								data.price !== undefined &&
								data.price !== null && (
									<span className="ml-1">• {data.price}€</span>
								)}
						</div>

						{/* Descripción */}
						{"description" in data && data.description && (
							<p className="text-xs text-white/70 line-clamp-2">
								{data.description}
							</p>
						)}
					</div>

					{/* Tags y estadísticas */}
					<div className="flex-1 flex flex-col justify-between">
						{/* Tags populares */}
						{"topTags" in data && data.topTags && data.topTags.length > 0 && (
							<div className="mb-2">
								<div className="flex items-center gap-1 text-xs text-white/60 mb-1">
									<TagIcon className="w-3 h-3" />
									<span>Tags populares:</span>
								</div>
								<div className="flex flex-wrap gap-1">
									{data.topTags.slice(0, 3).map((tag) => (
										<span
											key={tag.name}
											className="px-1.5 py-0.5 bg-white/10 text-white/90 rounded-sm text-[10px]"
										>
											{tag.name} ({tag.count})
										</span>
									))}
								</div>
							</div>
						)}

						{/* Estadísticas */}
						<div className="mt-auto pt-2 border-t border-white/20">
							<div className="grid grid-cols-2 gap-2 text-xs">
								{/* Tamaño total */}
								{totalSizeBytes > 0 && (
									<div className="flex flex-col items-center bg-black/20 rounded p-1">
										<span className="font-bold text-white">
											{formatBytes(totalSizeBytes)}
										</span>
										<span className="text-[10px] text-white/60">Tamaño</span>
									</div>
								)}
								{/* Fecha */}
								<div className="flex flex-col items-center bg-black/20 rounded p-1">
									<span className="font-bold text-white">
										{"createdAt" in data && data.createdAt
											? new Date(
													data.createdAt as unknown as string
												).toLocaleDateString("es-ES", {
													day: "2-digit",
													month: "2-digit",
													year: "2-digit",
												})
											: "N/A"}
									</span>
									<span className="text-[10px] text-white/60">Creada</span>
								</div>
							</div>
						</div>
					</div>

					{/* Acciones - botones flotantes */}
					{(onEdit || onDelete) && !isPreview && (
						<motion.div
							className="absolute bottom-2 right-2 flex gap-1 z-50"
							initial={{ opacity: 0 }}
							animate={{ opacity: isHovered ? 1 : 0 }}
							onHoverStart={() => setIsHovered(true)}
							onHoverEnd={() => setIsHovered(false)}
							onClick={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
						>
							{onEdit && (
								<Button
									variant="secondary"
									size="icon"
									className="h-8 w-8 shadow-md"
									onClick={() => {
										if (onEdit && !isFormData(data)) {
											onEdit(data as Collection);
										}
									}}
								>
									<PencilIcon className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="secondary"
									size="icon"
									className="h-8 w-8 shadow-md text-destructive"
									onClick={() => {
										if (onDelete && "id" in data && data.id) {
											onDelete(data.id);
										}
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</motion.div>
					)}

					{/* Botón de explorar en hover */}
					{onClick && (
						<motion.div
							className="absolute inset-0 flex items-center justify-center z-40"
							initial={{ opacity: 0 }}
							animate={{ opacity: isHovered ? 1 : 0 }}
							onHoverStart={() => setIsHovered(true)}
							onHoverEnd={() => setIsHovered(false)}
							onClick={(e: React.MouseEvent) => {
								if ((e.target as HTMLElement).closest("button")) {
									e.stopPropagation();
								}
							}}
						>
							<motion.div
								className="bg-black/60 backdrop-blur-md rounded-full p-4 text-white shadow-lg"
								initial={{ scale: 0.8 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.2 }}
							>
								<ArrowUpRight className="h-8 w-8" />
							</motion.div>
						</motion.div>
					)}
				</div>
			</EntityCardWrapper>
		</>
	);
}
