'use client';

import type { BlendMode } from '@/lib/types/blend-modes';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEntityContext } from '../../hooks/use-entity-context';
import { usePixelateConfig } from './hooks/use-pixelate-config';
import { PixelateSettings } from './pixelate-settings';
import type { PixelateOptions } from './utils/pixelate-algorithms';
import { pixelateImage } from './utils/pixelate-algorithms';

interface PixelateLayerProps {
	entityId?: string;
	entityType: string;
	className?: string;
	children?: React.ReactNode;
}

/**
 * Componente de capa para aplicar efectos de pixelado a imágenes
 */
export function PixelateLayer({ entityId, entityType, className }: PixelateLayerProps) {
	const { imageUrl, canvasRef, setSettingsContent } = useEntityContext();

	// Estado y refs
	const pixelateCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const [_isProcessing, setIsProcessing] = useState(false);

	// Obtener configuración de pixelado
	const { config, isLoading } = usePixelateConfig({
		entityId,
		entityType,
	});

	// Crear el elemento de canvas para el pixelado
	useEffect(() => {
		if (!pixelateCanvasRef.current) {
			const canvas = document.createElement('canvas');
			canvas.className = cn(
				'absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300',
				className
			);
			pixelateCanvasRef.current = canvas;
		}
	}, [className]);

	// Aplicar el pixelado cuando cambie la configuración o la imagen
	useEffect(() => {
		if (!config?.enabled || isLoading || !imageUrl || !canvasRef?.current) {
			return;
		}

		const applyPixelate = async () => {
			if (!pixelateCanvasRef.current || !canvasRef.current) {
				return;
			}

			try {
				setIsProcessing(true);

				// Obtener el contexto del canvas original
				const sourceCanvas = canvasRef.current;
				const sourceCtx = sourceCanvas.getContext('2d');
				if (!sourceCtx) {
					return;
				}

				// Obtener tamaño
				const width = sourceCanvas.width;
				const height = sourceCanvas.height;

				// Redimensionar el canvas de pixelado
				const pixelateCanvas = pixelateCanvasRef.current;
				pixelateCanvas.width = width;
				pixelateCanvas.height = height;

				// Obtener el contexto del canvas de pixelado
				const pixelateCtx = pixelateCanvas.getContext('2d');
				if (!pixelateCtx) {
					return;
				}

				// Obtener los datos de imagen del canvas original
				const imageData = sourceCtx.getImageData(0, 0, width, height);

				// Crear opciones para el algoritmo de pixelado
				const pixelateOptions: PixelateOptions = {
					pixelSize: config.pixelSize,
					algorithm: config.algorithm as 'simple' | 'weighted' | 'adaptive',
					applyToSpot: config.applyToSpot,
					spotRadius: config.spotRadius,
					spotPosition: config.spotPosition,
					colorReduction: config.colorReduction,
					colorLevels: config.colorLevels,
				};

				// Aplicar el algoritmo de pixelado
				const pixelatedData = pixelateImage(imageData, pixelateOptions);

				// Limpiar el canvas de pixelado
				pixelateCtx.clearRect(0, 0, width, height);

				// Dibujar la imagen pixelada en el canvas
				pixelateCtx.putImageData(pixelatedData, 0, 0);

				// Aplicar modo de mezcla
				if (config.blendMode && config.blendMode !== 'normal') {
					pixelateCtx.globalCompositeOperation = config.blendMode as GlobalCompositeOperation;

					// Para modos de mezcla que requieren una capa adicional
					if (['overlay', 'multiply', 'screen'].includes(config.blendMode)) {
						// Dibujar una segunda capa para mejorar el efecto
						pixelateCtx.drawImage(sourceCanvas, 0, 0);
						pixelateCtx.globalCompositeOperation = 'source-over';
					}
				}

				// Aplicar opacidad
				pixelateCanvas.style.opacity = config.opacity.toString();
			} catch (err) {
				console.error('Error al aplicar pixelado:', err);
			} finally {
				setIsProcessing(false);
			}
		};

		applyPixelate();
	}, [config, imageUrl, canvasRef, isLoading]);

	// Configurar el componente de ajustes
	useEffect(() => {
		if (!setSettingsContent) {
			return;
		}

		// Mostrar panel de configuración cuando el componente está montado
		setSettingsContent(<PixelateSettings entityId={entityId} entityType={entityType} />);

		// Limpiar cuando el componente se desmonte
		return () => {
			setSettingsContent(null);
		};
	}, [setSettingsContent, entityId, entityType]);

	// No renderizar nada si la capa está deshabilitada o no hay imagen
	if (!config?.enabled || !imageUrl) {
		return null;
	}

	// Renderizar el canvas usando createPortal para insertarlo en el DOM
	return pixelateCanvasRef.current ? createPortal(null, pixelateCanvasRef.current) : null;
}
