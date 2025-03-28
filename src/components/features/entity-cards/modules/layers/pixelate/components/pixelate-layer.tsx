import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { PixelateConfig } from '../pixelate-schema';
import { pixelateImage } from '../utils/pixelate-algorithms';

interface PixelateLayerProps {
	processedConfig: PixelateConfig;
	style: React.CSSProperties;
	isVisible: boolean;
	width: number;
	height: number;
	sourceCanvas: HTMLCanvasElement;
}

const PixelateLayerComponent: React.FC<PixelateLayerProps> = ({
	processedConfig,
	style,
	isVisible,
	width,
	height,
	sourceCanvas,
}) => {
	const targetCanvasRef = useRef<HTMLCanvasElement>(null);

	// Aplicar el efecto cuando cambie la configuración o la imagen fuente
	useEffect(() => {
		if (!isVisible || !targetCanvasRef.current) return;

		const targetCanvas = targetCanvasRef.current;
		const sourceCtx = sourceCanvas.getContext('2d');
		const targetCtx = targetCanvas.getContext('2d');

		if (!sourceCtx || !targetCtx) return;

		// Obtener datos de la imagen original
		const imageData = sourceCtx.getImageData(0, 0, width, height);

		// Aplicar el efecto de pixelado
		const pixelatedData = pixelateImage(imageData, {
			pixelSize: processedConfig.pixelSize,
			algorithm: processedConfig.algorithm,
			colorReduction: processedConfig.colorReduction,
			colorLevels: processedConfig.colorLevels,
			zone: processedConfig.zone,
		});

		// Dibujar el resultado
		targetCtx.putImageData(pixelatedData, 0, 0);
	}, [isVisible, processedConfig, width, height, sourceCanvas]);

	return (
		<motion.canvas
			ref={targetCanvasRef}
			className={cn('absolute inset-0 pointer-events-none')}
			style={style}
			width={width}
			height={height}
			initial={{ opacity: 0 }}
			animate={{ opacity: isVisible ? 1 : 0 }}
			transition={{ duration: 0.3 }}
		/>
	);
};

export const PixelateLayer = withBaseLayer<PixelateConfig>(PixelateLayerComponent);
