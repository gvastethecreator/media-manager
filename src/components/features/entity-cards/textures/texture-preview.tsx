"use client";

import { Label } from "@/components/ui/label";
import type React from "react";

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

interface TexturePreviewProps {
	texture: TextureItem | null;
	previewSvg: string;
}

export function TexturePreview({ texture, previewSvg }: TexturePreviewProps) {
	// Obtener el color con opacidad para la vista previa
	const getColorWithOpacity = (color: string, opacity: number) => {
		// Si el color es en formato hex (#RRGGBB), convertirlo a rgba
		if (color.startsWith("#")) {
			const r = Number.parseInt(color.slice(1, 3), 16);
			const g = Number.parseInt(color.slice(3, 5), 16);
			const b = Number.parseInt(color.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		return color;
	};

	// Obtener estilo del patrón para la vista previa
	const getPatternStyle = (
		patternType?: string,
		color?: string,
		opacity = 0.5
	) => {
		const colorWithOpacity = color
			? getColorWithOpacity(color, opacity)
			: "rgba(59, 130, 246, 0.5)";

		switch (patternType) {
			case "dots":
				return {
					backgroundImage: `radial-gradient(${colorWithOpacity} 1px, transparent 1px)`,
					backgroundSize: "8px 8px",
				};
			case "lines":
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: "10px 10px",
				};
			case "grid":
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px),
                             linear-gradient(90deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: "10px 10px",
				};
			case "waves":
				return {
					background: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${colorWithOpacity} 6px, transparent 10px)`,
				};
			case "noise":
				return {
					backgroundColor: colorWithOpacity,
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
					backgroundBlendMode: "overlay",
				};
			case "circles":
				return {
					backgroundImage: `radial-gradient(circle at 50% 50%, ${colorWithOpacity} 20%, transparent 25%)`,
					backgroundSize: "20px 20px",
				};
			case "squares":
				return {
					backgroundImage: `linear-gradient(0deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px),
                             linear-gradient(90deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px)`,
					backgroundSize: "15px 15px",
				};
			case "diagonal":
				return {
					backgroundImage: `repeating-linear-gradient(45deg, ${colorWithOpacity}, ${colorWithOpacity} 1px, transparent 1px, transparent 10px)`,
				};
			case "chevron":
				return {
					backgroundImage: `
            linear-gradient(135deg, ${colorWithOpacity} 25%, transparent 25%),
            linear-gradient(225deg, ${colorWithOpacity} 25%, transparent 25%)
          `,
					backgroundSize: "20px 20px",
				};
			default:
				return {
					backgroundColor: opacity > 0 ? colorWithOpacity : "transparent",
				};
		}
	};

	return (
		<div className="mt-2">
			<Label>Vista previa</Label>
			<div
				className="w-full aspect-video rounded-md border mt-1 flex items-center justify-center"
				style={{
					backgroundColor: texture?.color || "#ffffff",
					opacity: texture?.opacity || 1,
					backgroundImage: previewSvg
						? `url('data:image/svg+xml;utf8,${encodeURIComponent(previewSvg)}')`
						: undefined,
					backgroundSize: "20px 20px",
					...getPatternStyle(
						texture?.patternType,
						texture?.color,
						texture?.opacity
					),
				}}
			>
				{!previewSvg && !texture?.patternType && (
					<div className="text-sm text-muted-foreground">
						Selecciona un patrón
					</div>
				)}
			</div>
		</div>
	);
}
