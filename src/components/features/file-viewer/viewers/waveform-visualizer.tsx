/**
 * @file Waveform visualization component using Web Audio API
 * @module components/features/file-viewer/viewers/waveform-visualizer
 * @description Visualización de forma de onda para archivos de audio
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
	/** URL del archivo de audio */
	audioUrl: string;
	/** Progreso de reproducción (0-100) */
	progress: number;
	/** Si está reproduciendo */
	isPlaying: boolean;
	/** Callback al hacer clic en una posición */
	onPositionClick?: (percent: number) => void;
	/** Clases adicionales */
	className?: string;
	/** Color de la forma de onda */
	waveColor?: string;
	/** Color del progreso */
	progressColor?: string;
	/** Altura del canvas */
	height?: number;
}

export function WaveformVisualizer({
	audioUrl,
	progress,
	isPlaying,
	onPositionClick,
	className,
	waveColor = 'hsl(var(--muted-foreground))',
	progressColor = 'hsl(var(--primary))',
	height = 128,
}: WaveformVisualizerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [audioData, setAudioData] = useState<number[] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const animationRef = useRef<number | null>(null);

	// Cargar y analizar el audio
	useEffect(() => {
		let isCancelled = false;

		const loadAudio = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
				const response = await fetch(audioUrl);
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

				if (isCancelled) return;

				// Extraer datos del canal izquierdo
				const channelData = audioBuffer.getChannelData(0);
				const samples = 200; // Número de barras en el waveform
				const blockSize = Math.floor(channelData.length / samples);
				const filteredData: number[] = [];

				for (let i = 0; i < samples; i++) {
					const blockStart = blockSize * i;
					let sum = 0;

					for (let j = 0; j < blockSize; j++) {
						sum += Math.abs(channelData[blockStart + j]);
					}

					filteredData.push(sum / blockSize);
				}

				// Normalizar
				const multiplier = Math.max(...filteredData) ** -1;
				const normalizedData = filteredData.map((n) => n * multiplier);

				if (!isCancelled) {
					setAudioData(normalizedData);
					setIsLoading(false);
				}

				// Cerrar el contexto de audio
				try {
					audioContext.close();
				} catch {
					// Ignorar error de cierre
				}
			} catch (err) {
				if (!isCancelled) {
					setError('Error al analizar el audio');
					setIsLoading(false);
				}
			}
		};

		loadAudio();

		return () => {
			isCancelled = true;
		};
	}, [audioUrl]);

	// Dibujar el waveform
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!(canvas && audioData)) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();

		// Configurar canvas para alta resolución
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		const width = rect.width;
		const barWidth = (width / audioData.length) * 0.8;
		const gap = (width / audioData.length) * 0.2;
		const progressWidth = (progress / 100) * width;

		// Limpiar canvas
		ctx.clearRect(0, 0, width, height);

		// Dibujar barras
		audioData.forEach((amplitude, index) => {
			const x = index * (barWidth + gap);
			const barHeight = amplitude * height * 0.9;
			const y = (height - barHeight) / 2;

			// Determinar color según el progreso
			const isPlayed = x < progressWidth;
			ctx.fillStyle = isPlayed ? progressColor : waveColor;

			// Dibujar barra redondeada
			ctx.beginPath();
			ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
			ctx.fill();
		});

		// Línea de progreso
		ctx.strokeStyle = progressColor;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(progressWidth, 0);
		ctx.lineTo(progressWidth, height);
		ctx.stroke();
	}, [audioData, progress, height, waveColor, progressColor]);

	// Animación cuando está reproduciendo
	useEffect(() => {
		if (isPlaying && audioData) {
			const animate = () => {
				// Redibujar para actualizar la línea de progreso
				const canvas = canvasRef.current;
				if (canvas) {
					const event = new Event('redraw');
					canvas.dispatchEvent(event);
				}
				animationRef.current = requestAnimationFrame(animate);
			};
			animationRef.current = requestAnimationFrame(animate);
		} else if (animationRef.current !== null) {
			cancelAnimationFrame(animationRef.current);
		}

		return () => {
			if (animationRef.current !== null) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isPlaying, audioData]);

	const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!(canvas && onPositionClick)) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percent = (x / rect.width) * 100;

		onPositionClick(Math.max(0, Math.min(100, percent)));
	};

	if (isLoading) {
		return (
			<div className={cn('flex items-center justify-center rounded-lg bg-muted', className)} style={{ height }}>
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					Generando waveform...
				</div>
			</div>
		);
	}

	if (error || !audioData) {
		return (
			<div className={cn('flex items-center justify-center rounded-lg bg-muted', className)} style={{ height }}>
				<span className="text-muted-foreground text-sm">Visualización no disponible</span>
			</div>
		);
	}

	return (
		<canvas
			className={cn('w-full cursor-pointer rounded-lg bg-muted/50 transition-colors hover:bg-muted', className)}
			onClick={handleClick}
			ref={canvasRef}
			style={{ height }}
			title="Clic para saltar a esa posición"
		/>
	);
}
