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
		if (!uploadedImage.width || !uploadedImage.height) return 'N/A';
		return `${uploadedImage.width}×${uploadedImage.height}`;
	}, [uploadedImage.width, uploadedImage.height]);

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

					{/* Efecto de brillo en hover */}
					{isHovered && (
						<motion.div
							className="absolute inset-0 opacity-20 pointer-events-none"
							style={{
								background: `linear-gradient(45deg, transparent 30%, ${primaryColor}40 50%, transparent 70%)`,
								backgroundSize: '200% 200%',
							}}
							animate={{
								backgroundPosition: ['0% 0%', '100% 100%'],
							}}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: 'linear',
							}}
						/>
					)}

					{/* Brillo en favoritos */}
					{uploadedImage.isFavorite && (
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
					title={uploadedImage.name || 'Sin nombre'}
					color={primaryColor}
					isFavorite={uploadedImage.isFavorite || false}
					compact={compact}
				/>

				{/* Contenido principal */}
				{!compact && (
					<div className="flex-1 p-4 flex flex-col gap-3">
						{/* Preview de la imagen */}
						<div className="flex items-center justify-center py-2">
							<div
								className="relative rounded-lg overflow-hidden"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
									width: '120px',
									height: '80px',
								}}
							>
								{!imageError ? (
									<img
										src={imageUrl}
										alt={uploadedImage.name || 'Imagen subida'}
										className="object-cover w-full h-full"
										onError={handleImageError}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<ImageIcon className="h-8 w-8" style={{ color: primaryColor }} />
									</div>
								)}

								{/* Badge de la categoría */}
								<div
									className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold"
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
										className="absolute bottom-1 right-1 p-0.5 rounded-full"
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
									<span>Dimensiones</span>
									<span className="font-bold">{dimensions}</span>
								</div>
								<div
									className="col-span-2 flex items-center justify-between px-2 py-1 rounded"
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
				<div className="p-3 border-t border-border/20">
					<div className="flex items-center justify-between text-xs">
						{/* Acciones rápidas */}
						<div className="flex items-center gap-2">
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
								title="Información"
							>
								<InfoIcon className="h-3.5 w-3.5" />
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

						{/* Estado y fecha */}
						<div className="flex items-center gap-2">
							<span
								className="px-2 py-1 rounded text-xs font-medium"
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
						<div className="mt-2 h-1 w-full rounded-full overflow-hidden bg-muted/30">
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
