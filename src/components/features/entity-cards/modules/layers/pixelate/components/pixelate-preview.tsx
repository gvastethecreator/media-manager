'use client';

import { useEffect, useRef, useState } from 'react';
import type { PixelateConfig } from '../pixelate-schema';
import { pixelateAlgorithms, reduceColors } from './pixelate-algorithms';

interface PixelatePreviewProps {
	config: PixelateConfig;
	imageUrl?: string;
	width?: number;
	height?: number;
}

/**
 * Componente de vista previa para el efecto de pixelado
 */
export function PixelatePreview({
	config,
	imageUrl = '/placeholder-image.jpg',
	width = 300,
	height = 200,
}: PixelatePreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

	// Cargar la imagen original
	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			// Ajustar el tamaño del canvas
			canvas.width = width;
			canvas.height = height;

			// Dibujar la imagen original
			ctx.drawImage(img, 0, 0, width, height);

			// Guardar los datos de la imagen original
			const imageData = ctx.getImageData(0, 0, width, height);
			setOriginalImageData(imageData);
		};
		img.onerror = () => {
			// En caso de error, dibujar un rectángulo de color
			canvas.width = width;
			canvas.height = height;
			ctx.fillStyle = '#3b82f6';
			ctx.fillRect(0, 0, width, height);
			ctx.fillStyle = '#1e3a8a';
			ctx.font = '16px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('Error al cargar la imagen', width / 2, height / 2);

			// Crear datos de imagen de fallback
			const imageData = ctx.getImageData(0, 0, width, height);
			setOriginalImageData(imageData);
		};
		img.src = imageUrl;
	}, [imageUrl, width, height]);

	// Aplicar el efecto de pixelado cuando cambia la configuración o la imagen original
	useEffect(() => {
		if (!canvasRef.current || !originalImageData || !config.enabled) {
			return;
		}

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		// Seleccionar el algoritmo de pixelado
		const pixelateFunction = pixelateAlgorithms[config.algorithm] || pixelateAlgorithms.simple;

		// Aplicar el efecto de pixelado
		let processedImageData = pixelateFunction(originalImageData, config.pixelSize);

		// Aplicar reducción de colores si está habilitada
		if (config.colorReduction && config.colorLevels) {
			processedImageData = reduceColors(processedImageData, config.colorLevels);
		}

		// Dibujar la imagen procesada
		ctx.putImageData(processedImageData, 0, 0);
	}, [originalImageData, config]);

	return (
		<div className="relative w-full h-full overflow-hidden">
			<canvas ref={canvasRef} width={width} height={height} className="w-full h-full object-cover" />
		</div>
	);
}
