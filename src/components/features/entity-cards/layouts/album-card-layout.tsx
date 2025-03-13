"use client";

import type { AlbumWithStats } from "@/app/actions/albums/album.actions";
import { generateRarityConfig } from "@/components/features/entity-cards/entity-card-adapter";
import { EntityCardWrapper } from "@/components/features/entity-cards/entity-base-card";
import type { AlbumFormData } from "@/components/features/entity-cards/forms/entity-types";
import { ImageGrid } from "@/components/features/entity-cards/layouts/image-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format.utils";
import {
	Album as AlbumIcon,
	Camera,
	Clock,
	Image as ImageIcon,
	PencilIcon,
	Trash2,
} from "lucide-react";
import { ArrowUpRight, BookOpen, Calendar, Images, Star } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import * as React from "react";
import { useEffect, useMemo, useRef } from "react";
import { VisualizationConfig } from "../config/visualization-config";
import type {
	CardDesignPreset,
	CardOptions,
	RarityConfig,
	TextureConfig,
} from "../types/base-card-types";

// Asegurar que ambos tipos tienen las propiedades necesarias
type CardData =
	| (AlbumWithStats & {
			_count?: { images: number };
			totalSize?: number;
			coverImage?: string;
			recentImages?: string[];
	  })
	| AlbumFormData;

interface AlbumCardProps {
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

const DEFAULT_ALBUM_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Sistema de diseño específico para álbumes
	designSystem: {
		preset: "album" as CardDesignPreset,
		variant: "default",
		aspectRatio: "4/5",
		cornerStyle: "rounded",
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: "soft",
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: "59, 130, 246", // Un tono azul
	secondaryColor: "96, 165, 250", // Un tono azul claro

	// Opciones de efectos
	holographicOptions: {
		patternType: "linear",
		intensity: 0.5,
		animationSpeed: 1,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 15,
		blurAmount: 10,
		animationType: "pulse",
		pulseSpeed: 1.5,
		visibleOnHover: true,
	},

	borderOptions: {
		width: 2,
		pattern: "solid",
		animationType: "pulse",
		animation: {
			type: "flow",
			duration: 3000,
			timing: "ease-in-out",
			iteration: "infinite",
		},
		glowIntensity: 0.6,
	},

	grainOptions: {
		intensity: 0.12,
		density: 0.5,
		contrast: 1.1,
		noise: "light",
		animated: false,
		visibleOnHover: true,
	},
};

export function AlbumCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualizationConfig = false,
	options,
	rarity,
	texture,
}: AlbumCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const [configOpen, setConfigOpen] = React.useState(false);
	const [cardOptions, setCardOptions] = React.useState<Partial<CardOptions>>(
		options || {
			...DEFAULT_ALBUM_OPTIONS,
			enable3DEffect: true,
			enableHolographicEffect: true,
			enableScanlines: false,
			enableLightHalo: false,
			enableGrainEffect: false,
			hoverLiftHeight: 10,
		}
	);

	// Para componente preview, detectar cambios y animar
	const prevDataRef = useRef<CardData | null>(null);

	// Calcular rareza basada en los datos del álbum
	const rarityConfig = useMemo(() => {
		// Si se proporciona una rareza inicial, usarla
		if (rarity) {
			return rarity;
		}

		// Si es un álbum con estadísticas, basamos la rareza en la cantidad de imágenes
		if ("_count" in data && data._count) {
			const imageCount = data._count.images || 0;

			// Determinar rareza según el número de imágenes
			if (imageCount > 100) {
				return generateRarityConfig("legendary", "#3b82f6");
			}
			if (imageCount > 50) {
				return generateRarityConfig("rare", "#3b82f6");
			}
			if (imageCount > 10) {
				return generateRarityConfig("uncommon", "#3b82f6");
			}
			return generateRarityConfig("common", "#3b82f6");
		}

		// Para formularios o datos sin estadísticas
		return generateRarityConfig("common", "#3b82f6");
	}, [data, rarity]);

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
			("name" in prevData && "name" in data && prevData.name !== data.name) ||
			("emoji" in prevData &&
				"emoji" in data &&
				prevData.emoji !== data.emoji) ||
			("color" in prevData && "color" in data && prevData.color !== data.color);

		if (hasChanged) {
			prevDataRef.current = { ...data };
		}
	}, [data, isPreview]);

	// Obtener la fecha de creación (si existe)
	const createdAt =
		"createdAt" in data && data.createdAt ? new Date(data.createdAt) : null;

	// Determinar tipo de energía/color según la descripción o nombre
	const determineEnergyType = () => {
		const keywords = {
			fire: ["fuego", "calor", "rojo", "llama", "caliente", "verano"],
			water: ["agua", "azul", "mar", "océano", "río", "líquido", "frío"],
			electric: ["eléctrico", "amarillo", "rayo", "energía", "poder"],
			grass: ["hierba", "verde", "planta", "naturaleza", "bosque", "jardín"],
			psychic: ["psíquico", "morado", "mente", "mental", "magia"],
			fighting: ["lucha", "combate", "naranja", "fuerza", "poder"],
			dark: ["oscuro", "negro", "noche", "sombra", "oscuridad"],
			metal: ["metal", "gris", "acero", "hierro", "plata"],
			fairy: ["hada", "rosa", "encanto", "fantasía", "mágico"],
			dragon: ["dragón", "místico", "antiguo", "fuerte"],
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
		return "normal";
	};

	// Determinar el color y gradiente según el tipo de energía
	const energyType = determineEnergyType();
	const energyColors = {
		fire: {
			gradient: "from-red-500 to-orange-600",
			textColor: "text-orange-50",
			symbolColor: "text-yellow-300",
			iconBg: "bg-red-600",
		},
		water: {
			gradient: "from-blue-500 to-cyan-600",
			textColor: "text-blue-50",
			symbolColor: "text-cyan-200",
			iconBg: "bg-blue-600",
		},
		electric: {
			gradient: "from-yellow-400 to-amber-500",
			textColor: "text-amber-50",
			symbolColor: "text-yellow-200",
			iconBg: "bg-yellow-500",
		},
		grass: {
			gradient: "from-green-500 to-emerald-600",
			textColor: "text-green-50",
			symbolColor: "text-emerald-200",
			iconBg: "bg-green-600",
		},
		psychic: {
			gradient: "from-purple-500 to-violet-600",
			textColor: "text-purple-50",
			symbolColor: "text-violet-200",
			iconBg: "bg-purple-600",
		},
		fighting: {
			gradient: "from-orange-500 to-red-600",
			textColor: "text-orange-50",
			symbolColor: "text-red-200",
			iconBg: "bg-orange-600",
		},
		dark: {
			gradient: "from-gray-700 to-slate-900",
			textColor: "text-gray-200",
			symbolColor: "text-gray-400",
			iconBg: "bg-slate-800",
		},
		metal: {
			gradient: "from-gray-400 to-slate-600",
			textColor: "text-gray-100",
			symbolColor: "text-gray-300",
			iconBg: "bg-gray-500",
		},
		fairy: {
			gradient: "from-pink-400 to-rose-500",
			textColor: "text-pink-50",
			symbolColor: "text-pink-200",
			iconBg: "bg-pink-500",
		},
		dragon: {
			gradient: "from-indigo-500 to-blue-700",
			textColor: "text-indigo-50",
			symbolColor: "text-blue-200",
			iconBg: "bg-indigo-600",
		},
		normal: {
			gradient: "from-gray-300 to-slate-400",
			textColor: "text-gray-800",
			symbolColor: "text-gray-600",
			iconBg: "bg-gray-400",
		},
	};

	const colors =
		energyColors[energyType as keyof typeof energyColors] ||
		energyColors.normal;

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
				className={cn(`bg-gradient-to-b ${colors.gradient}`, className)}
				options={cardOptions}
				entityType="album"
				rarity={rarityConfig}
				texture={texture}
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
							<div className="w-3 h-3 bg-gradient-to-tr from-cyan-400 to-teal-300 opacity-60" />
						),
					},
					{
						id: "grain",
						label: "Textura",
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
				{/* Estructura de la carta de energía */}
				<div className="flex flex-col h-full p-4 relative">
					{/* Header con nombre y tipo */}
					<div className="mb-2 flex justify-between items-center">
						<h3 className={`text-lg font-bold ${colors.textColor}`}>
							{"name" in data && data.name}
						</h3>

						<div
							className={`flex items-center justify-center ${colors.iconBg} w-8 h-8 rounded-full`}
						>
							<Images className={`h-4 w-4 ${colors.textColor}`} />
						</div>
					</div>

					{/* Imagen principal */}
					<div className="relative flex-1 overflow-hidden mb-3 rounded-md bg-black/20">
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
										alt={"name" in data ? data.name || "Álbum" : "Álbum"}
										className="object-cover h-full w-full transition-transform duration-700"
										width={300}
										height={400}
										style={{
											objectFit: "cover",
											transform: isHovered ? "scale(1.05)" : "scale(1)",
										}}
									/>
								) : (
									<div className="flex items-center justify-center h-full bg-black/10">
										<ImageIcon
											className={`h-12 w-12 ${colors.symbolColor} opacity-50`}
										/>
									</div>
								)}
							</>
						)}

						{/* Símbolo de energía superpuesto */}
						<div
							className={`absolute bottom-2 right-2 ${colors.symbolColor} opacity-60`}
						>
							<motion.div
								animate={{
									opacity: [0.6, 0.9, 0.6],
									scale: [1, 1.05, 1],
								}}
								transition={{
									duration: 3,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
							>
								{energyType === "fire" && <Star className="h-8 w-8" />}
								{energyType === "water" && <BookOpen className="h-8 w-8" />}
								{energyType === "electric" && (
									<ArrowUpRight className="h-8 w-8" />
								)}
								{energyType === "grass" && <ImageIcon className="h-8 w-8" />}
								{energyType === "psychic" && <Star className="h-8 w-8" />}
								{energyType === "fighting" && (
									<ArrowUpRight className="h-8 w-8" />
								)}
								{energyType === "dark" && <Star className="h-8 w-8" />}
								{energyType === "metal" && <ArrowUpRight className="h-8 w-8" />}
								{energyType === "fairy" && <Star className="h-8 w-8" />}
								{energyType === "dragon" && (
									<ArrowUpRight className="h-8 w-8" />
								)}
								{energyType === "normal" && <ImageIcon className="h-8 w-8" />}
							</motion.div>
						</div>
					</div>

					{/* Información del álbum */}
					<div className={`mt-auto ${colors.textColor}`}>
						<p className="text-sm font-semibold mb-1">
							{"_count" in data && data._count ? data._count.images : 0}{" "}
							{"_count" in data && data._count && data._count.images === 1
								? "imagen"
								: "imágenes"}
						</p>

						{!isPreview && createdAt && (
							<div className="flex items-center text-xs opacity-80">
								<Calendar className="h-3 w-3 mr-1" />
								{createdAt.toLocaleDateString()}
							</div>
						)}

						{"description" in data && data.description && (
							<p
								className={`text-xs mt-2 line-clamp-2 ${colors.textColor} opacity-90`}
							>
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
