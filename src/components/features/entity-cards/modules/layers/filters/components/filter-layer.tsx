'use client';

import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { FilterConfig } from '../filter-schema';
import { generateDistortionFilters, generateFilterStyles } from '../utils/filter-utils';

interface FilterLayerProps {
	processedConfig: FilterConfig;
	style: React.CSSProperties;
	isVisible: boolean;
	width: number;
	height: number;
}

/**
 * 🎨 Componente interno de la capa de filtros
 */
const FilterLayerComponent = ({ processedConfig, style, isVisible, width, height }: FilterLayerProps) => {
	// Referencias y estado
	const containerRef = useRef<HTMLDivElement>(null);
	const animationFrameRef = useRef<number>();

	// 🎨 Generar estilos de filtro
	const filterStyle = useMemo(
		() => ({
			...style,
			...generateFilterStyles(processedConfig),
			width: `${width}px`,
			height: `${height}px`,
		}),
		[processedConfig, style, width, height]
	);

	// ⚡ Manejar animación de distorsión
	const animate = useCallback(() => {
		if (!isVisible || !processedConfig.distortion?.animated) return;

		const container = containerRef.current;
		if (!container) return;

		// Actualizar transformación
		container.style.transform = `scale(${1 + Math.sin((Date.now() * (processedConfig.distortion.speed || 1)) / 1000) * 0.02})`;

		// Continuar animación
		animationFrameRef.current = requestAnimationFrame(animate);
	}, [isVisible, processedConfig.distortion]);

	// 🔄 Inicializar y limpiar animación
	useEffect(() => {
		if (isVisible && processedConfig.distortion?.animated) {
			animate();
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isVisible, animate, processedConfig.distortion]);

	return (
		<>
			{/* Filtros SVG para efectos de distorsión */}
			{processedConfig.filterType === 'distortion' && generateDistortionFilters()}

			{/* Contenedor de filtros */}
			<motion.div
				ref={containerRef}
				style={filterStyle}
				className="absolute inset-0 pointer-events-none"
				initial={{ opacity: 0 }}
				animate={{ opacity: isVisible ? 1 : 0 }}
				transition={{ duration: 0.3 }}
			/>
		</>
	);
};

/**
 * 🎨 Capa de filtros con funcionalidad base
 */
export const FilterLayer = withBaseLayer<FilterConfig>(FilterLayerComponent);
