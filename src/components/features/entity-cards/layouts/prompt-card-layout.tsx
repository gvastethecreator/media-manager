"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import type { Prompt } from "@prisma/client";
import {
	ArrowUpRight,
	Clock,
	MessageSquare,
	Pencil,
	ScrollText,
	Sparkles,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { EntityCardWrapper } from "../base/entity-card-wrapper";
import type { PromptFormData } from "../forms/entity-types";
import { VisualizationConfig } from "../config/visualization-config";
import type { CardDesignPreset, CardOptions } from "../types/base-card-types";

type CardData = Prompt | PromptFormData;

// Opciones visuales optimizadas para tarjetas de prompts inspiradas en Magic the Gathering
const DEFAULT_PROMPT_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño específico para prompts
	designSystem: {
		preset: "prompt" as CardDesignPreset,
		variant: "default",
		aspectRatio: "3/4", // Proporción similar a Magic
		cornerStyle: "rounded" as "rounded" | "sharp" | "beveled",
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: "soft" as "soft" | "none" | "hard" | "layered",
	},

	// Configuración de movimiento
	hoverLiftHeight: 8,
	maxRotation: 12,
	primaryColor: "80, 70, 180", // Tonos de azul/violeta para prompts
	secondaryColor: "120, 90, 220",

	// Opciones de efectos
	holographicOptions: {
		patternType: "rainbow",
		intensity: 0.5,
		animationSpeed: 1.2,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.8,
		size: 15,
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

// Sistema de rareza basado en la complejidad y extensión del prompt
const PROMPT_RARITY = {
	legendary: {
		color: "#ff9d00",
		borderWidth: "2px",
		borderEffect: "animated",
		label: "Legendario",
	},
	epic: {
		color: "#a335ee",
		borderWidth: "2px",
		borderEffect: "static",
		label: "Épico",
	},
	rare: {
		color: "#0070dd",
		borderWidth: "1px",
		borderEffect: "static",
		label: "Raro",
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

// Determinar la rareza basada en la extensión y complejidad
function determinePromptRarity(
	content?: string,
	category?: string
): keyof typeof PROMPT_RARITY {
	if (!content) {
		return "common";
	}

	// Criterios de evaluación
	const length = content.length;
	const hasParameters = content.includes("{{") && content.includes("}}");
	const isAdvanced = category === "AI" || category === "desarrollo";

	if (length > 500 && hasParameters && isAdvanced) {
		return "legendary";
	}
	if (length > 300 && hasParameters) {
		return "epic";
	}
	if (length > 200 || hasParameters) {
		return "rare";
	}
	if (length > 100) {
		return "uncommon";
	}
	return "common";
}

interface PromptCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	className?: string;
	showVisualizationConfig?: boolean;
	options?: Partial<typeof DEFAULT_PROMPT_OPTIONS>;
	onClick?: () => void;
}

export function PromptCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	className,
	showVisualizationConfig = false,
	options,
	onClick,
}: PromptCardProps) {
	// Para componente preview, detectar cambios
	const prevDataRef = useRef<CardData | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const [showContent, setShowContent] = useState(false);
	const [isHighlighted, setIsHighlighted] = useState(false);
	const [configOpen, setConfigOpen] = useState(false);
	const [cardOptions, setCardOptions] = useState({
		...DEFAULT_PROMPT_OPTIONS,
		...options,
	});

	// Efecto para destacar cambios en modo preview
	useEffect(() => {
		if (isPreview && prevDataRef.current) {
			const hasChanged =
				JSON.stringify(prevDataRef.current) !== JSON.stringify(data);
			if (hasChanged) {
				setIsHighlighted(true);
				const timer = setTimeout(() => {
					setIsHighlighted(false);
				}, 2000);
				return () => clearTimeout(timer);
			}
		}
		prevDataRef.current = data;
	}, [data, isPreview]);

	const toggleContent = () => setShowContent(!showContent);

	// Determinar la rareza
	const contentStr =
		"content" in data && typeof data.content === "string" ? data.content : "";
	const categoryStr =
		"category" in data && typeof data.category === "string"
			? data.category
			: "";
	const rarityKey = determinePromptRarity(contentStr, categoryStr);
	const rarityConfig = {
		name: rarityKey,
		color: PROMPT_RARITY[rarityKey].color,
		borderWidth: PROMPT_RARITY[rarityKey].borderWidth,
		borderEffect: PROMPT_RARITY[rarityKey].borderEffect,
		glowColor:
			rarityKey === "legendary"
				? "#ff9d00"
				: rarityKey === "epic"
					? "#a335ee"
					: undefined,
	};

	// Color basado en categoría para el fondo
	const categoryColor = {
		AI: "bg-gradient-to-b from-purple-800 to-purple-950",
		imagen: "bg-gradient-to-b from-blue-800 to-blue-950",
		desarrollo: "bg-gradient-to-b from-emerald-800 to-emerald-950",
		general: "bg-gradient-to-b from-amber-800 to-amber-950",
		default: "bg-gradient-to-b from-slate-800 to-slate-950",
	}[
		"category" in data && typeof data.category === "string"
			? data.category
			: "default"
	];

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
				className={cn(
					categoryColor,
					isHighlighted && "ring-2 ring-orange-400",
					className
				)}
				options={cardOptions}
				entityType="prompt"
				rarity={rarityConfig}
				onClick={onClick}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				showVisualizationConfig={showVisualizationConfig}
				onVisualizationConfigClick={() => setConfigOpen(true)}
			>
				{/* Estructura de la carta estilo TCG */}
				<div className="flex flex-col h-full p-3">
					{/* Franja superior con nombre y coste */}
					<div className="flex justify-between items-center mb-2 border-b border-white/20 pb-2">
						<div className="flex items-center gap-1">
							<h3 className="text-base font-bold text-white">
								{"name" in data && data.name}
							</h3>
						</div>

						{/* "Coste de mana" representado por la complejidad */}
						<div className="flex items-center justify-center bg-blue-500 text-white w-7 h-7 rounded-full font-bold">
							{contentStr.length > 500
								? "6"
								: contentStr.length > 300
									? "5"
									: contentStr.length > 200
										? "4"
										: contentStr.length > 100
											? "3"
											: "2"}
						</div>
					</div>

					{/* Área de ilustración/tipo */}
					<div className="flex-none bg-gray-800/60 rounded-md border border-gray-700 p-2 mb-3">
						{/* Categoría/tipo */}
						<div className="flex items-center gap-1 text-xs text-gray-300 mb-1">
							{"category" in data && data.category ? (
								<span className="px-2 py-0.5 bg-indigo-900/70 text-indigo-100 rounded-full">
									{data.category}
								</span>
							) : (
								<span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
									General
								</span>
							)}
							{"emoji" in data && data.emoji && (
								<span className="ml-1">{data.emoji}</span>
							)}
							<span className="ml-auto text-[10px] text-gray-400">
								{PROMPT_RARITY[rarityKey].label}
							</span>
						</div>

						{/* Ícono ilustrativo */}
						<div className="flex items-center justify-center my-2">
							<div className="w-16 h-16 rounded-full bg-gradient-to-b from-indigo-700/30 to-indigo-900/30 flex items-center justify-center">
								<MessageSquare className="h-8 w-8 text-indigo-300" />
							</div>
						</div>
					</div>

					{/* "Texto de habilidad" - Contenido del prompt */}
					<div className="flex-1 bg-gray-900/70 rounded-md border border-gray-800 p-2 mb-2 overflow-y-auto">
						{"content" in data && data.content && (
							<div
								className={cn(
									"p-2 text-xs text-gray-300 font-mono",
									!showContent && "line-clamp-5 max-h-20"
								)}
							>
								{data.content}
								{data.content.length > 150 && (
									<Button
										variant="link"
										className="p-0 h-auto text-xs text-indigo-300 mt-1"
										onClick={() => {
											toggleContent();
										}}
									>
										{showContent ? "Ver menos" : "Ver más"}
									</Button>
								)}
							</div>
						)}
					</div>

					{/* Parámetros */}
					{"parameters" in data && data.parameters && (
						<div className="mb-2 bg-gray-900/70 rounded-md border border-gray-800 p-2">
							<div className="text-xs font-bold mb-1 text-gray-400">
								Parámetros
							</div>
							<pre className="text-[10px] overflow-auto max-h-20 font-mono text-indigo-300">
								{data.parameters}
							</pre>
						</div>
					)}

					{/* "Stats" - Footer de la carta */}
					<div className="border-t border-white/20 pt-2 mt-auto">
						{/* Tags como "tipos de criatura" */}
						{"tags" in data &&
							data.tags &&
							Array.isArray(data.tags) &&
							data.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 mb-2">
									{data.tags.map((tag: string) => (
										<span
											key={tag}
											className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary"
										>
											{tag}
										</span>
									))}
								</div>
							)}

						{/* Info de pie de carta - artista/fecha */}
						<div className="flex justify-between items-center text-[10px] text-gray-400">
							<div className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								<span>
									{"createdAt" in data && data.createdAt
										? new Date(
												data.createdAt as unknown as string
											).toLocaleDateString()
										: "Nuevo"}
								</span>
							</div>
							<div>
								<span className="italic">Prompt</span>
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
										if ("id" in data && data.id) {
											onEdit(data.id);
										}
									}}
								>
									<Pencil className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="secondary"
									size="icon"
									className="h-8 w-8 shadow-md text-destructive"
									onClick={() => {
										if ("id" in data && data.id) {
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
