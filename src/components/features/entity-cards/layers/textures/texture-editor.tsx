"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { toastService } from "@/lib/services/toast.service";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { TextureConfig } from "../../types/base-card-types";
import { PatternSelector } from "./pattern-selector";
import { TextureAdvancedOptions } from "./texture-advanced-options";
import { TexturePreview } from "./texture-preview";

interface TextureEditorProps {
	texture: TextureConfig;
	onChange: (texture: TextureConfig) => void;
}

export function TextureEditor({ texture, onChange }: TextureEditorProps) {
	const handleChange = (
		key: keyof TextureConfig,
		value: TextureConfig[keyof TextureConfig]
	) => {
		onChange({
			...texture,
			[key]: value,
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>Patrón</Label>
				<Select
					value={texture.patternType}
					onValueChange={(value) => handleChange("patternType", value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Selecciona un patrón" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="dots">Puntos</SelectItem>
						<SelectItem value="lines">Líneas</SelectItem>
						<SelectItem value="grid">Cuadrícula</SelectItem>
						<SelectItem value="diagonal">Diagonal</SelectItem>
						<SelectItem value="waves">Ondas</SelectItem>
						<SelectItem value="hexagons">Hexágonos</SelectItem>
						<SelectItem value="noise">Ruido</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label>Color</Label>
				<ColorPicker
					color={texture.color}
					onChange={(color) => handleChange("color", color)}
				/>
			</div>

			<div className="space-y-2">
				<Label>Opacidad</Label>
				<Slider
					value={[texture.opacity]}
					onValueChange={([value]) => handleChange("opacity", value)}
					min={0}
					max={1}
					step={0.1}
				/>
			</div>

			<div className="space-y-2">
				<Label>Escala</Label>
				<Slider
					value={[texture.scale || 1]}
					onValueChange={([value]) => handleChange("scale", value)}
					min={0.1}
					max={5}
					step={0.1}
				/>
			</div>

			{texture.patternType === "noise" && (
				<>
					<div className="space-y-2">
						<Label>Densidad</Label>
						<Slider
							value={[texture.density || 0.5]}
							onValueChange={([value]) => handleChange("density", value)}
							min={0}
							max={1}
							step={0.1}
						/>
					</div>

					<div className="space-y-2">
						<Label>Contraste</Label>
						<Slider
							value={[texture.contrast || 1]}
							onValueChange={([value]) => handleChange("contrast", value)}
							min={0}
							max={2}
							step={0.1}
						/>
					</div>
				</>
			)}

			<div className="flex items-center space-x-2">
				<Switch
					checked={texture.visibleOnHover}
					onCheckedChange={(checked) => handleChange("visibleOnHover", checked)}
				/>
				<Label>Visible al pasar el mouse</Label>
			</div>

			<div className="space-y-2">
				<Label>Orden de capa</Label>
				<Input
					type="number"
					value={texture.layerOrder}
					onChange={(e) =>
						handleChange("layerOrder", Number.parseInt(e.target.value))
					}
					min={0}
					max={10}
				/>
			</div>
		</div>
	);
}
