"use client";

import type { CardOptions } from "@/app/actions/entities-cards/entities-cards.actions";
import { BaseCard } from "@/components/features/entity-cards/base/base-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import {
	ArrowUpRight,
	CalendarClock,
	Clock,
	Grid2X2,
	HardDrive,
	ImageIcon,
	Layers,
	Sparkles,
	Star,
} from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";

// Define los tipos de rareza con sus estilos visuales
const RARITY_TYPES = {
	common: {
		color: "from-slate-500/20 to-gray-600/20",
		border: "border-slate-500/70",
		label: "Común",
		badgeClass: "bg-gradient-to-r from-slate-500 to-gray-500",
		barClass: "bg-gradient-to-r from-slate-500 to-gray-500",
	},
	uncommon: {
		color: "from-emerald-500/20 to-teal-600/20",
		border: "border-emerald-500/70",
		label: "Poco común",
		badgeClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
		barClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
	},
	rare: {
		color: "from-blue-500/20 to-sky-600/20",
		border: "border-blue-500/70",
		label: "Raro",
		badgeClass: "bg-gradient-to-r from-blue-500 to-sky-500",
		barClass: "bg-gradient-to-r from-blue-500 to-cyan-500",
	},
	epic: {
		color: "from-violet-500/20 to-purple-600/20",
		border: "border-violet-500/70",
		label: "Épico",
		badgeClass: "bg-gradient-to-r from-violet-500 to-purple-500",
		barClass: "bg-gradient-to-r from-violet-500 to-purple-500",
	},
	legendary: {
		color: "from-amber-500/20 to-yellow-600/20",
		border: "border-amber-500/70",
		label: "Legendario",
		badgeClass: "bg-gradient-to-r from-amber-500 to-yellow-500",
		barClass: "bg-gradient-to-r from-amber-500 to-yellow-500",
	},
	mythic: {
		color: "from-orange-600/20 to-red-600/20",
		border: "border-orange-500/70",
		label: "Mítico",
		badgeClass: "bg-gradient-to-r from-orange-500 to-red-500",
		barClass: "bg-gradient-to-r from-red-500 to-orange-500",
	},
};

interface EntityCardPreviewProps {
	entityType: string;
	entityName: string;
	cardOptions: CardOptions;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	className?: string;
}

export function EntityCardPreview({
	entityType,
	entityName,
	cardOptions,
	showVisualConfig = false,
	onVisualConfigClick,
	className,
}: EntityCardPreviewProps) {
	// Estado y referencias
	const [isHovered, setIsHovered] = React.useState(false);

	// Valores asignados para la vista previa
	const rarityType = React.useMemo(() => {
		// Valores por defecto para la vista previa
		const rarityValues: Record<string, string> = {
			album: "rare",
			tag: "uncommon",
			collection: "legendary",
			character: "epic",
			place: "mythic",
			worldItem: "rare",
			concept: "uncommon",
			prompt: "common",
			note: "common",
		};

		return (
			RARITY_TYPES[rarityValues[entityType] as keyof typeof RARITY_TYPES] ||
			RARITY_TYPES.common
		);
	}, [entityType]);

	// Propiedades para la vista previa
	const createdAt = new Date().toISOString();
	const totalItems = Math.floor(Math.random() * 100) + 1;
	const power = Math.floor(Math.random() * 12) + 1;
	const folderAge = "15d";
	const totalSize = Math.floor(Math.random() * 1024 * 1024 * 100);

	// Preparamos los datos para la rareza si está habilitada
	const rarityConfig = cardOptions.raritySystem
		? {
				name: rarityType.label,
				color: rarityType.border.replace("border-", "").replace("/70", ""),
				borderEffect:
					rarityType.label === "Legendario" || rarityType.label === "Mítico"
						? "animated"
						: undefined,
				glowColor:
					rarityType.label === "Legendario" || rarityType.label === "Mítico"
						? "#f97316"
						: undefined,
			}
		: undefined;

	// Preparamos datos para la textura si está habilitada
	const textureConfig = cardOptions.textureSystem
		? {
				name: "Holográfico",
				patternType:
					"linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)",
				color: "#8a2be2",
				opacity: 0.5,
			}
		: undefined;

	// Configuración completa de la tarjeta
	const completeCardOptions = {
		...cardOptions,
		rarity: rarityConfig,
		texture: textureConfig,
	};

	return (
		<BaseCard
			className={cn(
				"w-full aspect-[7/10]", // Proporción ajustada para mejor visualización
				"rounded-xl", // Bordes más redondeados
				className
			)}
			options={completeCardOptions}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			showVisualizationConfig={showVisualConfig}
			onVisualizationConfigClick={onVisualConfigClick}
			enableExplode={true}
			explodeLayers={[
				{
					id: "content",
					label: "Contenido",
					icon: <div className="w-3 h-3 bg-primary rounded-sm" />,
				},
				{
					id: "scanlines",
					label: "Líneas",
					icon: (
						<div className="w-3 h-3 bg-slate-200 flex flex-col justify-between">
							<div className="h-[1px] bg-slate-400" />
							<div className="h-[1px] bg-slate-400" />
						</div>
					),
				},
				{
					id: "holographic",
					label: "Efecto Holo",
					icon: (
						<div className="w-3 h-3 bg-gradient-to-tr from-purple-400 to-blue-300 opacity-60" />
					),
				},
				{
					id: "grain",
					label: "Textura",
					icon: <div className="w-3 h-3 bg-slate-400 opacity-50 rounded-sm" />,
				},
				{
					id: "border",
					label: "Borde",
					icon: <div className="w-3 h-3 border border-primary rounded-sm" />,
				},
				{
					id: "filter",
					label: "Filtro SVG",
					icon: <div className="w-3 h-3 bg-blue-300 rounded-full opacity-60" />,
				},
			]}
		>
			{/* Diseño inspirado en cartas coleccionables - contenedor con posicionamiento relativo */}
			<div className="relative h-full flex flex-col">
				{/* Nombre de la entidad en franja superior con insignia de rareza */}
				<div className="relative px-3 py-2 bg-background/80 backdrop-blur-md shadow-sm border-b border-border z-10">
					<div className="flex items-center gap-1.5">
						<Grid2X2 className="h-4 w-4 text-primary" />
						<h3 className="font-bold text-base leading-tight line-clamp-1">
							{entityName}
						</h3>

						{cardOptions.raritySystem && (
							<div
								className={cn(
									"px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white",
									rarityType.badgeClass
								)}
							>
								{rarityType.label}
							</div>
						)}

						<Star className="h-4 w-4 text-amber-400 ml-auto" />
					</div>
					<div className="text-xs font-medium text-muted-foreground flex items-center justify-between mt-0.5">
						<span>Entidad</span>
						<div className="flex items-center gap-1">
							<span className="text-[10px] font-medium">
								{totalItems} items
							</span>
							{cardOptions.raritySystem && (
								<div
									className={cn("w-2 h-2 rounded-full", rarityType.badgeClass)}
								/>
							)}
						</div>
					</div>
				</div>

				{/* Área de ilustración */}
				<div className="flex-1 relative">
					<div className="grid grid-cols-3 grid-rows-3 gap-1 p-2 h-full">
						{Array.from({ length: 9 }).map((_, i) => (
							<div
								key={`entity-image-${entityType}-${i}-${Math.random().toString(36).substring(2, 7)}`}
								className="relative rounded overflow-hidden aspect-square"
							>
								<div
									className={cn(
										"w-full h-full flex items-center justify-center",
										rarityType.badgeClass
									)}
								>
									<ImageIcon className="w-3 h-3 text-white/90" />
								</div>
							</div>
						))}
					</div>

					{/* Fecha de creación como overlay */}
					<div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs flex items-center gap-1 z-10">
						<Clock className="h-3 w-3" />
						<span>{new Date(createdAt).toLocaleDateString()}</span>
					</div>
				</div>

				{/* Panel inferior con información */}
				<div className="text-xs border-t border-b border-border bg-background/80 backdrop-blur-sm py-1.5 px-3">
					<div className="font-semibold mb-0.5 flex items-center text-[10px] uppercase tracking-wider text-muted-foreground">
						Tipo
					</div>
					<p className="font-mono text-[10px] truncate">{entityType}</p>
				</div>

				{/* Área de estadísticas inferior */}
				<div className="bg-background/90 backdrop-blur-md p-3 flex flex-col gap-2">
					{/* Estadísticas principales en grid */}
					<div className="grid grid-cols-3 gap-3">
						<div className="flex flex-col items-center">
							<div className="text-2xl font-bold">{totalItems}</div>
							<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
								<Layers className="h-3 w-3" />
								Items
							</div>
						</div>
						<div className="flex flex-col items-center">
							<div className="text-2xl font-bold">{folderAge}</div>
							<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
								<CalendarClock className="h-3 w-3" />
								Edad
							</div>
						</div>
						<div className="flex flex-col items-center">
							<div className="text-2xl font-bold">
								{Math.floor(totalSize / 1024)} KB
							</div>
							<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
								<HardDrive className="h-3 w-3" />
								Tamaño
							</div>
						</div>
					</div>

					{/* Barra de poder */}
					<div className="mt-1 flex items-center justify-between">
						<div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
							<div
								className={cn("h-full rounded-full", rarityType.barClass)}
								style={{ width: `${(power / 12) * 100}%` }}
							/>
						</div>
						<div className="ml-2 text-xs font-semibold">{power}/12</div>
					</div>
				</div>

				{/* Botón de explorar en hover */}
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
			</div>
		</BaseCard>
	);
}
