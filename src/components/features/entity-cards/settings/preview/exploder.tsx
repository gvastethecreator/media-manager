'use client';

import { cn } from '@/lib/utils/utils';
import { ChevronRight, Layers, X } from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface ExploderProps {
	/** Controlar si está en modo explotado */
	isExploded: boolean;
	/** Función para cambiar el estado explotado */
	onToggleExplode: () => void;
	/** Lista de capas que se pueden resaltar */
	layers?: {
		id: string;
		label: string;
		icon?: React.ReactNode;
	}[];
	/** ID de la capa actualmente resaltada */
	activeLayer?: string | null;
	/** Función para cambiar la capa activa */
	onLayerHover?: (id: string | null) => void;
	/** Valores de transformación 3D */
	transformValues: {
		x1: number;
		y1: number;
		x2: number;
		step: number;
		tx: number;
		ty: number;
	};
	/** Función para actualizar valores de transformación */
	onTransformChange?: (values: Partial<ExploderProps['transformValues']>) => void;
}

const DEFAULT_LAYERS = [
	{
		id: 'content',
		label: 'Contenido',
		icon: <div className="w-3 h-3 bg-primary rounded-sm" />,
	},
	{
		id: 'border',
		label: 'Borde',
		icon: <div className="w-3 h-3 border border-primary rounded-sm" />,
	},
	{
		id: 'grain',
		label: 'Textura',
		icon: <div className="w-3 h-3 bg-slate-400 opacity-50 rounded-sm" />,
	},
	{
		id: 'halo',
		label: 'Halo',
		icon: <div className="w-3 h-3 bg-blue-300 rounded-full opacity-60" />,
	},
	{
		id: 'scanlines',
		label: 'Líneas',
		icon: (
			<div className="w-3 h-3 bg-slate-200 flex flex-col justify-between">
				<div className="h-[1px] bg-slate-400" />
				<div className="h-[1px] bg-slate-400" />
			</div>
		),
	},
	{
		id: 'holographic',
		label: 'Holo',
		icon: <div className="w-3 h-3 bg-gradient-to-tr from-purple-400 to-blue-300 opacity-60" />,
	},
];

export function Exploder({
	isExploded = false,
	onToggleExplode,
	layers = DEFAULT_LAYERS,
	activeLayer = null,
	onLayerHover,
	transformValues,
	onTransformChange,
}: ExploderProps) {
	const [isPanelOpen, setIsPanelOpen] = useState(true);

	// Valores preestablecidos para vista isométrica
	const presets = {
		isometric: { x1: -25, y1: 35, x2: 10, step: 8, tx: 1.2, ty: -0.8 },
		flat: { x1: 0, y1: 0, x2: 0, step: 6, tx: 0, ty: 0 },
		side: { x1: 0, y1: 45, x2: 0, step: 9, tx: 1.8, ty: 0 },
	};

	// Función para aplicar un preset
	const applyPreset = (preset: keyof typeof presets) => {
		onTransformChange?.(presets[preset]);
	};

	// Aplicar clase CSS al body cuando está en modo explotado
	useEffect(() => {
		if (isExploded) {
			document.documentElement.style.setProperty('--x1', `${transformValues.x1}`);
			document.documentElement.style.setProperty('--y1', `${transformValues.y1}`);
			document.documentElement.style.setProperty('--x2', `${transformValues.x2}`);
			document.documentElement.style.setProperty('--step', `${transformValues.step}`);
			document.documentElement.style.setProperty('--tx', `${transformValues.tx}`);
			document.documentElement.style.setProperty('--ty', `${transformValues.ty}`);
			document.documentElement.dataset.exploded = 'true';
		} else {
			document.documentElement.dataset.exploded = 'false';
		}

		return () => {
			// Limpiar al desmontar
			document.documentElement.dataset.exploded = 'false';
		};
	}, [isExploded, transformValues]);

	return (
		<>
			{/* Botón principal para activar/desactivar el modo explosión */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation(); // Prevenir la propagación del evento al contenedor padre
					onToggleExplode();
					// Asegurar que el panel se abra al activar el modo explode
					if (!isExploded) {
						setIsPanelOpen(true);
					}
				}}
				className={cn(
					'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-60 border transition-colors',
					isExploded
						? 'bg-primary text-primary-foreground border-primary'
						: 'bg-background/80 backdrop-blur-sm border-border/30 text-foreground/70 hover:text-primary hover:bg-background hover:border-primary'
				)}
				style={{
					transformStyle: 'preserve-3d',
					transform: 'translateZ(50px)',
					boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
				}}
				title={isExploded ? 'Vista normal' : 'Vista explosionada'}
			>
				{isExploded ? <X size={14} /> : <Layers size={14} />}
			</button>

			{/* Panel de control que aparece cuando está en modo explosión */}
			{isExploded &&
				typeof document !== 'undefined' &&
				ReactDOM.createPortal(
					<motion.div
						className="fixed right-4 top-4 z-[1000] bg-card rounded-lg border shadow-lg overflow-hidden w-72"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3 }}
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-3 border-b">
							<h3 className="text-sm font-medium flex items-center gap-2">
								<Layers size={16} />
								<span>Vista explotada 3D</span>
								<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
									3D
								</span>
							</h3>
							<button
								type="button"
								onClick={() => setIsPanelOpen(!isPanelOpen)}
								className="p-1 rounded-md hover:bg-muted"
							>
								<ChevronRight size={16} className={cn('transition-transform', isPanelOpen ? 'rotate-90' : '')} />
							</button>
						</div>

						{isPanelOpen && (
							<div className="p-3 space-y-4">
								{/* Vistas preestablecidas */}
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground mb-2">Vistas predefinidas</p>
									<div className="grid grid-cols-3 gap-2">
										<button
											type="button"
											onClick={() => applyPreset('isometric')}
											className="text-xs py-1.5 px-2 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
										>
											Isométrica
										</button>
										<button
											type="button"
											onClick={() => applyPreset('side')}
											className="text-xs py-1.5 px-2 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
										>
											Lateral
										</button>
										<button
											type="button"
											onClick={() => applyPreset('flat')}
											className="text-xs py-1.5 px-2 rounded bg-muted hover:bg-muted/70 transition-colors"
										>
											Restablecer
										</button>
									</div>
								</div>

								{/* Controles de rotación */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<p className="text-xs text-muted-foreground">Rotación 3D</p>
										<span className="text-xs text-muted-foreground">
											X1: {transformValues.x1}° | Y: {transformValues.y1}° | X2: {transformValues.x2}°
										</span>
									</div>
									<div className="grid gap-3 text-xs">
										<div className="space-y-1">
											<div className="flex justify-between">
												<span className="block text-muted-foreground">X1 (Inclinación)</span>
												<span>{transformValues.x1}°</span>
											</div>
											<input
												type="range"
												min="-45"
												max="45"
												value={transformValues.x1}
												onChange={(e) =>
													onTransformChange?.({
														x1: Number.parseInt(e.target.value),
													})
												}
												className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
											/>
										</div>
										<div className="space-y-1">
											<div className="flex justify-between">
												<span className="block text-muted-foreground">Y1 (Rotación)</span>
												<span>{transformValues.y1}°</span>
											</div>
											<input
												type="range"
												min="-45"
												max="45"
												value={transformValues.y1}
												onChange={(e) =>
													onTransformChange?.({
														y1: Number.parseInt(e.target.value),
													})
												}
												className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
											/>
										</div>
										<div className="space-y-1">
											<div className="flex justify-between">
												<span className="block text-muted-foreground">X2 (Perspectiva)</span>
												<span>{transformValues.x2}°</span>
											</div>
											<input
												type="range"
												min="-45"
												max="45"
												value={transformValues.x2}
												onChange={(e) =>
													onTransformChange?.({
														x2: Number.parseInt(e.target.value),
													})
												}
												className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
											/>
										</div>
									</div>
								</div>

								{/* Controles de separación y posición */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<p className="text-xs text-muted-foreground">Separación y posición</p>
										<span className="text-xs text-muted-foreground">
											Z: {transformValues.step} | X: {transformValues.tx} | Y: {transformValues.ty}
										</span>
									</div>
									<div className="grid gap-3 text-xs">
										<div className="space-y-1">
											<div className="flex justify-between">
												<span className="block text-muted-foreground">Separación (Z)</span>
												<span>{transformValues.step}</span>
											</div>
											<input
												type="range"
												min="1"
												max="12"
												step="0.5"
												value={transformValues.step}
												onChange={(e) =>
													onTransformChange?.({
														step: Number.parseFloat(e.target.value),
													})
												}
												className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
											/>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1">
												<div className="flex justify-between">
													<span className="block text-muted-foreground">Posición X</span>
													<span>{transformValues.tx}</span>
												</div>
												<input
													type="range"
													min="-5"
													max="5"
													step="0.2"
													value={transformValues.tx}
													onChange={(e) =>
														onTransformChange?.({
															tx: Number.parseFloat(e.target.value),
														})
													}
													className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
												/>
											</div>
											<div className="space-y-1">
												<div className="flex justify-between">
													<span className="block text-muted-foreground">Posición Y</span>
													<span>{transformValues.ty}</span>
												</div>
												<input
													type="range"
													min="-5"
													max="5"
													step="0.2"
													value={transformValues.ty}
													onChange={(e) =>
														onTransformChange?.({
															ty: Number.parseFloat(e.target.value),
														})
													}
													className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
												/>
											</div>
										</div>
									</div>
								</div>

								{/* Lista de capas activas */}
								<div className="space-y-2">
									<p className="text-xs text-muted-foreground">Capas disponibles</p>
									<div className="space-y-1 max-h-40 overflow-y-auto pr-1">
										{layers.map((layer) => (
											<div
												key={layer.id}
												className={cn(
													'flex items-center gap-2 py-1.5 px-2 rounded-md text-xs transition-colors cursor-pointer',
													layer.id === activeLayer ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
												)}
												onMouseEnter={() => onLayerHover?.(layer.id)}
												onMouseLeave={() => onLayerHover?.(null)}
											>
												{layer.icon ?? <div className="w-3 h-3 rounded-full bg-primary" />}
												<span>{layer.label}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</motion.div>,
					document.body
				)}
		</>
	);
}
