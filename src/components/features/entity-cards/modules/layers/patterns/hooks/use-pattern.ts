'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PatternConfig } from '../actions/pattern-config.action';
import { generatePattern } from '../utils/pattern-generators';

interface UsePatternProps {
	config: PatternConfig;
	shouldRender: boolean;
}

interface UsePatternResult {
	canvasRef: React.RefObject<HTMLCanvasElement>;
	error: string | null;
	initializeCanvas: () => boolean;
	renderPattern: () => void;
}

/**
 * Hook personalizado para manejar la lógica de patrones
 * @param config - Configuración del patrón
 * @param shouldRender - Indica si el patrón debe renderizarse
 */
export function usePattern({ config, shouldRender }: UsePatternProps): UsePatternResult {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const contextRef = useRef<CanvasRenderingContext2D | null>(null);
	const [error, setError] = useState<string | null>(null);

	const {
		opacity = 1,
		scale = 1,
		color = '#ffffff',
		patternType = 'grid',
		spacing = 20,
		lineWidth = 1,
		rotation = 0,
		blendMode = 'overlay',
	} = config;

	// Inicializar contexto del canvas
	const initializeCanvas = useCallback(() => {
		if (!canvasRef.current) {
			setError('Canvas no disponible');
			return false;
		}

		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) {
			setError('Contexto 2D no disponible');
			return false;
		}

		const dpr = window.devicePixelRatio || 1;
		const rect = canvasRef.current.getBoundingClientRect();

		canvasRef.current.width = rect.width * dpr;
		canvasRef.current.height = rect.height * dpr;

		ctx.scale(dpr, dpr);
		contextRef.current = ctx;
		return true;
	}, []);

	// Renderizar el patrón
	const renderPattern = useCallback(() => {
		const ctx = contextRef.current;
		const canvas = canvasRef.current;

		if (!ctx || !canvas) {
			setError('Contexto o canvas no disponible');
			return;
		}

		try {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = opacity;
			ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;

			// Aplicar transformaciones
			ctx.save();
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotate((rotation * Math.PI) / 180);
			ctx.scale(scale, scale);
			ctx.translate(-canvas.width / 2, -canvas.height / 2);

			// Generar y dibujar el patrón
			generatePattern({
				ctx,
				width: canvas.width,
				height: canvas.height,
				type: patternType,
				color,
				spacing,
				lineWidth,
			});

			ctx.restore();
		} catch (err) {
			setError(`Error al generar patrón: ${err instanceof Error ? err.message : 'Error desconocido'}`);
		}
	}, [opacity, scale, color, patternType, spacing, lineWidth, rotation, blendMode]);

	// Efecto principal de renderizado
	useEffect(() => {
		if (!shouldRender) return;

		const success = initializeCanvas();
		if (!success) return;

		renderPattern();
	}, [shouldRender, initializeCanvas, renderPattern]);

	// Manejar redimensionamiento
	useEffect(() => {
		const handleResize = () => {
			const success = initializeCanvas();
			if (success) {
				renderPattern();
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [initializeCanvas, renderPattern]);

	return {
		canvasRef,
		error,
		initializeCanvas,
		renderPattern,
	};
}
