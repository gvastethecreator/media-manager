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
				'relative overflow-hidden cursor-pointer transition-all duration-300',
				'bg-gradient-to-br from-background via-background/95 to-background/90',
				'border border-border/50 hover:border-border',
				'shadow-sm hover:shadow-lg',
				tcgMode && 'hover:shadow-2xl hover:scale-[1.02]',
				isSelected && 'ring-2 ring-primary ring-offset-2',
				isActive && 'ring-2 ring-accent ring-offset-2',
				disabled && 'opacity-50 cursor-not-allowed',
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
							className="absolute inset-0 opacity-20 pointer-events-none"
							style={{
								background: `conic-gradient(from 0deg, transparent 0deg, ${primaryColor}40 90deg, transparent 180deg, ${primaryColor}40 270deg, transparent 360deg)`,
							}}
							animate={{
								rotate: [0, 360],
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
						<div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
							<div
								className="absolute top-0 right-0 w-24 h-24 rotate-45 translate-x-12 -translate-y-8 opacity-70"
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
			<div className="flex flex-col h-full relative z-1">
				{/* Cabecera */}
				<CardHeader
					title={file3d.name || 'Sin nombre'}
					emoji="🎲"
					color={primaryColor}
					isFavorite={file3d.isFavorite || false}
					compact={compact}
				/>

				{/* Contenido principal */}
				{!compact && (
					<div className="flex-1 p-4 flex flex-col gap-3">
						{/* Viewer 3D simulado */}
						<div className="flex items-center justify-center py-4">
							<div
								className="relative p-6 rounded-2xl perspective-1000"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<motion.div
									animate={isRotating ? { rotateY: [0, 360] } : {}}
									transition={{
										duration: 3,
										repeat: isRotating ? Number.POSITIVE_INFINITY : 0,
										ease: 'linear',
									}}
									style={{ transformStyle: 'preserve-3d' }}
								>
									<BoxIcon className="h-12 w-12" style={{ color: primaryColor }} />
								</motion.div>

								{/* Badge del formato */}
								<div
									className="absolute -top-2 -right-2 px-2 py-1 rounded-md text-xs font-bold"
									style={{
										backgroundColor: primaryColor,
										color: 'white',
									}}
								>
									{file3d.format?.toUpperCase() || '3D'}
								</div>

								{/* Indicador de complejidad */}
								<div
									className="absolute -bottom-2 -left-2 px-2 py-1 rounded-md text-xs font-bold"
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
									className="flex items-center justify-between px-2 py-1 rounded"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Tamaño</span>
									<span className="font-bold">{fileSize}</span>
								</div>
								<div
									className="flex items-center justify-between px-2 py-1 rounded"
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
				<div className="p-3 border-t border-border/20">
					<div className="flex items-center justify-between text-xs">
						{/* Controles 3D */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={toggleRotation}
								className={cn('p-1 rounded hover:bg-muted/50 transition-colors', isRotating && 'bg-muted/50')}
								style={{ color: primaryColor }}
								title={isRotating ? 'Detener rotación' : 'Iniciar rotación'}
							>
								<RotateCcwIcon className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								className="p-1 rounded hover:bg-muted/50 transition-colors"
								style={{ color: primaryColor }}
								title="Vista previa"
							>
								<EyeIcon className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								className="p-1 rounded hover:bg-muted/50 transition-colors"
								style={{ color: primaryColor }}
								title="Zoom"
							>
								<ZoomInIcon className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								className="p-1 rounded hover:bg-muted/50 transition-colors"
								style={{ color: primaryColor }}
								title="Descargar"
							>
								<DownloadIcon className="h-3.5 w-3.5" />
							</button>
						</div>

						{/* Fecha de modificación */}
						<span className="text-muted-foreground">{new Date(file3d.updatedAt).toLocaleDateString()}</span>
					</div>

					{/* Barra de complejidad estilo TCG */}
					{tcgMode && (
						<div className="mt-2 h-1 w-full rounded-full overflow-hidden bg-muted/30">
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
