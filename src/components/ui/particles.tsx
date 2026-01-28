import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MousePosition {
	x: number;
	y: number;
}

function useMousePosition(): MousePosition {
	const [mousePosition, setMousePosition] = useState<MousePosition>({
		x: 0,
		y: 0,
	});

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			setMousePosition({ x: event.clientX, y: event.clientY });
		};

		window.addEventListener('mousemove', handleMouseMove);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	}, []);

	return mousePosition;
}

interface ParticlesProps {
	className?: string;
	quantity?: number;
	staticity?: number;
	ease?: number;
	size?: number;
	color?: string;
	vx?: number;
	vy?: number;
}

function parseColor(color: string, canvas: HTMLCanvasElement): number[] {
	if (color.startsWith('#')) {
		const cleanHex = color.replace('#', '');
		let formattedHex = cleanHex;
		if (cleanHex.length === 3) {
			formattedHex = cleanHex
				.split('')
				.map((char) => char + char)
				.join('');
		}
		const rHex = formattedHex.substring(0, 2);
		const gHex = formattedHex.substring(2, 4);
		const bHex = formattedHex.substring(4, 6);
		return [Number.parseInt(rHex, 16), Number.parseInt(gHex, 16), Number.parseInt(bHex, 16)];
	}

	// Si es una variable CSS o color con nombre, usar el navegador para parsearlo
	const tempElement = document.createElement('div');
	tempElement.style.color = color;
	tempElement.style.display = 'none';
	document.body.appendChild(tempElement);
	const computedColor = getComputedStyle(tempElement).color;
	document.body.removeChild(tempElement);

	const match = computedColor.match(/\d+/g);
	return match ? match.slice(0, 3).map(Number) : [255, 255, 255];
}

type Circle = {
	x: number;
	y: number;
	translateX: number;
	translateY: number;
	size: number;
	alpha: number;
	targetAlpha: number;
	dx: number;
	dy: number;
	magnetism: number;
};

const Particles: React.FC<ParticlesProps> = ({
	className = '',
	quantity = 100,
	staticity = 50,
	ease = 50,
	size = 0.4,
	color = 'currentColor',
	vx = 0,
	vy = 0,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const canvasContainerRef = useRef<HTMLDivElement>(null);
	const context = useRef<CanvasRenderingContext2D | null>(null);
	const circles = useRef<Circle[]>([]);
	const mousePosition = useMousePosition();
	const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
	const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
	const rafID = useRef<number | null>(null);
	const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

	const [rgb, setRgb] = useState<number[]>([255, 255, 255]);

	useEffect(() => {
		if (canvasRef.current) {
			setRgb(parseColor(color, canvasRef.current));
		}
	}, [color]);

	const circleParams = useCallback((): Circle => {
		const x = Math.floor(Math.random() * canvasSize.current.w);
		const y = Math.floor(Math.random() * canvasSize.current.h);
		const translateX = 0;
		const translateY = 0;
		const pSize = Math.floor(Math.random() * 2) + size;
		const alpha = 0;
		const targetAlpha = Number.parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
		const dx = (Math.random() - 0.5) * 0.1;
		const dy = (Math.random() - 0.5) * 0.1;
		const magnetism = 0.1 + Math.random() * 4;
		return {
			x,
			y,
			translateX,
			translateY,
			size: pSize,
			alpha,
			targetAlpha,
			dx,
			dy,
			magnetism,
		};
	}, [size]);

	const drawCircle = useCallback(
		(circle: Circle, update = false) => {
			if (context.current) {
				const { x, y, translateX, translateY, size: circleSize, alpha } = circle;
				context.current.translate(translateX, translateY);
				context.current.beginPath();
				context.current.arc(x, y, circleSize, 0, 2 * Math.PI);
				context.current.fillStyle = `rgba(${rgb.join(', ')}, ${alpha})`;
				context.current.fill();
				context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

				if (!update) {
					circles.current.push(circle);
				}
			}
		},
		[dpr, rgb]
	);

	const clearContext = useCallback(() => {
		if (context.current) {
			context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
		}
	}, []);

	const drawParticles = useCallback(() => {
		clearContext();
		const particleCount = quantity;
		for (let i = 0; i < particleCount; i++) {
			const newCircle = circleParams();
			drawCircle(newCircle);
		}
	}, [circleParams, clearContext, drawCircle, quantity]);

	const resizeCanvas = useCallback(() => {
		if (canvasContainerRef.current && canvasRef.current && context.current) {
			canvasSize.current.w = canvasContainerRef.current.offsetWidth;
			canvasSize.current.h = canvasContainerRef.current.offsetHeight;

			canvasRef.current.width = canvasSize.current.w * dpr;
			canvasRef.current.height = canvasSize.current.h * dpr;
			canvasRef.current.style.width = `${canvasSize.current.w}px`;
			canvasRef.current.style.height = `${canvasSize.current.h}px`;
			context.current.scale(dpr, dpr);

			circles.current = [];
			for (let i = 0; i < quantity; i++) {
				const newCircle = circleParams();
				drawCircle(newCircle);
			}
		}
	}, [dpr, drawCircle, circleParams, quantity]);

	const initCanvas = useCallback(() => {
		resizeCanvas();
		drawParticles();
	}, [drawParticles, resizeCanvas]);

	const remapValue = useCallback(
		(value: number, start1: number, end1: number, start2: number, end2: number): number => {
			const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
			return remapped > 0 ? remapped : 0;
		},
		[]
	);

	const animate = useCallback(() => {
		clearContext();
		for (let i = circles.current.length - 1; i >= 0; i--) {
			const circle = circles.current[i];
			const edge = [
				circle.x + circle.translateX - circle.size,
				canvasSize.current.w - circle.x - circle.translateX - circle.size,
				circle.y + circle.translateY - circle.size,
				canvasSize.current.h - circle.y - circle.translateY - circle.size,
			];
			const closestEdge = edge.reduce((a, b) => Math.min(a, b));
			const remapClosestEdge = Number.parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));
			if (remapClosestEdge > 1) {
				circle.alpha += 0.02;
				if (circle.alpha > circle.targetAlpha) {
					circle.alpha = circle.targetAlpha;
				}
			} else {
				circle.alpha = circle.targetAlpha * remapClosestEdge;
			}
			circle.x += circle.dx + vx;
			circle.y += circle.dy + vy;
			circle.translateX += (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) / ease;
			circle.translateY += (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) / ease;

			drawCircle(circle, true);

			if (
				circle.x < -circle.size ||
				circle.x > canvasSize.current.w + circle.size ||
				circle.y < -circle.size ||
				circle.y > canvasSize.current.h + circle.size
			) {
				circles.current.splice(i, 1);
				const newCircle = circleParams();
				drawCircle(newCircle);
			}
		}
		rafID.current = window.requestAnimationFrame(animate);
	}, [circleParams, clearContext, drawCircle, ease, staticity, vx, vy, remapValue]);

	const onMouseMove = useCallback(() => {
		if (canvasRef.current) {
			const rect = canvasRef.current.getBoundingClientRect();
			const { w, h } = canvasSize.current;
			const x = mousePosition.x - rect.left - w / 2;
			const y = mousePosition.y - rect.top - h / 2;
			const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
			if (inside) {
				mouse.current.x = x;
				mouse.current.y = y;
			}
		}
	}, [mousePosition.x, mousePosition.y]);

	useEffect(() => {
		if (canvasRef.current) {
			context.current = canvasRef.current.getContext('2d');
		}
		initCanvas();
		animate();

		const handleResize = () => {
			if (resizeTimeout.current) {
				clearTimeout(resizeTimeout.current);
			}
			resizeTimeout.current = setTimeout(() => {
				initCanvas();
			}, 200);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			if (rafID.current != null) {
				window.cancelAnimationFrame(rafID.current);
			}
			if (resizeTimeout.current) {
				clearTimeout(resizeTimeout.current);
			}
			window.removeEventListener('resize', handleResize);
		};
	}, [animate, initCanvas]);

	useEffect(() => {
		onMouseMove();
	}, [onMouseMove]);

	return (
		<div aria-hidden="true" className={cn('pointer-events-none', className)} ref={canvasContainerRef}>
			<canvas className="size-full" ref={canvasRef} />
		</div>
	);
};

export default Particles;
