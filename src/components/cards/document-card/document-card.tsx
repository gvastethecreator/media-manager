import { DownloadIcon, EyeIcon, FileTextIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentWithStats } from '@/types/entities/document';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

interface DocumentCardProps {
	/** Datos del documento a mostrar */
	document: DocumentWithStats;
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
 * DocumentCard - Componente de tarjeta para documentos inspirado en el diseño de cartas TCG
 */
export function DocumentCard({
	document,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
	isActive = false,
}: DocumentCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	// Colores para el gradiente basados en el tipo de documento
	const primaryColor = useMemo(() => {
		const ext = document.path?.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'pdf':
				return '#dc2626'; // Rojo para PDF
			case 'doc':
			case 'docx':
				return '#2563eb'; // Azul para Word
			case 'txt':
				return '#059669'; // Verde para texto
			case 'md':
				return '#7c3aed'; // Púrpura para Markdown
			default:
				return '#6b7280'; // Gris para otros
		}
	}, [document.path]);

	const secondaryColor = useMemo(() => {
		// Oscurecer el color primario para el secundario
		const hex = primaryColor.replace('#', '');
		const r = Math.floor(Number.parseInt(hex.slice(0, 2), 16) * 0.6);
		const g = Math.floor(Number.parseInt(hex.slice(2, 4), 16) * 0.6);
		const b = Math.floor(Number.parseInt(hex.slice(4, 6), 16) * 0.6);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}, [primaryColor]);

	// Estadísticas del documento
	const fileSize = useMemo(() => {
		if (!document.size) return 'N/A';
		const mb = document.size / (1024 * 1024);
		if (mb < 1) {
			const kb = document.size / 1024;
			return `${kb.toFixed(1)} KB`;
		}
		return `${mb.toFixed(1)} MB`;
	}, [document.size]);

	const fileExtension = useMemo(() => {
		return document.path?.split('.').pop()?.toUpperCase() || 'DOC';
	}, [document.path]);

	const handleClick = useCallback(() => {
		if (!disabled && onClick) {
			onClick();
		}
	}, [disabled, onClick]);

	const handleMouseEnter = useCallback(() => setIsHovered(true), []);
	const handleMouseLeave = useCallback(() => setIsHovered(false), []);

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

					{/* Efecto holográfico en hover */}
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
					{document.isFavorite && (
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
					title={document.name || 'Sin nombre'}
					emoji="📄"
					color={primaryColor}
					isFavorite={document.isFavorite || false}
					compact={compact}

				{/* Contenido principal */}
				{!compact && (
					<div className="flex-1 p-4 flex flex-col gap-3">
						{/* Icono del documento */}
						<div className="flex items-center justify-center py-6">
							<div
								className="relative p-6 rounded-2xl"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<FileTextIcon className="h-12 w-12" style={{ color: primaryColor }} />

								{/* Badge del tipo de archivo */}
								<div
									className="absolute -top-2 -right-2 px-2 py-1 rounded-md text-xs font-bold"
									style={{
										backgroundColor: primaryColor,
										color: 'white',
									}}
								>
									{fileExtension}
								</div>
							</div>
						</div>

						{/* Descripción */}
						{document.summary && (
							<div className="text-sm text-muted-foreground line-clamp-2 italic">{document.summary}</div>
						)}

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
									<span>Páginas</span>
									<span className="font-bold">{document.pageCount || '?'}</span>
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
								title="Descargar"
							>
								<DownloadIcon className="h-3.5 w-3.5" />
							</button>
						</div>

						{/* Fecha de modificación */}
						<span className="text-muted-foreground">{new Date(document.updatedAt).toLocaleDateString()}</span>
					</div>

					{/* Barra de progreso estilo TCG */}
					{tcgMode && (
						<div className="mt-2 h-1 w-full rounded-full overflow-hidden bg-muted/30">
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${Math.min(100, ((document.size || 0) / (1024 * 1024)) * 10)}%`,
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
