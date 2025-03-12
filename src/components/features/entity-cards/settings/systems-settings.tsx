"use client";

import type {
	RaritySystem,
	TextureSystem,
} from "@/app/actions/entities-cards/entities-cards.actions";
import type {
	RarityConfig,
	TextureConfig,
} from "@/components/features/entity-cards/base/base-card-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { TextureManager } from "../tools/texture-manager";
import type { CardOptions, SystemSettingsProps } from "./card-settings-types";
import { RarityManager } from "./rarity-manager";

// Extendemos la interfaz para incluir las propiedades que faltan
interface ExtendedSystemSettingsProps extends SystemSettingsProps {
	onRaritySystemChange?: (raritySystem: RaritySystem) => void;
	onTextureSystemChange?: (textureSystem: TextureSystem) => void;
	raritySystem?: RaritySystem;
	textureSystem?: TextureSystem;
}

export function SystemsSettings({
	cardOptions,
	entityType,
	onCardOptionsChange,
	onRarityChange,
	onTextureChange,
	onRaritySystemChange,
	onTextureSystemChange,
	raritySystem,
	textureSystem,
}: ExtendedSystemSettingsProps) {
	// Estado para almacenar localmente la referencia a los sistemas
	const [currentTextureSystem, setCurrentTextureSystem] = useState<
		TextureSystem | undefined
	>(textureSystem);
	const [currentRaritySystem, setCurrentRaritySystem] = useState<
		RaritySystem | undefined
	>(raritySystem);

	// Actualizar el estado local cuando cambian las props
	useEffect(() => {
		if (textureSystem) {
			setCurrentTextureSystem(textureSystem);
		}
	}, [textureSystem]);

	useEffect(() => {
		if (raritySystem) {
			setCurrentRaritySystem(raritySystem);
		}
	}, [raritySystem]);

	// Manejador para cambios en opciones individuales
	const handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	// Manejador para cambios en el sistema de rarezas
	const handleRaritySystemChange = (enabled: boolean) => {
		// Actualizar la opción en cardOptions
		handleOptionChange("raritySystem", enabled);

		// Si se proporcionó un manejador específico, llamarlo también
		if (onRaritySystemChange) {
			onRaritySystemChange({
				enabled,
				// Preservamos las rarezas existentes
				rarities: currentRaritySystem?.rarities || [],
			});
		}
	};

	// Manejador para cambios en el sistema de texturas
	const handleTextureSystemChange = (enabled: boolean) => {
		// Actualizar la opción en cardOptions
		handleOptionChange("textureSystem", enabled);

		// Si se proporcionó un manejador específico, llamarlo también
		if (onTextureSystemChange) {
			// Al desactivar, mantenemos las texturas existentes para no perderlas
			onTextureSystemChange({
				enabled,
				// Si tenemos textureSystem previo, preservamos sus texturas
				textures: currentTextureSystem?.textures || [],
			});
		}
	};

	// Manejador para actualizar sistemas completos
	const handleTextureSystemUpdate = (newTextureSystem: TextureSystem) => {
		setCurrentTextureSystem(newTextureSystem);
		if (onTextureSystemChange) {
			onTextureSystemChange(newTextureSystem);
		}
	};

	const handleRaritySystemUpdate = (newRaritySystem: RaritySystem) => {
		setCurrentRaritySystem(newRaritySystem);
		if (onRaritySystemChange) {
			onRaritySystemChange(newRaritySystem);
		}
	};

	return (
		<Card className="border border-border/40 shadow-sm">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-1.5">
					<Settings2 className="h-4 w-4 text-primary" />
					Sistemas
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 space-y-4">
				{/* Sistema de Rarezas */}
				<div className="space-y-4">
					<div className="flex items-center justify-between space-x-3">
						<Label
							htmlFor="raritySystem"
							className="text-sm flex items-center cursor-pointer gap-2"
						>
							Sistema de Rarezas
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
										Clasifica las tarjetas por niveles de rareza
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Switch
							id="raritySystem"
							checked={cardOptions.raritySystem}
							onCheckedChange={handleRaritySystemChange}
						/>
					</div>

					{cardOptions.raritySystem && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
						>
							<Card className="border border-border/40">
								<CardContent className="p-3">
									<RarityManager
										entityType={entityType}
										onRaritySelect={(rarity) => {
											if (onRarityChange) {
												onRarityChange(rarity as RarityConfig);
											}
										}}
										onRaritiesChange={handleRaritySystemUpdate}
									/>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</div>

				{/* Sistema de Texturas */}
				<div className="space-y-4">
					<div className="flex items-center justify-between space-x-3">
						<Label
							htmlFor="textureSystem"
							className="text-sm flex items-center cursor-pointer gap-2"
						>
							Sistema de Texturas
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
										Aplica diferentes texturas a las tarjetas
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Switch
							id="textureSystem"
							checked={cardOptions.textureSystem}
							onCheckedChange={handleTextureSystemChange}
						/>
					</div>

					{cardOptions.textureSystem && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
						>
							<Card className="border border-border/40">
								<CardContent className="p-3">
									<TextureManager
										entityType={entityType}
										onTextureSelect={(texture) => {
											if (onTextureChange) {
												onTextureChange(texture as TextureConfig);
											}
										}}
										onTexturesChange={handleTextureSystemUpdate}
									/>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</div>

				{/* Sistema de Categorías */}
				<div className="flex items-center justify-between space-x-3">
					<Label
						htmlFor="categorySystem"
						className="text-sm flex items-center cursor-pointer gap-2"
					>
						Sistema de Categorías
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="h-3 w-3 text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent className="text-xs max-w-xs">
									Organiza las tarjetas por categorías
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</Label>
					<Switch
						id="categorySystem"
						checked={cardOptions.categorySystem}
						onCheckedChange={(checked) =>
							handleOptionChange("categorySystem", checked)
						}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
