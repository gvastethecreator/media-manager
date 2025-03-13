"use client";

import { BaseCard } from "@/components/features/entity-cards/base/base-card";
import { VisualizationConfig } from "@/components/features/entity-cards/config/visualization-config";
import type {
	CardDesignData,
	CardDesignPreset,
	CardOptions,
	RarityConfig,
	TextureConfig,
} from "@/components/features/entity-cards/types/base-card-types";
import { cn } from "@/lib/utils";
import { NoteWithStats } from "@/types/note";
import type { Note } from "@prisma/client";
import { Edit, ScrollText, StickyNote, Trash2 } from "lucide-react";
import { ImageIcon, StarIcon, UsersIcon } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { useState } from "react";
import { EntityCardWrapper } from "../base/entity-card-wrapper";
import { ImageGrid } from "./image-grid";

// Opciones visuales optimizadas para tarjetas de notas
const DEFAULT_NOTE_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Sistema de diseño específico para notas
	designSystem: {
		preset: "note" as CardDesignPreset,
		variant: "default",
		aspectRatio: "4/3",
		cornerStyle: "rounded",
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: "soft",
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: "168, 85, 247", // Un tono púrpura
	secondaryColor: "192, 132, 252", // Un tono púrpura claro

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

// Definición de colores por prioridad
const PRIORITY_COLORS = {
	3: {
		bg: "bg-rose-100",
		text: "text-rose-700",
		borderColor: "#e11d48",
		glowColor: "rgba(225, 29, 72, 0.6)",
	},
	2: {
		bg: "bg-amber-100",
		text: "text-amber-700",
		borderColor: "#d97706",
		glowColor: "rgba(217, 119, 6, 0.5)",
	},
	1: {
		bg: "bg-blue-100",
		text: "text-blue-700",
		borderColor: "#2563eb",
		glowColor: "rgba(37, 99, 235, 0.4)",
	},
	0: {
		bg: "bg-gray-100",
		text: "text-gray-700",
		borderColor: "#6b7280",
		glowColor: "rgba(107, 114, 128, 0.3)",
	},
};

// Interfaz para las propiedades de la tarjeta de nota
interface NoteCardProps {
	note: Note;
	onEdit?: (note: Note) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	visualOptions?: Partial<CardOptions>;
}

// Componente principal de tarjeta de nota
export function NoteCard({
	note,
	onEdit,
	onDelete,
	onClick,
	className,
	visualOptions,
}: NoteCardProps) {
	// Estado local
	const [showConfig, setShowConfig] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	// Estado para las opciones visuales
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_NOTE_OPTIONS,
		...visualOptions,
	});

	// Extraer tags si existen
	const tags = React.useMemo(() => {
		if (!note.tags) {
			return [];
		}
		return typeof note.tags === "string" ? JSON.parse(note.tags) : note.tags;
	}, [note.tags]);

	// Determinar el color de prioridad
	const priorityLevel = note.priority ?? 0;
	const priorityColor =
		priorityLevel >= 3
			? PRIORITY_COLORS[3]
			: priorityLevel >= 2
				? PRIORITY_COLORS[2]
				: priorityLevel >= 1
					? PRIORITY_COLORS[1]
					: PRIORITY_COLORS[0];

	// Determinar rareza basada en el número de imágenes
	const rarity = note._count?.images
		? note._count.images > 10
			? "legendary"
			: note._count.images > 5
				? "epic"
				: "rare"
		: "common";

	// Determinar tipo de nota basado en palabras clave
	const determineNoteType = (name: string, description: string) => {
		const keywords = {
			story: ["historia", "cuento", "relato", "narrativa"],
			concept: ["concepto", "idea", "teoría", "propuesta"],
			research: ["investigación", "estudio", "análisis", "datos"],
		};

		const text = `${name} ${description}`.toLowerCase();
		for (const [type, words] of Object.entries(keywords)) {
			if (words.some((word) => text.includes(word))) {
				return type as keyof typeof keywords;
			}
		}
		return "concept";
	};

	const noteType = determineNoteType(note.name, note.description || "");

	// Estilos específicos por tipo de nota
	const noteStyles = {
		story: {
			primaryColor: "168, 85, 247", // Púrpura
			secondaryColor: "192, 132, 252", // Púrpura claro
			texture: "gold" as TextureConfig,
		},
		concept: {
			primaryColor: "59, 130, 246", // Azul
			secondaryColor: "96, 165, 250", // Azul claro
			texture: "silver" as TextureConfig,
		},
		research: {
			primaryColor: "34, 197, 94", // Verde
			secondaryColor: "74, 222, 128", // Verde claro
			texture: "bronze" as TextureConfig,
		},
	};

	const style = noteStyles[noteType];

	return (
		<>
			{showConfig && (
				<VisualizationConfig
					options={cardOptions}
					onOptionsChange={(newOptions) => {
						setCardOptions({
							...cardOptions,
							...newOptions,
						});
					}}
					onClose={() => setShowConfig(false)}
				/>
			)}

			<EntityCardWrapper
				className={cn("group relative overflow-hidden", className)}
				options={{
					...cardOptions,
					primaryColor: style.primaryColor,
					secondaryColor: style.secondaryColor,
				}}
				entityType="note"
				rarity={rarity}
				texture={style.texture}
				onHover={() => setIsHovered(true)}
				onClick={onClick}
				enableExplode={true}
				explodeLayers={[
					{
						element: "image",
						scale: 1.1,
						opacity: 0.8,
						blur: 2,
						zIndex: 1,
					},
					{
						element: "content",
						scale: 1.05,
						opacity: 0.9,
						blur: 1,
						zIndex: 2,
					},
				]}
			>
				{/* Estructura principal de la carta de nota (inspirada en pergaminos/conocimiento de MTG) */}
				<div className="relative flex flex-col h-full text-gray-800">
					{/* Barra superior con título y prioridad */}
					<div
						className={cn(
							"relative px-3 py-2 border-b",
							priorityColor.bg,
							priorityColor.text
						)}
					>
						<div className="flex items-center justify-between">
							<h3 className="text-base font-medium truncate">{note.title}</h3>
							<div className="flex items-center space-x-1">
								{(note as unknown as { emoji: string }).emoji && (
									<span className="text-lg" role="img" aria-label="emoji">
										{(note as unknown as { emoji: string }).emoji}
									</span>
								)}
								{priorityLevel > 0 && (
									<div
										className={cn(
											"px-2 py-0.5 text-xs rounded-full",
											priorityColor.bg,
											priorityColor.text,
											"font-medium border",
											`border-${priorityColor.text.split("-")[1]}-400`
										)}
									>
										P{priorityLevel}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Área principal de la carta */}
					<div className="flex-1 flex flex-col p-3 bg-gradient-to-b from-blue-50/90 to-cyan-50/80 backdrop-blur-sm">
						{/* Categoría y status */}
						<div className="flex justify-between mb-2">
							{note.category && (
								<span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
									{note.category}
								</span>
							)}
							{note.status && (
								<span
									className={cn(
										"text-xs px-2 py-0.5 rounded-full",
										note.status.toLowerCase() === "completado" ||
											note.status.toLowerCase() === "completed"
											? "bg-green-100 text-green-800"
											: note.status.toLowerCase() === "pendiente" ||
												  note.status.toLowerCase() === "pending"
												? "bg-amber-100 text-amber-800"
												: "bg-blue-100 text-blue-800"
									)}
								>
									{note.status}
								</span>
							)}
						</div>

						{/* Imagen destacada si existe */}
						{cardOptions.useImageGrid ? (
							<ImageGrid
								layout={cardOptions.imageGridLayout || "single"}
								gap={cardOptions.imageGridGap || 4}
								style={cardOptions.imageGridStyle || "standard"}
								images={[
									{
										id: "note-image",
										path: note.featuredImage || "",
										thumbnail: note.featuredImage || "",
									},
								]}
								className="mb-3"
							/>
						) : (
							<>
								{note.featuredImage && (
									<div className="mb-3 rounded-md overflow-hidden border border-blue-200/60">
										<div
											className="w-full h-24 bg-center bg-cover"
											style={{ backgroundImage: `url(${note.featuredImage})` }}
										/>
									</div>
								)}
							</>
						)}

						{/* Contenido principal */}
						<div
							className={cn(
								"flex-1 overflow-auto mb-2 text-sm text-slate-800 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50/50",
								"max-h-24"
							)}
						>
							{note.content ? (
								<p className="line-clamp-3">{note.content}</p>
							) : (
								<p className="text-blue-500/70 italic text-sm">Sin contenido</p>
							)}
						</div>

						{/* Área de tags */}
						{tags.length > 0 && (
							<div className="py-1 mb-2 border-t border-blue-200/40">
								<div className="flex flex-wrap gap-1 mt-1">
									{tags.map((tag: string) => (
										<span
											key={`tag-${tag}`}
											className="inline-flex items-center text-xs px-2 py-0.5 bg-blue-100/80 text-blue-800 rounded-full"
										>
											#{tag}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Pie de carta con botones de acción */}
						<div className="flex items-center justify-end pt-1 border-t border-blue-200/40">
							{/* Botones de acción - solo visibles al hacer hover */}
							<div
								className={`flex space-x-1 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}
							>
								{onEdit && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onEdit(note);
										}}
										className="p-1 text-blue-700 hover:text-blue-900 rounded-full hover:bg-blue-200/60"
									>
										<Edit className="h-3.5 w-3.5" />
									</button>
								)}

								{onDelete && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onDelete(note.id);
										}}
										className="p-1 text-blue-700 hover:text-red-600 rounded-full hover:bg-blue-200/60"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</EntityCardWrapper>
		</>
	);
}
