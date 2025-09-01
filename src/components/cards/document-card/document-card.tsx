import { DownloadIcon, EyeIcon, FileTextIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
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
		if (!document.size) {
			return 'N/A';
		}
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

					{/* Efecto holográfico en hover */}
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
					{document.isFavorite && (
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
				<CardHeader compact={compact} emoji="📄" primaryColor={primaryColor} title={document.name || 'Sin nombre'} />
				{/* Contenido principal */}
				{!compact && (
					<div className="flex flex-1 flex-col gap-3 p-4">
						{/* Icono del documento */}
						<div className="flex items-center justify-center py-6">
							<div
								className="relative rounded-2xl p-6"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<FileTextIcon className="h-12 w-12" style={{ color: primaryColor }} />

								{/* Badge del tipo de archivo */}
								<div
									className="-top-2 -right-2 absolute rounded-md px-2 py-1 font-bold text-xs"
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
							<div className="line-clamp-2 text-muted-foreground text-sm italic">{document.summary}</div>
						)}

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
									<span>Páginas</span>
									<span className="font-bold">{document.pageCount || '?'}</span>
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
								title="Descargar"
								type="button"
							>
								<DownloadIcon className="h-3.5 w-3.5" />
							</button>
						</div>

						{/* Fecha de modificación */}
						<span className="text-muted-foreground">{new Date(document.updatedAt).toLocaleDateString()}</span>
					</div>

					{/* Barra de progreso estilo TCG */}
					{tcgMode && (
						<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/30">
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
