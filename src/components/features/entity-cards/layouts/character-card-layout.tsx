"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CharacterWithStats } from "@/types/character";
import { motion } from "framer-motion";
import {
	ArrowUpRight,
	Award,
	Crown,
	FlameIcon,
	Heart,
	Shield,
	Sparkles,
	Sword,
	User,
	Zap,
} from "lucide-react";
import { ImageIcon, StarIcon, UsersIcon } from "lucide-react";
import type * as React from "react";
import { useMemo } from "react";
import { generateRarityConfig } from "../base/card-adapter";
import { EntityCardWrapper } from "../base/entity-card-wrapper";
import type {
	CardDesignData,
	CardDesignPreset,
	CardOptions,
	RarityConfig,
	TextureConfig,
} from "../types/base-card-types";
import { ImageGrid } from "./image-grid";

interface CharacterCardProps {
	character: CardDesignData;
	showStats?: boolean;
	showMetadata?: boolean;
	className?: string;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
	showVisualizationConfig?: boolean;
	enableExplode?: boolean;
}

// Eliminar la función isFormData y agregar DEFAULT_CHARACTER_OPTIONS
const DEFAULT_CHARACTER_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Sistema de diseño específico para personajes
	designSystem: {
		preset: "character" as CardDesignPreset,
		variant: "default",
		aspectRatio: "3/4",
		cornerStyle: "rounded",
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: "soft",
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: "236, 72, 153", // Un tono rosa
	secondaryColor: "244, 114, 182", // Un tono rosa claro

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

export function CharacterCard({
	character,
	showStats = true,
	showMetadata = true,
	className,
	options,
	rarity,
	texture,
	onClick,
	onHoverStart,
	onHoverEnd,
	showVisualizationConfig = false,
	enableExplode = false,
}: CharacterCardProps) {
	// Inicializar opciones con valores por defecto
	const cardOptions = {
		...DEFAULT_CHARACTER_OPTIONS,
		...options,
	};

	// Obtener estadísticas del personaje o valores por defecto
	const stats = character.characterInfo?.stats || {
		strength: 5,
		dexterity: 5,
		intelligence: 5,
		charisma: 5,
		vitality: 5,
	};

	// Obtener color basado en la clase del personaje
	const getClassColor = useMemo(() => {
		return (characterClass: string): string => {
			const classColors: Record<string, string> = {
				mago: "#8b5cf6", // Violeta
				guerrero: "#dc2626", // Rojo
				arquero: "#16a34a", // Verde
				pícaro: "#f59e0b", // Ámbar
				clérigo: "#3b82f6", // Azul
				druida: "#65a30d", // Verde oliva
				bardo: "#ec4899", // Rosa
				paladín: "#f59e0b", // Dorado
				monje: "#a855f7", // Púrpura
				hechicero: "#06b6d4", // Cian
				brujo: "#7c3aed", // Violeta oscuro
				bárbaro: "#b91c1c", // Rojo oscuro
				unknown: "#6b7280", // Gris
			};

			return classColors[characterClass.toLowerCase()] || classColors.unknown;
		};
	}, []);

	// Calcular la rareza usando la función auxiliar
	const characterRarity = useMemo(() => {
		if (rarity) {
			return rarity;
		}

		const classColor = character.characterInfo?.class
			? getClassColor(character.characterInfo.class)
			: character.color || "#3b82f6";

		return generateRarityConfig(
			character.characterInfo?.class?.toLowerCase() || "common",
			classColor
		);
	}, [rarity, character, getClassColor]);

	// Obtener icono según la estadística
	const getStatIcon = useMemo(() => {
		return (statName: string): React.ReactNode => {
			const icons: Record<string, React.ReactNode> = {
				strength: <Sword className="h-3.5 w-3.5" />,
				dexterity: <Zap className="h-3.5 w-3.5" />,
				intelligence: <Sparkles className="h-3.5 w-3.5" />,
				charisma: <Crown className="h-3.5 w-3.5" />,
				vitality: <Heart className="h-3.5 w-3.5" />,
				defense: <Shield className="h-3.5 w-3.5" />,
				power: <FlameIcon className="h-3.5 w-3.5" />,
			};

			return icons[statName.toLowerCase()] || <Award className="h-3.5 w-3.5" />;
		};
	}, []);

	return (
		<EntityCardWrapper
			className={cn("w-full h-full overflow-hidden", className)}
			options={{
				...cardOptions,
				primaryColor: characterRarity.color,
				secondaryColor: characterRarity.color,
			}}
			entityType="character"
			rarity={characterRarity}
			texture={texture}
			onClick={onClick}
			onHoverStart={onHoverStart}
			onHoverEnd={onHoverEnd}
			showVisualizationConfig={showVisualizationConfig}
			enableExplode={enableExplode}
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
			<div className="flex flex-col h-full">
				{/* Cabecera con nombre y clase */}
				<div className="p-3 pt-2 relative">
					<div className="flex items-center gap-2 mb-0.5">
						<div
							className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border-2"
							style={{ borderColor: characterRarity.color }}
						>
							{character.emoji ? (
								<span className="text-lg">{character.emoji}</span>
							) : (
								<User className="h-4 w-4" />
							)}
						</div>
						<div className="flex-1">
							<h3 className="font-bold text-base line-clamp-1 card-title">
								{character.name || "Personaje sin nombre"}
							</h3>
							<div className="flex items-center gap-1 text-xs text-muted-foreground card-meta">
								<span>
									{character.characterInfo?.class || "Clase desconocida"}
								</span>
								•<span>Nvl. {character.characterInfo?.level || 1}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Imagen o avatar del personaje */}
				<div className="relative flex-1 min-h-[150px] bg-muted/20">
					{cardOptions.useImageGrid ? (
						<ImageGrid
							layout={cardOptions.imageGridLayout || "single"}
							gap={cardOptions.imageGridGap || 4}
							style={cardOptions.imageGridStyle || "standard"}
							images={[
								{
									id: "character-image",
									path: character.featuredImage || "",
									thumbnail: character.featuredImage || "",
								},
							]}
						/>
					) : (
						<>
							{character.featuredImage ? (
								<img
									src={character.featuredImage}
									alt={character.name || "Personaje"}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background/20 to-background/40">
									<User className="h-12 w-12 opacity-20" />
								</div>
							)}
						</>
					)}

					{/* Insignia de raza y alineamiento */}
					<div className="absolute bottom-2 left-2 flex gap-1">
						<Badge
							variant="secondary"
							className="bg-background/80 backdrop-blur-sm text-xs py-0.5"
						>
							{character.characterInfo?.race || "Raza desconocida"}
						</Badge>
						{character.characterInfo?.alignment && (
							<Badge
								variant="outline"
								className="bg-background/80 backdrop-blur-sm text-xs py-0.5"
							>
								{character.characterInfo.alignment}
							</Badge>
						)}
					</div>
				</div>

				{/* Estadísticas */}
				{showStats && (
					<div className="p-3 bg-background/90 backdrop-blur-sm border-t border-border">
						<div className="text-xs font-semibold uppercase tracking-wider mb-2 card-meta flex items-center">
							<span>Estadísticas</span>
							<ArrowUpRight className="h-3 w-3 ml-1" />
						</div>
						<div className="grid grid-cols-2 gap-x-4 gap-y-1">
							{Object.entries(stats).map(([statName, value]) => (
								<div
									key={statName}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-1.5">
										{getStatIcon(statName)}
										<span className="text-xs capitalize card-body">
											{statName}
										</span>
									</div>
									<div
										className="font-bold text-sm card-body"
										style={{ color: characterRarity.color }}
									>
										{value}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Descripción o metadata */}
				{showMetadata && character.description && (
					<div className="p-3 pt-2 border-t border-border text-xs card-body line-clamp-3">
						{character.description}
					</div>
				)}
			</div>
		</EntityCardWrapper>
	);
}
