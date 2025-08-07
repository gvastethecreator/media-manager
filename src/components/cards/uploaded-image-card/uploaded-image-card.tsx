import { CheckCircleIcon, DownloadIcon, EyeIcon, ImageIcon, InfoIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { UploadedImageWithStats } from '@/types/entities/uploaded-image';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

interface UploadedImageCardProps {
	/** Datos de la imagen subida a mostrar */
	uploadedImage: UploadedImageWithStats;
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
 * UploadedImageCard - Componente de tarjeta para imágenes subidas con preview
 */
export function UploadedImageCard({
	uploadedImage,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
	isActive = false,
}: UploadedImageCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [imageError, setImageError] = useState(false);

	// Colores para el gradiente basados en el tipo/categoría
	const primaryColor = useMemo(() => {
		const category = uploadedImage.category?.toLowerCase();
		switch (category) {
			case 'avatar':
				return '#8b5cf6'; // Púrpura para avatars
			case 'background':
				return '#3b82f6'; // Azul para fondos
			case 'icon':
				return '#f59e0b'; // Amarillo para iconos
			case 'photo':
				return '#10b981'; // Verde para fotos
			case 'artwork':
				return '#ec4899'; // Rosa para artwork
			case 'screenshot':
				return '#6b7280'; // Gris para screenshots
			default:
				return '#ef4444'; // Rojo para otros
		}
	}, [uploadedImage.category]);

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
		if (!uploadedImage.size) return 'N/A';
		const mb = uploadedImage.size / (1024 * 1024);
		if (mb < 1) {
			const kb = uploadedImage.size / 1024;
			return `${kb.toFixed(1)} KB`;
		}
		return `${mb.toFixed(1)} MB`;
	}, [uploadedImage.size]);

	// Dimensiones formateadas
	const dimensions = useMemo(() => {
		if (!(uploadedImage.dimensions?.width && uploadedImage.dimensions?.height)) return 'N/A';
		return `${uploadedImage.dimensions.width}×${uploadedImage.dimensions.height}`;
	}, [uploadedImage.dimensions?.width, uploadedImage.dimensions?.height]);

	// URL de la imagen con fallback
	const imageUrl = useMemo(() => {
		return uploadedImage.url || uploadedImage.path || '/placeholder-image.jpg';
	}, [uploadedImage.url, uploadedImage.path]);

	const handleClick = useCallback(() => {
		if (!disabled && onClick) {
			onClick();
		}
	}, [disabled, onClick]);

	const handleMouseEnter = useCallback(() => setIsHovered(true), []);
	const handleMouseLeave = useCallback(() => setIsHovered(false), []);

	const handleImageError = useCallback(() => {
		setImageError(true);
	}, []);

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

					{/* Efecto de brillo en hover */}
					{isHovered && (
						<motion.div
							animate={{
								backgroundPosition: ['0% 0%', '100% 100%'],
							}}
							className="pointer-events-none absolute inset-0 opacity-20"
							style={{
								background: `linear-gradient(45deg, transparent 30%, ${primaryColor}40 50%, transparent 70%)`,
								backgroundSize: '200% 200%',
							}}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: 'linear',
							}}
						/>
					)}

					{/* Brillo en favoritos */}
				</>
			)}

			{/* Contenedor principal */}
			<div className="relative z-1 flex h-full flex-col">
				{/* Cabecera */}
				<CardHeader compact={compact} primaryColor={primaryColor} title={uploadedImage.name || 'Sin nombre'} />

				{/* Contenido principal */}
				{!compact && (
					<div className="flex flex-1 flex-col gap-3 p-4">
						{/* Preview de la imagen */}
						<div className="flex items-center justify-center py-2">
							<div
								className="relative overflow-hidden rounded-lg"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
									width: '120px',
									height: '80px',
								}}
							>
								{imageError ? (
									<div className="flex h-full w-full items-center justify-center">
										<ImageIcon className="h-8 w-8" style={{ color: primaryColor }} />
									</div>
								) : (
									<img
										alt={uploadedImage.name || 'Imagen subida'}
										className="h-full w-full object-cover"
										onError={handleImageError}
										src={imageUrl}
									/>
								)}

								{/* Badge de la categoría */}
								<div
									className="absolute top-1 right-1 rounded px-1.5 py-0.5 font-bold text-xs"
									style={{
										backgroundColor: primaryColor,
										color: 'white',
									}}
								>
									{uploadedImage.category?.toUpperCase() || 'IMG'}
								</div>

								{/* Indicador de procesamiento completo */}
								{uploadedImage.imageId && (
									<div
										className="absolute right-1 bottom-1 rounded-full p-0.5"
										style={{
											backgroundColor: '#10b981',
											color: 'white',
										}}
									>
										<CheckCircleIcon className="h-3 w-3" />
									</div>
								)}
							</div>
						</div>

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
									<span>Dimensiones</span>
									<span className="font-bold">{dimensions}</span>
								</div>
								<div
									className="col-span-2 flex items-center justify-between rounded px-2 py-1"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Hash</span>
									<span className="font-bold font-mono text-xs">{uploadedImage.hash?.substring(0, 8) || 'N/A'}</span>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Pie de tarjeta */}
				<div className="border-border/20 border-t p-3">
					<div className="flex items-center justify-between text-xs">
						{/* Acciones rápidas */}
						<div className="flex items-center gap-2">
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
								title="Información"
								type="button"
							>
								<InfoIcon className="h-3.5 w-3.5" />
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

						{/* Estado y fecha */}
						<div className="flex items-center gap-2">
							<span
								className="rounded px-2 py-1 font-medium text-xs"
								style={{
									backgroundColor: uploadedImage.imageId ? '#10b98120' : `${primaryColor}20`,
									color: uploadedImage.imageId ? '#10b981' : primaryColor,
								}}
							>
								{uploadedImage.imageId ? 'Procesado' : 'Pendiente'}
							</span>
							<span className="text-muted-foreground">{new Date(uploadedImage.createdAt).toLocaleDateString()}</span>
						</div>
					</div>

					{/* Barra de progreso estilo TCG */}
					{tcgMode && (
						<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/30">
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${uploadedImage.imageId ? 100 : 75}%`,
									backgroundColor: uploadedImage.imageId ? '#10b981' : primaryColor,
									boxShadow: `0 0 8px ${uploadedImage.imageId ? '#10b981' : primaryColor}50`,
								}}
							/>
						</div>
					)}
				</div>
			</div>
		</CardContainer>
	);
}
