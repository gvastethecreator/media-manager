/**
 * @file Visor de imagen con zoom
 * @module components/ui/image-zoom
 * @description Modal para visualizar imágenes en tamaño completo con zoom
 */

import { Maximize2, Minimize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ImageZoomDialogProps {
	/** URL de la imagen */
	imageUrl: string;
	/** Si el diálogo está abierto */
	isOpen: boolean;
	/** Callback al cerrar */
	onClose: () => void;
	/** Nombre/título de la imagen */
	title?: string;
}

export function ImageZoomDialog({ isOpen, imageUrl, title = 'Vista ampliada', onClose }: ImageZoomDialogProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragStartRef = useRef({ x: 0, y: 0 });
	const [isFullscreen, setIsFullscreen] = useState(false);

	// Resetear estado al abrir
	useEffect(() => {
		if (isOpen) {
			setScale(1);
			setPosition({ x: 0, y: 0 });
		}
	}, [isOpen]);

	// Manejar zoom
	const handleZoomIn = useCallback(() => {
		setScale((prev) => Math.min(prev * 1.2, 5));
	}, []);

	const handleZoomOut = useCallback(() => {
		setScale((prev) => Math.max(prev / 1.2, 0.5));
	}, []);

	const handleReset = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Manejar drag para pan
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (scale > 1) {
				setIsDragging(true);
				dragStartRef.current = {
					x: e.clientX - position.x,
					y: e.clientY - position.y,
				};
			}
		},
		[scale, position]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isDragging && scale > 1) {
				setPosition({
					x: e.clientX - dragStartRef.current.x,
					y: e.clientY - dragStartRef.current.y,
				});
			}
		},
		[isDragging, scale]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Manejar wheel para zoom
	const handleWheel = useCallback((e: React.WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		setScale((prev) => Math.max(0.5, Math.min(5, prev * delta)));
	}, []);

	// Toggle fullscreen
	const toggleFullscreen = useCallback(() => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
			setIsFullscreen(false);
		} else {
			containerRef.current?.requestFullscreen();
			setIsFullscreen(true);
		}
	}, []);

	// Escuchar cambios de fullscreen
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
	}, []);

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<DialogContent
				className={cn(
					'max-h-[95vh] max-w-[95vw] overflow-hidden border-0 bg-black/95 p-0',
					isFullscreen && 'fixed inset-0 max-h-none max-w-none rounded-none'
				)}
				onEscapeKeyDown={onClose}
				ref={containerRef}
			>
				<DialogTitle className="sr-only">{title}</DialogTitle>

				{/* Header con controles */}
				<div className="absolute top-0 right-0 left-0 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
					<span className="max-w-[50%] truncate font-medium text-sm text-white/90">{title}</span>
					<div className="flex items-center gap-2">
						{/* Controles de zoom */}
						<div className="flex items-center gap-1 rounded-lg bg-black/50 p-1">
							<Button
								className="h-8 w-8 text-white hover:bg-white/20"
								disabled={scale <= 0.5}
								onClick={handleZoomOut}
								size="icon"
								variant="ghost"
							>
								<ZoomOut className="h-4 w-4" />
							</Button>
							<span className="w-12 text-center text-white text-xs">{Math.round(scale * 100)}%</span>
							<Button
								className="h-8 w-8 text-white hover:bg-white/20"
								disabled={scale >= 5}
								onClick={handleZoomIn}
								size="icon"
								variant="ghost"
							>
								<ZoomIn className="h-4 w-4" />
							</Button>
							<Button
								className="h-8 w-8 text-white hover:bg-white/20"
								disabled={scale === 1 && position.x === 0 && position.y === 0}
								onClick={handleReset}
								size="icon"
								variant="ghost"
							>
								<RotateCcw className="h-4 w-4" />
							</Button>
						</div>

						{/* Fullscreen */}
						<Button
							className="h-8 w-8 text-white hover:bg-white/20"
							onClick={toggleFullscreen}
							size="icon"
							variant="ghost"
						>
							{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
						</Button>

						{/* Cerrar */}
						<Button className="h-8 w-8 text-white hover:bg-white/20" onClick={onClose} size="icon" variant="ghost">
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Contenedor de imagen */}
				<div
					className="relative flex h-[85vh] w-full cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing"
					onMouseDown={handleMouseDown}
					onMouseLeave={handleMouseUp}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onWheel={handleWheel}
				>
					<img
						alt={title}
						className="max-h-full max-w-full select-none object-contain transition-transform duration-200 ease-out"
						draggable={false}
						src={imageUrl}
						style={{
							transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
						}}
					/>
				</div>

				{/* Instrucciones */}
				<div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-white/50 text-xs">
					Scroll para zoom • Arrastrar para mover • Doble click para reset
				</div>
			</DialogContent>
		</Dialog>
	);
}
