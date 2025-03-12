"use client";

import { cn } from "@/lib/utils/utils";
import type {
	ExplodeLayerTransformFunction,
	GrainEffectOptions,
	TextureConfig
} from "../base-card-types";
import * as React from "react";

export interface GrainEffectLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	texture?: TextureConfig;
	options?: GrainEffectOptions;
}

/**
 * GrainEffectLayer - Capa que añade efecto de grano o textura a la tarjeta.
 * Puede usar diferentes patrones de grano o una imagen personalizada.
 */
export function GrainEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	texture,
	options,
}: GrainEffectLayerProps) {
	// Valores por defecto
	const defaultOptions: GrainEffectOptions = {
		intensity: 0.15,
		density: 0.6,
		contrast: 1.2,
		noise: "light",
		animated: false,
		animationSpeed: 1,
		visibleOnHover: true,
		layerIndex: 6,
	};

	// Combinar opciones
	const mergedOptions = { ...defaultOptions, ...options };

	// Calcular opacidad basada en configuración
	const opacity = mergedOptions.visibleOnHover
		? isHovered
			? mergedOptions.intensity
			: mergedOptions.intensity * 0.5
		: mergedOptions.intensity;

	// Determinar tipo de ruido y textura
	const getNoisePattern = () => {
		// Si hay una textura personalizada con URL, la usamos
		if (texture?.imageUrl) {
			return {
				backgroundImage: `url(${texture.imageUrl})`,
				backgroundSize: "cover",
				backgroundRepeat: "no-repeat",
				opacity: texture.opacity || opacity,
				mixBlendMode: "overlay",
			};
		}

		// Si hay un tipo de ruido configurado, usamos una clase CSS predefinida
		const noiseClass = getNoiseClass();
		if (noiseClass) {
			return {
				opacity,
				mixBlendMode: "overlay",
			};
		}

		// Si no hay configuración específica, usamos un ruido basado en SVG
		const svgFilter = generateNoiseSVG(mergedOptions.density || 0.6, mergedOptions.contrast || 1.2);
		return {
			backgroundImage: `url("data:image/svg+xml;base64,${btoa(svgFilter)}")`,
			backgroundSize: "100px 100px",
			opacity,
			mixBlendMode: "overlay",
		};
	};

	// Generar una clase CSS dependiendo del tipo de ruido
	const getNoiseClass = () => {
		switch (mergedOptions.noise) {
			case "digital":
				return "digital-noise";
			case "film":
				return "film-grain";
			case "heavy":
				return "heavy-noise";
			case "light":
			default:
				return "light-noise";
		}
	};

	// Generar una cadena SVG para el ruido
	const generateNoiseSVG = (density: number, contrast: number) => {
		// Esta función genera un SVG con ruido aleatorio
		const pixels = 50;
		const scale = density * 100;
		let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 ${pixels} ${pixels}">`;

		for (let i = 0; i < scale; i++) {
			const x = Math.floor(Math.random() * pixels);
			const y = Math.floor(Math.random() * pixels);
			const size = Math.random() * 2;
			const opacity = Math.random() * contrast;

			svgContent += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="white" opacity="${opacity}" />`;
		}

		svgContent += '</svg>';
		return svgContent;
	};

	const animationClass = mergedOptions.animated
		? "animate-grain"
		: "";

	return (
		<div
			className={cn(
				"absolute inset-0 z-15 pointer-events-none",
				isExploded ? "exploded-layer layer-grain" : "",
				getNoiseClass(),
				animationClass
			)}
			style={{
				...getNoisePattern(),
				...(isExploded ? getExplodeLayerTransform(mergedOptions.layerIndex || 6) : {}),
			}}
			data-layer-active={activeLayer === "grain" || null}
		/>
	);
}
