"use client";

import {
	getEntityTextureSystem,
	saveEntityTextureSystem,
} from "@/app/actions/entities-cards/entities-cards.actions";
import type {
	TextureConfig,
	TextureSystem,
} from "@/components/features/entity-cards/types/base-card-types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toastService } from "@/lib/services/toast.service";
import { Palette, Plus, Save } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ExplodeLayerTransformFunction } from "../../types/base-card-types";
import { PatternSelector } from "./pattern-selector";
import { TextureAdvancedOptions } from "./texture-advanced-options";
import { TextureEditor } from "./texture-editor";
import { TextureList } from "./texture-list";
import { TexturePreview } from "./texture-preview";

interface TextureManagerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	texture?: TextureConfig;
	options?: {
		visibleOnHover?: boolean;
		opacity?: number;
		intensity?: number;
		scale?: number;
		blendMode?: string;
		noiseType?: string;
		animated?: boolean;
		animationSpeed?: number;
		density?: number;
		contrast?: number;
	};
	onTextureChange?: (texture: TextureConfig) => void;
}

export function TextureManager({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	texture,
	options = {},
	onTextureChange,
}: TextureManagerProps) {
	const {
		visibleOnHover = false,
		opacity = 1,
		intensity = 1,
		scale = 1,
		blendMode = "overlay",
		noiseType = "digital",
		animated = false,
		animationSpeed = 1,
		density = 0.5,
		contrast = 1,
	} = options;

	// Si está en modo explotado, no aplicamos la textura
	if (isExploded) {
		return null;
	}

	// Si está configurado para mostrar solo en hover y no está en hover, no mostramos
	if (visibleOnHover && !isHovered) {
		return null;
	}

	const handleTextureChange = (newTexture: TextureConfig) => {
		onTextureChange?.(newTexture);
	};

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				opacity: opacity * intensity,
				...(isExploded ? getExplodeLayerTransform(0) : {}),
			}}
			data-layer-active={activeLayer === "texture" || null}
		>
			{texture && (
				<>
					<TexturePreview
						texture={texture}
						options={{
							scale,
							blendMode,
							noiseType,
							animated,
							animationSpeed,
							density,
							contrast,
						}}
					/>
					<TextureEditor texture={texture} onChange={handleTextureChange} />
					<TextureList
						selectedTexture={texture}
						onSelect={handleTextureChange}
					/>
					<TextureAdvancedOptions
						texture={texture}
						onChange={handleTextureChange}
					/>
					<PatternSelector
						selectedPattern={texture.patternType}
						onSelect={(pattern) =>
							handleTextureChange({ ...texture, patternType: pattern })
						}
					/>
				</>
			)}
		</div>
	);
}
