'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridConfig } from '../actions/grid-config.action';

interface UseGridProps {
    config: GridConfig;
    shouldRender: boolean;
}

interface UseGridReturn {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    error: string | null;
    initializeCanvas: () => void;
    renderGrid: () => void;
}

/**
 * Hook para manejar la lógica de renderizado de grid
 */
export function useGrid({ config, shouldRender }: UseGridProps): UseGridReturn {
    // Referencias y estado
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const requestRef = useRef<number | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Función para inicializar el canvas
    const initializeCanvas = useCallback(() => {
        if (!canvasRef.current) {
            return;
        }

        try {
            // Obtener el contexto del canvas
            const context = canvasRef.current.getContext('2d');
            if (!context) {
                throw new Error('No se pudo obtener el contexto 2D del canvas');
            }
            contextRef.current = context;

            // Configurar el tamaño del canvas (se ajustará automáticamente al contenedor)
            const configureCanvasSize = () => {
                if (!canvasRef.current || !contextRef.current) return;

                const canvas = canvasRef.current;
                const parent = canvas.parentElement;

                if (!parent) return;

                // Obtener las dimensiones del contenedor padre
                const { width, height } = parent.getBoundingClientRect();

                // Ajustar canvas al tamaño del padre
                canvas.width = width;
                canvas.height = height;

                // Escalar según la densidad de píxeles del dispositivo
                const dpr = window.devicePixelRatio || 1;
                canvas.width = width * dpr;
                canvas.height = height * dpr;

                // Ajustar el estilo para que coincida con el tamaño visual
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                // Escalar el contexto
                contextRef.current.scale(dpr, dpr);

                // Renderizar después de cambiar el tamaño
                renderGrid();
            };

            // Configurar tamaño inicialmente
            configureCanvasSize();

            // Añadir listener para redimensionamiento
            window.addEventListener('resize', configureCanvasSize);

            // Limpiar listener al desmontar
            return () => {
                window.removeEventListener('resize', configureCanvasSize);
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al inicializar el canvas');
        }
    }, []);

    // Función para renderizar el grid
    const renderGrid = useCallback(() => {
        if (!contextRef.current || !canvasRef.current || !shouldRender) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        const { width, height } = canvas.getBoundingClientRect();

        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);

        // Configurar opacidad
        ctx.globalAlpha = config.opacity;

        // Configurar color
        ctx.strokeStyle = config.color;
        ctx.fillStyle = config.color;

        // Guardar el estado actual del contexto
        ctx.save();

        // Aplicar rotación si es necesario
        if (config.angle !== 0) {
            ctx.translate(width / 2, height / 2);
            ctx.rotate((config.angle * Math.PI) / 180);
            ctx.translate(-width / 2, -height / 2);
        }

        // Configurar grosor de línea
        ctx.lineWidth = config.thickness;

        // Renderizar según el tipo de grid
        switch (config.gridType) {
            case 'lines':
                renderLines(ctx, width, height, config);
                break;
            case 'dots':
                renderDots(ctx, width, height, config);
                break;
            case 'squares':
                renderSquares(ctx, width, height, config);
                break;
            case 'diamonds':
                renderDiamonds(ctx, width, height, config);
                break;
            case 'hexagons':
                renderHexagons(ctx, width, height, config);
                break;
            default:
                renderLines(ctx, width, height, config);
        }

        // Restaurar el estado del contexto
        ctx.restore();

        // Animación
        if (config.animateOnHover) {
            // Si es necesario, implementar animación aquí
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
            requestRef.current = requestAnimationFrame(renderGrid);
        }
    }, [config, shouldRender]);

    // Funciones auxiliares para renderizar diferentes tipos de grid
    const renderLines = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        config: GridConfig
    ) => {
        const { spacing, showSubgrid, subgridDivisions, subgridOpacity } = config;

        // Calcular offset para centrar el grid
        const xOffset = (width % spacing) / 2;
        const yOffset = (height % spacing) / 2;

        // Dibujar subgrid si está habilitado
        if (showSubgrid) {
            const subSpacing = spacing / subgridDivisions;
            const currentAlpha = ctx.globalAlpha;

            ctx.globalAlpha = subgridOpacity;

            // Líneas verticales del subgrid
            for (let x = xOffset; x < width; x += subSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // Líneas horizontales del subgrid
            for (let y = yOffset; y < height; y += subSpacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Restaurar opacidad original
            ctx.globalAlpha = currentAlpha;
        }

        // Dibujar líneas principales verticales
        for (let x = xOffset; x < width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Dibujar líneas principales horizontales
        for (let y = yOffset; y < height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    };

    const renderDots = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        config: GridConfig
    ) => {
        const { spacing, thickness, showSubgrid, subgridDivisions, subgridOpacity } = config;

        // Calcular offset para centrar el grid
        const xOffset = (width % spacing) / 2;
        const yOffset = (height % spacing) / 2;

        // Dibujar subgrid si está habilitado
        if (showSubgrid) {
            const subSpacing = spacing / subgridDivisions;
            const currentAlpha = ctx.globalAlpha;
            const subDotSize = thickness * 0.7;

            ctx.globalAlpha = subgridOpacity;

            // Dibujar puntos del subgrid
            for (let x = xOffset; x < width; x += subSpacing) {
                for (let y = yOffset; y < height; y += subSpacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, subDotSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Restaurar opacidad original
            ctx.globalAlpha = currentAlpha;
        }

        // Dibujar puntos principales
        for (let x = xOffset; x < width; x += spacing) {
            for (let y = yOffset; y < height; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const renderSquares = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        config: GridConfig
    ) => {
        const { spacing, thickness, showSubgrid, subgridDivisions, subgridOpacity } = config;

        // Usar renderLines para dibujar la cuadrícula, es más eficiente
        renderLines(ctx, width, height, config);
    };

    const renderDiamonds = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        config: GridConfig
    ) => {
        const { spacing, showSubgrid, subgridDivisions, subgridOpacity } = config;

        // Calcular offset para centrar el grid
        const xOffset = (width % spacing) / 2;
        const yOffset = (height % spacing) / 2;

        // Guardar contexto para restaurar después
        ctx.save();

        // Rotar 45 grados para crear diamantes
        ctx.translate(width / 2, height / 2);
        ctx.rotate(Math.PI / 4);
        ctx.translate(-width / 2, -height / 2);

        // Usar renderLines para dibujar la cuadrícula rotada
        renderLines(ctx, width * 1.5, height * 1.5, {
            ...config,
            spacing: spacing * Math.SQRT2, // Ajustar espaciado para compensar la rotación
        });

        // Restaurar contexto
        ctx.restore();
    };

    const renderHexagons = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        config: GridConfig
    ) => {
        const { spacing, thickness } = config;

        // Constantes para hexágonos
        const hexRadius = spacing / 2;
        const hexHeight = hexRadius * Math.sqrt(3);

        // Calcular offsets para centrar
        const xOffset = (width % (spacing * 1.5)) / 2;
        const yOffset = (height % hexHeight) / 2;

        // Función para dibujar un hexágono en una posición dada
        const drawHexagon = (x: number, y: number) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = x + hexRadius * Math.cos(angle);
                const hy = y + hexRadius * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(hx, hy);
                } else {
                    ctx.lineTo(hx, hy);
                }
            }
            ctx.closePath();
            ctx.stroke();
        };

        // Dibujar hexágonos
        for (let row = 0; row < height / hexHeight + 1; row++) {
            const isOddRow = row % 2 === 1;
            const rowY = row * hexHeight + yOffset;

            for (let col = -1; col < width / spacing + 1; col++) {
                // Offset horizontal para filas impares
                const colX = col * spacing * 1.5 + (isOddRow ? spacing * 0.75 : 0) + xOffset;

                drawHexagon(colX, rowY);
            }
        }
    };

    // Efecto para inicializar y renderizar cuando cambia shouldRender
    useEffect(() => {
        if (shouldRender) {
            initializeCanvas();
        }

        return () => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        };
    }, [shouldRender, initializeCanvas]);

    // Efecto para renderizar cuando cambia la configuración
    useEffect(() => {
        if (shouldRender) {
            renderGrid();
        }
    }, [config, shouldRender, renderGrid]);

    return {
        canvasRef,
        error,
        initializeCanvas,
        renderGrid,
    };
}