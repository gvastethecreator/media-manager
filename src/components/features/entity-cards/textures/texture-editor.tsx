"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toastService } from "@/lib/services/toast.service";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { PatternSelector } from "./pattern-selector";
import { TextureAdvancedOptions } from "./texture-advanced-options";
import { TexturePreview } from "./texture-preview";

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

interface SVGPattern {
	id: string;
	name: string;
	svg: string;
	renderSvg: (color: string) => React.ReactNode;
}

interface TextureEditorProps {
	texture: TextureItem | null;
	svgPatterns: SVGPattern[];
	onSave: (texture: TextureItem) => void;
	onCancel: () => void;
}

export function TextureEditor({
	texture,
	svgPatterns,
	onSave,
	onCancel,
}: TextureEditorProps) {
	const [editedTexture, setEditedTexture] = useState<TextureItem | null>(
		texture
	);
	const [previewSvg, setPreviewSvg] = useState<string>("");

	// Actualizar el estado local cuando cambia la prop texture
	useEffect(() => {
		setEditedTexture(texture);
	}, [texture]);

	// Función para generar la vista previa de la textura actual
	const generatePatternPreview = useCallback(
		(textureToPreview: TextureItem | null) => {
			if (!textureToPreview || !textureToPreview.patternType) {
				setPreviewSvg("");
				return;
			}

			const pattern = svgPatterns.find(
				(p) => p.id === textureToPreview.patternType
			);
			if (!pattern) {
				setPreviewSvg("");
				return;
			}

			// Reemplazar currentColor con el color real
			const coloredSvg = pattern.svg.replace(
				/currentColor/g,
				textureToPreview.color || "#000000"
			);
			setPreviewSvg(coloredSvg);
		},
		[svgPatterns]
	);

	// Actualizar vista previa cuando cambia la textura
	useEffect(() => {
		if (editedTexture) {
			generatePatternPreview(editedTexture);
		}
	}, [editedTexture, generatePatternPreview]);

	// Actualizar campos específicos de la textura
	const handleTextureChange = (updatedFields: Partial<TextureItem>) => {
		setEditedTexture((prev) => {
			if (!prev) {
				return prev;
			}
			return {
				...prev,
				...updatedFields,
			};
		});
	};

	// Manejar la selección de patrones
	const handlePatternSelect = (patternId: string) => {
		handleTextureChange({ patternType: patternId });
	};

	// Manejar el guardado de la textura
	const handleSaveTexture = () => {
		if (!editedTexture) {
			return;
		}

		if (!editedTexture.name || !editedTexture.color) {
			toastService.warning("El nombre y el color son obligatorios");
			return;
		}

		// Validar valores
		const opacity =
			editedTexture.opacity < 0
				? 0
				: editedTexture.opacity > 1
					? 1
					: editedTexture.opacity;

		const animationSpeed =
			editedTexture.animationSpeed && editedTexture.animationSpeed < 0
				? 0.1
				: editedTexture.animationSpeed && editedTexture.animationSpeed > 3
					? 3
					: editedTexture.animationSpeed;

		// Actualizar textura con valores validados
		const validatedTexture: TextureItem = {
			...editedTexture,
			patternType: editedTexture.patternType || "none",
			opacity: opacity || 0.5,
			animationSpeed,
			// Valores por defecto para campos nuevos si no existen
			blendMode: editedTexture.blendMode || "normal",
			visibleOnHover: editedTexture.visibleOnHover ?? false,
			animated: editedTexture.animated ?? false,
			layerOrder: editedTexture.layerOrder ?? 1,
		};

		onSave(validatedTexture);
	};

	// Si no hay textura para editar, no renderizar nada
	if (!editedTexture) {
		return null;
	}

	return (
		<div className="grid gap-4">
			<div className="space-y-2">
				<Label htmlFor="texture-name">Nombre</Label>
				<Input
					id="texture-name"
					value={editedTexture.name || ""}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleTextureChange({ name: e.target.value })
					}
					placeholder="Nombre de la textura"
				/>
			</div>

			{/* Vista previa de la textura */}
			<TexturePreview texture={editedTexture} previewSvg={previewSvg} />

			{/* Selector de patrón SVG */}
			<PatternSelector
				patterns={svgPatterns}
				selectedPatternId={editedTexture.patternType}
				color={editedTexture.color}
				onPatternSelect={handlePatternSelect}
			/>

			<div className="space-y-2">
				<Label htmlFor="texture-color">Color</Label>
				<div className="flex gap-2">
					<Input
						id="texture-color"
						type="color"
						className="w-12"
						value={editedTexture.color || "#000000"}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleTextureChange({ color: e.target.value })
						}
					/>
					<Input
						value={editedTexture.color || "#000000"}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleTextureChange({ color: e.target.value })
						}
						placeholder="Color (hex)"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<div className="flex justify-between">
					<Label htmlFor="texture-opacity">
						Opacidad: {editedTexture.opacity?.toFixed(2) || "0.50"}
					</Label>
				</div>
				<Slider
					id="texture-opacity"
					min={0}
					max={1}
					step={0.05}
					value={[editedTexture.opacity || 0.5]}
					onValueChange={(values: number[]) =>
						handleTextureChange({ opacity: values[0] })
					}
				/>
			</div>

			{/* Opciones avanzadas */}
			<TextureAdvancedOptions
				texture={editedTexture}
				onTextureChange={handleTextureChange}
			/>

			{/* Editor de código SVG */}
			<details className="mt-2">
				<summary className="cursor-pointer text-sm font-medium">
					Editor SVG avanzado
				</summary>
				<div className="space-y-2 mt-2">
					<Label htmlFor="custom-svg">Código SVG personalizado</Label>
					<textarea
						id="custom-svg"
						className="w-full h-24 p-2 border rounded-md font-mono text-xs"
						value={previewSvg}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							setPreviewSvg(e.target.value)
						}
						placeholder="<svg>...</svg>"
					/>
					<p className="text-xs text-muted-foreground">
						Edita el código SVG directamente. Ten en cuenta que esto es para
						usuarios avanzados.
					</p>
				</div>
			</details>

			<div className="space-y-2">
				<Label htmlFor="texture-description">Descripción (opcional)</Label>
				<Input
					id="texture-description"
					value={editedTexture.description || ""}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleTextureChange({ description: e.target.value })
					}
					placeholder="Descripción breve..."
				/>
			</div>

			<DialogFooter>
				<Button variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<Button onClick={handleSaveTexture}>Guardar</Button>
			</DialogFooter>
		</div>
	);
}
