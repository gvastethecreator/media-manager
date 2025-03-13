"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format.utils";
import type { Collection } from "@prisma/client";
import {
	ArrowUpRight,
	BookMarked,
	BookOpen,
	Clock,
	Folder,
	FolderIcon,
	Globe,
	Grid3x3,
	ImageIcon,
	Layers,
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
import type {
	CardDesignPreset,
	CardOptions,
	RarityConfig,
	TextureConfig,
} from "../types/base-card-types";
import { ImageGrid } from "./image-grid";

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

interface CollectionCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
	showVisualizationConfig?: boolean;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
}

/**
 * Componente CollectionCard - Diseñado con inspiración en cartas de colección de juegos
 *
 * Características:
 * - Diseño con marco ornamentado y elementos decorativos
 * - Visualización de imagen de portada con efectos
 * - Información sobre el número de elementos en la colección
 * - Soporte para efectos visuales y rareza
 */
export function CollectionCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualizationConfig = false,
	options,
	rarity: initialRarity,
	texture: initialTexture,
}: CollectionCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [configOpen, setConfigOpen] = useState(false);
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>(
		options || {
			...DEFAULT_COLLECTION_OPTIONS,
			enable3DEffect: true,
			enableHolographicEffect: false,
			enableBorderEffect: true,
			enableGrainEffect: true,
			borderGlowColor: "255, 215, 0", // Gold color
			borderGlowIntensity: 0.6,
			hoverLiftHeight: 8,
		}
	);

	// Determinar el número de imágenes
	const imageCount =
		"_count" in data && data._count?.images ? data._count.images : 0;

	// Determinar el tamaño total en bytes
	const totalSizeBytes =
		"totalSize" in data && data.totalSize ? data.totalSize : 0;

	// Determinar rareza
	const rarityKey = determineCollectionRarity(imageCount, totalSizeBytes);
	const rarityConfig = initialRarity || {
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

	// Determinar el tipo de colección basado en el nombre o descripción
	const determineCollectionType = () => {
		const keywords = {
			ancient: ["antiguo", "histórico", "reliquia", "arqueología", "pasado"],
			magical: ["mágico", "arcano", "místico", "hechizo", "encantado"],
			nature: ["naturaleza", "bosque", "planta", "animal", "ecología"],
			technology: ["tecnología", "digital", "electrónico", "futuro", "ciencia"],
			art: ["arte", "pintura", "escultura", "creativo", "artístico"],
			literature: ["literatura", "libro", "escrito", "poesía", "novela"],
			music: ["música", "sonido", "melodía", "canción", "instrumento"],
			space: ["espacio", "galaxia", "estrella", "planeta", "cósmico"],
			ocean: ["océano", "mar", "acuático", "marino", "submarino"],
			fantasy: ["fantasía", "imaginario", "irreal", "ficticio", "sueño"],
		};

		// Obtener texto para analizar
		const description =
			"description" in data && data.description
				? data.description.toLowerCase()
				: "";
		const name = "name" in data && data.name ? data.name.toLowerCase() : "";
		const textToAnalyze = `${name} ${description}`;

		// Buscar coincidencias
		for (const [type, words] of Object.entries(keywords)) {
			if (words.some((word) => textToAnalyze.includes(word))) {
				return type;
			}
		}

		// Valor predeterminado
		return "general";
	};

	const collectionType = determineCollectionType();

	// Configuración visual basada en el tipo de colección
	const collectionStyles = {
		ancient: {
			bgGradient: "from-amber-800 via-yellow-700 to-amber-900",
			frameColor: "border-amber-600",
			textColor: "text-amber-100",
			iconColor: "text-amber-300",
			icon: <BookMarked />,
			patternOpacity: 0.15,
		},
		magical: {
			bgGradient: "from-indigo-900 via-purple-800 to-violet-900",
			frameColor: "border-purple-500",
			textColor: "text-purple-100",
			iconColor: "text-purple-300",
			icon: <Layers />,
			patternOpacity: 0.2,
		},
		nature: {
			bgGradient: "from-green-800 via-emerald-700 to-green-900",
			frameColor: "border-emerald-600",
			textColor: "text-emerald-100",
			iconColor: "text-emerald-300",
			icon: <Layers />,
			patternOpacity: 0.15,
		},
		technology: {
			bgGradient: "from-cyan-900 via-blue-800 to-cyan-900",
			frameColor: "border-blue-500",
			textColor: "text-blue-100",
			iconColor: "text-blue-300",
			icon: <Grid3x3 />,
			patternOpacity: 0.2,
		},
		art: {
			bgGradient: "from-rose-800 via-pink-700 to-rose-900",
			frameColor: "border-pink-500",
			textColor: "text-pink-100",
			iconColor: "text-pink-300",
			icon: <ImageIcon />,
			patternOpacity: 0.15,
		},
		literature: {
			bgGradient: "from-stone-800 via-amber-900 to-stone-900",
			frameColor: "border-amber-700",
			textColor: "text-amber-100",
			iconColor: "text-amber-300",
			icon: <BookMarked />,
			patternOpacity: 0.15,
		},
		music: {
			bgGradient: "from-violet-900 via-fuchsia-800 to-violet-900",
			frameColor: "border-fuchsia-500",
			textColor: "text-fuchsia-100",
			iconColor: "text-fuchsia-300",
			icon: <Layers />,
			patternOpacity: 0.2,
		},
		space: {
			bgGradient: "from-slate-900 via-blue-950 to-slate-900",
			frameColor: "border-blue-600",
			textColor: "text-blue-100",
			iconColor: "text-blue-300",
			icon: <Grid3x3 />,
			patternOpacity: 0.25,
		},
		ocean: {
			bgGradient: "from-blue-900 via-cyan-800 to-blue-900",
			frameColor: "border-cyan-600",
			textColor: "text-cyan-100",
			iconColor: "text-cyan-300",
			icon: <Layers />,
			patternOpacity: 0.2,
		},
		fantasy: {
			bgGradient: "from-violet-800 via-purple-700 to-fuchsia-800",
			frameColor: "border-purple-500",
			textColor: "text-purple-100",
			iconColor: "text-purple-300",
			icon: <BookMarked />,
			patternOpacity: 0.2,
		},
		general: {
			bgGradient: "from-gray-800 via-slate-700 to-gray-900",
			frameColor: "border-gray-600",
			textColor: "text-gray-100",
			iconColor: "text-gray-300",
			icon: <Folder />,
			patternOpacity: 0.15,
		},
	};

	const style =
		collectionStyles[collectionType as keyof typeof collectionStyles] ||
		collectionStyles.general;

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
				className={cn(`bg-gradient-to-b ${style.bgGradient}`, className)}
				options={cardOptions}
				entityType="collection"
				rarity={rarityConfig}
				texture={initialTexture}
				onClick={onClick ? (e) => onClick(e) : undefined}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				showVisualizationConfig={showVisualizationConfig}
				onVisualizationConfigClick={() => setConfigOpen(true)}
				enableExplode={true}
				explodeLayers={[
					{
						id: "content",
						label: "Contenido",
						icon: <div className="w-3 h-3 bg-primary rounded-sm" />,
					},
					{
						id: "holographic",
						label: "Efecto Holo",
						icon: (
							<div className="w-3 h-3 bg-gradient-to-tr from-purple-400 to-blue-300 opacity-60" />
						),
					},
					{
						id: "scanlines",
						label: "Scanlines",
						icon: (
							<div className="w-3 h-3 bg-neutral-300 rounded-sm opacity-60" />
						),
					},
					{
						id: "border",
						label: "Borde",
						icon: <div className="w-3 h-3 border border-primary rounded-sm" />,
					},
				]}
			>
				{/* Marco ornamentado */}
				<div
					className={cn(
						"absolute inset-3 border-2 rounded-sm",
						style.frameColor,
						"bg-black/20 backdrop-blur-sm"
					)}
				/>

				{/* Patrón decorativo */}
				<div
					className="absolute inset-0 opacity-20 mix-blend-overlay"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='${style.patternOpacity}' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
					}}
				/>

				{/* Contenido principal */}
				<div className="flex flex-col h-full p-6 relative z-10">
					{/* Cabecera con título e icono */}
					<div className="flex items-center justify-between mb-3">
						<h3
							className={cn("text-lg font-bold line-clamp-1", style.textColor)}
						>
							{"name" in data && data.name}
						</h3>

						<div
							className={cn(
								"h-8 w-8 flex items-center justify-center",
								style.iconColor
							)}
						>
							{style.icon}
						</div>
					</div>

					{/* Imagen de portada */}
					<div className="relative flex-1 overflow-hidden mb-4 rounded border border-white/20">
						{cardOptions.useImageGrid ? (
							<ImageGrid
								layout={cardOptions.imageGridLayout || "single"}
								gap={cardOptions.imageGridGap || 4}
								style={cardOptions.imageGridStyle || "standard"}
								images={
									"recentImages" in data && data.recentImages
										? data.recentImages.map((path, index) => ({
												id: `image-${index}`,
												path,
												thumbnail: path,
											}))
										: [
												{
													id: "cover",
													path:
														"coverImage" in data && data.coverImage
															? data.coverImage
															: "",
													thumbnail:
														"coverImage" in data && data.coverImage
															? data.coverImage
															: "",
												},
											]
								}
							/>
						) : (
							<>
								{"coverImage" in data && data.coverImage ? (
									<Image
										src={data.coverImage}
										alt={
											"name" in data ? data.name || "Colección" : "Colección"
										}
										className="object-cover h-full w-full transition-transform duration-700"
										width={300}
										height={400}
										style={{
											objectFit: "cover",
											transform: isHovered ? "scale(1.05)" : "scale(1)",
										}}
									/>
								) : (
									<div className="flex items-center justify-center h-full bg-black/30 aspect-[3/4]">
										<div
											className={cn("h-12 w-12", style.iconColor, "opacity-40")}
										>
											{style.icon}
										</div>
									</div>
								)}
							</>
						)}

						{/* Efecto de brillo en la esquina */}
						<div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full" />
					</div>

					{/* Información de la colección */}
					<div className={cn("mt-auto", style.textColor)}>
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold">
								{imageCount} {imageCount === 1 ? "elemento" : "elementos"}
							</p>

							{/* Sello de rareza */}
							<div
								className={cn(
									"px-2 py-0.5 text-xs rounded-sm",
									"border border-white/30",
									"bg-black/30 backdrop-blur-sm"
								)}
							>
								{COLLECTION_RARITY[rarityKey].label.toUpperCase()}
							</div>
						</div>

						{"description" in data && data.description && (
							<p className={cn("text-xs mt-2 line-clamp-2 opacity-80")}>
								{data.description}
							</p>
						)}
					</div>

					{/* Botones de edición/eliminación */}
					{!isPreview && isHovered && "id" in data && data.id && (
						<div className="absolute top-2 right-2 flex gap-1">
							{onEdit && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
									onClick={(e) => {
										e.stopPropagation();
										onEdit(data.id as string);
									}}
								>
									<PencilIcon className="h-3.5 w-3.5" />
								</Button>
							)}
							{onDelete && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(data.id as string);
									}}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							)}
						</div>
					)}
				</div>
			</EntityCardWrapper>
		</>
	);
}
