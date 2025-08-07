import { BoxIcon, DownloadIcon, EyeIcon, RotateCcwIcon, ZoomInIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { File3DWithStats } from '@/types/entities/file3d';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

interface File3DCardProps {
	/** Datos del archivo 3D a mostrar */
	file3d: File3DWithStats;
	/** Tamaño compacto con menos información */
	compact?: boolean;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
	/** Deshabilitar interacciones */
	disabled?: boolean;
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: () => void;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
	/** Si la tarjeta está activa */
	isActive?: boolean;
	/** Si está en modo scroll (para optimización) */
	isScrolling?: boolean;
	/** Si debe cargar contenido */
	shouldLoad?: boolean;
}

/**
 * File3DCard - Componente de tarjeta para archivos 3D con viewer integrado
 */
export function File3DCard({
	file3d,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
	isActive = false,
}: File3DCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [isRotating, setIsRotating] = useState(false);

	// Colores para el gradiente basados en el formato 3D
	const primaryColor = useMemo(() => {
		const format = file3d.format?.toLowerCase();
		switch (format) {
			case 'glb':
			case 'gltf':
				return '#8b5cf6'; // Púrpura para GLTF/GLB
			case 'obj':
				return '#f59e0b'; // Amarillo para OBJ
			case 'fbx':
				return '#3b82f6'; // Azul para FBX
			case 'dae':
				return '#10b981'; // Verde para DAE
			case 'ply':
				return '#ef4444'; // Rojo para PLY
			case '3ds':
				return '#ec4899'; // Rosa para 3DS
			default:
				return '#6b7280'; // Gris para otros
		}
	}, [file3d.format]);

	const secondaryColor = useMemo(() => {
		// Oscurecer el color primario para el secundario
		const hex = primaryColor.replace('#', '');
		const r = Math.floor(Number.parseInt(hex.slice(0, 2), 16) * 0.6);
		const g = Math.floor(Number.parseInt(hex.slice(2, 4), 16) * 0.6);
		const b = Math.floor(Number.parseInt(hex.slice(4, 6), 16) * 0.6);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}, [primaryColor]);

	// Formatear tamaño de archivo
	const fileSize = useMemo(() => {
		if (!file3d.size) return 'N/A';
		const mb = file3d.size / (1024 * 1024);
		if (mb < 1) {
			const kb = file3d.size / 1024;
			return `${kb.toFixed(1)} KB`;
		}
		return `${mb.toFixed(1)} MB`;
	}, [file3d.size]);

	// Complejidad del modelo basada en el tamaño
	const complexity = useMemo(() => {
		if (!file3d.size) return 'Desconocida';
		const mb = file3d.size / (1024 * 1024);
		if (mb < 1) return 'Baja';
		if (mb < 10) return 'Media';
		if (mb < 50) return 'Alta';
		return 'Muy Alta';
	}, [file3d.size]);

	const handleClick = useCallback(() => {
		if (!disabled && onClick) {
			onClick();
		}
	}, [disabled, onClick]);

	const handleMouseEnter = useCallback(() => {
		setIsHovered(true);
		setIsRotating(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHovered(false);
		setIsRotating(false);
	}, []);

	const toggleRotation = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setIsRotating(!isRotating);
		},
		[isRotating]
	);

	return (
		<CardContainer
			className={cn(
				'relative cursor-pointer overflow-hidden transition-all duration-300',
				'bg-gradient-to-br from-background via-background/95 to-background/90',
				'border border-border/50 hover:border-border',
				'shadow-sm hover:shadow-lg',
				tcgMode && 'hover:scale-[1.02] hover:shadow-2xl',
				isSelected && 'ring-2 ring-primary ring-offset-2',
				isActive && 'ring-2 ring-accent ring-offset-2',
				disabled && 'cursor-not-allowed opacity-50',
				compact ? 'h-32' : 'h-64',
				className
			)}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Efectos TCG */}
			{tcgMode && (
				<>
					{/* Gradiente de fondo */}
					<div
						className="absolute inset-0 opacity-10"
						style={{
							background: `linear-gradient(135deg, ${primaryColor}20 0%, transparent 50%, ${secondaryColor}20 100%)`,
						}}
					/>

					{/* Efecto de rotación 3D */}
					{isHovered && (
						<motion.div
							animate={{
								rotate: [0, 360],
							}}
							className="pointer-events-none absolute inset-0 opacity-20"
							style={{
								background: `conic-gradient(from 0deg, transparent 0deg, ${primaryColor}40 90deg, transparent 180deg, ${primaryColor}40 270deg, transparent 360deg)`,
							}}
							transition={{
								duration: 4,
								repeat: Number.POSITIVE_INFINITY,
								ease: 'linear',
							}}
						/>
					)}

					{/* Brillo en favoritos */}
					{file3d.isFavorite && (
						<div className="pointer-events-none absolute top-0 right-0 z-30 h-24 w-24 overflow-hidden">
							<div
								className="-translate-y-8 absolute top-0 right-0 h-24 w-24 translate-x-12 rotate-45 opacity-70"
								style={{
									background: `linear-gradient(45deg, transparent 30%, ${primaryColor} 40%, gold 50%, ${primaryColor} 60%, transparent 70%)`,
									backgroundSize: '600% 600%',
									animation: 'shine 3s linear infinite',
								}}
							/>
						</div>
					)}
				</>
			)}

			{/* Contenedor principal */}
			<div className="relative z-1 flex h-full flex-col">
				{/* Cabecera */}
				<CardHeader compact={compact} emoji="🎲" primaryColor={primaryColor} title={file3d.name || 'Sin nombre'} />

				{/* Contenido principal */}
				{!compact && (
					<div className="flex flex-1 flex-col gap-3 p-4">
						{/* Viewer 3D simulado */}
						<div className="flex items-center justify-center py-4">
							<div
								className="perspective-1000 relative rounded-2xl p-6"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<motion.div
									animate={isRotating ? { rotateY: [0, 360] } : {}}
									style={{ transformStyle: 'preserve-3d' }}
									transition={{
										duration: 3,
										repeat: isRotating ? Number.POSITIVE_INFINITY : 0,
										ease: 'linear',
									}}
								>
									<BoxIcon className="h-12 w-12" style={{ color: primaryColor }} />
								</motion.div>

								{/* Badge del formato */}
								<div
									className="-top-2 -right-2 absolute rounded-md px-2 py-1 font-bold text-xs"
									style={{
										backgroundColor: primaryColor,
										color: 'white',
									}}
								>
									{file3d.format?.toUpperCase() || '3D'}
								</div>

								{/* Indicador de complejidad */}
								<div
									className="-bottom-2 -left-2 absolute rounded-md px-2 py-1 font-bold text-xs"
									style={{
										backgroundColor: secondaryColor,
										color: 'white',
									}}
								>
									{complexity}
								</div>
							</div>
						</div>

						{/* Descripción */}

						{/* Estadísticas en modo TCG */}
						{tcgMode && (
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div
									className="flex items-center justify-between rounded px-2 py-1"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Tamaño</span>
									<span className="font-bold">{fileSize}</span>
								</div>
								<div
									className="flex items-center justify-between rounded px-2 py-1"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Formato</span>
									<span className="font-bold">{file3d.format?.toUpperCase() || 'N/A'}</span>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Pie de tarjeta */}
				<div className="border-border/20 border-t p-3">
					<div className="flex items-center justify-between text-xs">
						{/* Controles 3D */}
						<div className="flex items-center gap-2">
							<button
								className={cn('rounded p-1 transition-colors hover:bg-muted/50', isRotating && 'bg-muted/50')}
								onClick={toggleRotation}
								style={{ color: primaryColor }}
								title={isRotating ? 'Detener rotación' : 'Iniciar rotación'}
								type="button"
							>
								<RotateCcwIcon className="h-3.5 w-3.5" />
							</button>
							<button
								className="rounded p-1 transition-colors hover:bg-muted/50"
								style={{ color: primaryColor }}
								title="Vista previa"
								type="button"
							>
								<EyeIcon className="h-3.5 w-3.5" />
							</button>
							<button
								className="rounded p-1 transition-colors hover:bg-muted/50"
								style={{ color: primaryColor }}
								title="Zoom"
								type="button"
							>
								<ZoomInIcon className="h-3.5 w-3.5" />
							</button>
							<button
								className="rounded p-1 transition-colors hover:bg-muted/50"
								style={{ color: primaryColor }}
								title="Descargar"
								type="button"
							>
								<DownloadIcon className="h-3.5 w-3.5" />
							</button>
						</div>

						{/* Fecha de modificación */}
						<span className="text-muted-foreground">{new Date(file3d.updatedAt).toLocaleDateString()}</span>
					</div>

					{/* Barra de complejidad estilo TCG */}
					{tcgMode && (
						<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/30">
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${Math.min(100, ((file3d.size || 0) / (1024 * 1024)) * 2)}%`,
									backgroundColor: primaryColor,
									boxShadow: `0 0 8px ${primaryColor}50`,
								}}
							/>
						</div>
					)}
				</div>
			</div>
		</CardContainer>
	);
}
