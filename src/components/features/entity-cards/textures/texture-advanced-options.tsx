"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import React from "react";

interface TextureItem {
	id: string;
	name: string;
	imageUrl?: string;
	patternType?: string;
	color: string;
	opacity: number;
	description?: string;
	blendMode?: string;
	noiseType?: string;
	animated?: boolean;
	animationSpeed?: number;
	density?: number;
	contrast?: number;
	visibleOnHover?: boolean;
	layerOrder?: number;
	scale?: number;
}

interface TextureAdvancedOptionsProps {
	texture: TextureItem | null;
	onTextureChange: (updated: Partial<TextureItem>) => void;
}

export function TextureAdvancedOptions({
	texture,
	onTextureChange,
}: TextureAdvancedOptionsProps) {
	if (!texture) {
		return null;
	}

	const handleBlendModeChange = (value: string) => {
		onTextureChange({ blendMode: value });
	};

	const handleAnimatedChange = (checked: boolean) => {
		onTextureChange({ animated: checked });
	};

	const handleAnimationSpeedChange = (values: number[]) => {
		onTextureChange({ animationSpeed: values[0] });
	};

	const handleVisibleOnHoverChange = (checked: boolean) => {
		onTextureChange({ visibleOnHover: checked });
	};

	const handleNoiseTypeChange = (value: string) => {
		onTextureChange({ noiseType: value });
	};

	const handleDensityChange = (values: number[]) => {
		onTextureChange({ density: values[0] });
	};

	const handleContrastChange = (values: number[]) => {
		onTextureChange({ contrast: values[0] });
	};

	const handleLayerOrderChange = (values: number[]) => {
		onTextureChange({ layerOrder: values[0] });
	};

	const handleScaleChange = (values: number[]) => {
		onTextureChange({ scale: values[0] });
	};

	return (
		<div className="grid gap-4 pt-2 border-t">
			<h4 className="text-sm font-medium">Opciones avanzadas</h4>

			{/* Modo de mezcla */}
			<div className="space-y-2">
				<Label htmlFor="blend-mode">Modo de mezcla</Label>
				<Select
					value={texture.blendMode || "normal"}
					onValueChange={handleBlendModeChange}
				>
					<SelectTrigger>
						<SelectValue placeholder="Modo de mezcla" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="normal">Normal</SelectItem>
						<SelectItem value="multiply">Multiplicar</SelectItem>
						<SelectItem value="screen">Pantalla</SelectItem>
						<SelectItem value="overlay">Superposición</SelectItem>
						<SelectItem value="darken">Oscurecer</SelectItem>
						<SelectItem value="lighten">Aclarar</SelectItem>
						<SelectItem value="color-dodge">Sobreexposición</SelectItem>
						<SelectItem value="color-burn">Subexposición</SelectItem>
						<SelectItem value="difference">Diferencia</SelectItem>
						<SelectItem value="exclusion">Exclusión</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Controles de animación */}
			<div className="flex items-center justify-between">
				<Label htmlFor="animated" className="text-sm cursor-pointer">
					Textura animada
				</Label>
				<Switch
					id="animated"
					checked={texture.animated || false}
					onCheckedChange={handleAnimatedChange}
				/>
			</div>

			{texture.animated && (
				<div className="space-y-2">
					<div className="flex justify-between">
						<Label htmlFor="animation-speed">
							Velocidad de animación:{" "}
							{texture.animationSpeed?.toFixed(1) || "1.0"}
						</Label>
					</div>
					<Slider
						id="animation-speed"
						min={0.1}
						max={3}
						step={0.1}
						value={[texture.animationSpeed || 1]}
						onValueChange={handleAnimationSpeedChange}
					/>
				</div>
			)}

			<div className="flex items-center justify-between">
				<Label htmlFor="visible-on-hover" className="text-sm cursor-pointer">
					Mostrar solo al pasar el ratón
				</Label>
				<Switch
					id="visible-on-hover"
					checked={texture.visibleOnHover || false}
					onCheckedChange={handleVisibleOnHoverChange}
				/>
			</div>

			{texture.patternType === "noise" && (
				<>
					<div className="space-y-2">
						<Label htmlFor="noise-type">Tipo de ruido</Label>
						<Select
							value={texture.noiseType || "light"}
							onValueChange={handleNoiseTypeChange}
						>
							<SelectTrigger>
								<SelectValue placeholder="Tipo de ruido" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">Ligero</SelectItem>
								<SelectItem value="medium">Medio</SelectItem>
								<SelectItem value="heavy">Fuerte</SelectItem>
								<SelectItem value="digital">Digital</SelectItem>
								<SelectItem value="film">Película</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between">
							<Label htmlFor="texture-density">
								Densidad: {texture.density?.toFixed(1) || "0.6"}
							</Label>
						</div>
						<Slider
							id="texture-density"
							min={0.1}
							max={1}
							step={0.1}
							value={[texture.density || 0.6]}
							onValueChange={handleDensityChange}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between">
							<Label htmlFor="texture-contrast">
								Contraste: {texture.contrast?.toFixed(1) || "1.2"}
							</Label>
						</div>
						<Slider
							id="texture-contrast"
							min={0.5}
							max={2}
							step={0.1}
							value={[texture.contrast || 1.2]}
							onValueChange={handleContrastChange}
						/>
					</div>
				</>
			)}

			<div className="space-y-2">
				<div className="flex justify-between">
					<Label htmlFor="layer-order">
						Orden de capa: {texture.layerOrder || 1}
					</Label>
				</div>
				<Slider
					id="layer-order"
					min={0}
					max={10}
					step={1}
					value={[texture.layerOrder || 1]}
					onValueChange={handleLayerOrderChange}
				/>
				<p className="text-xs text-muted-foreground">
					Define el orden de renderizado. Las capas con valores más altos
					aparecen por encima.
				</p>
			</div>

			{texture.patternType !== "none" && (
				<div className="space-y-2">
					<div className="flex justify-between">
						<Label htmlFor="texture-scale">Escala: {texture.scale || 1}</Label>
					</div>
					<Slider
						id="texture-scale"
						min={0.5}
						max={3}
						step={0.1}
						value={[texture.scale || 1]}
						onValueChange={handleScaleChange}
					/>
				</div>
			)}
		</div>
	);
}
