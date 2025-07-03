import { CheckIcon, DownloadIcon, EyeIcon, FileJsonIcon, XIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

interface JsonFileCardProps {
	/** Datos del archivo JSON a mostrar */
	jsonFile: JsonFileWithStats;
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
 * JsonFileCard - Componente de tarjeta para archivos JSON con preview integrado
 */
export function JsonFileCard({
	jsonFile,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
	isActive = false,
	isScrolling = false,
	shouldLoad = true,
}: JsonFileCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

	// Color basado en la validez del JSON
	const primaryColor = useMemo(() => {
		// Intentar parsear el contenido para determinar si es válido
		try {
			if (jsonFile.content) {
				JSON.parse(jsonFile.content);
				return '#10b981'; // Verde para JSON válido
			}
			return '#f59e0b'; // Amarillo para JSON vacío
		} catch {
			return '#ef4444'; // Rojo para JSON inválido
		}
	}, [jsonFile.content]);

	const secondaryColor = useMemo(() => {
		// Oscurecer el color primario para el secundario
		const hex = primaryColor.replace('#', '');
		const r = Math.floor(Number.parseInt(hex.slice(0, 2), 16) * 0.6);
		const g = Math.floor(Number.parseInt(hex.slice(2, 4), 16) * 0.6);
		const b = Math.floor(Number.parseInt(hex.slice(4, 6), 16) * 0.6);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}, [primaryColor]);

	// Estadísticas del JSON
	const jsonStats = useMemo(() => {
		try {
			if (!jsonFile.content) return { isValid: false, keys: 0, size: 0 };

			const parsed = JSON.parse(jsonFile.content);
			const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
			const size = new Blob([jsonFile.content]).size;

			return {
				isValid: true,
				keys,
				size,
				type: Array.isArray(parsed) ? 'Array' : typeof parsed,
			};
		} catch {
			return {
				isValid: false,
				keys: 0,
				size: jsonFile.content ? new Blob([jsonFile.content]).size : 0,
			};
		}
	}, [jsonFile.content]);

	// Formatear tamaño
	const formatSize = useCallback((bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}, []);

	// Preview del contenido JSON
	const jsonPreview = useMemo(() => {
		if (!jsonFile.content) return 'Archivo vacío';

		try {
			const parsed = JSON.parse(jsonFile.content);
			return `${JSON.stringify(parsed, null, 2).substring(0, 200)}...`;
		} catch {
			return 'JSON inválido';
		}
	}, [jsonFile.content]);

	const handleClick = useCallback(() => {
		if (!disabled && onClick) {
			onClick();
		}
	}, [disabled, onClick]);

	const handleMouseEnter = useCallback(() => setIsHovered(true), []);
	const handleMouseLeave = useCallback(() => setIsHovered(false), []);

	const togglePreview = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setShowPreview(!showPreview);
		},
		[showPreview]
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
				compact ? 'h-32' : showPreview ? 'h-96' : 'h-64',
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

					{/* Efecto de validación */}
					{jsonStats.isValid && isHovered && (
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
					{jsonFile.isFavorite && (
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
					title={jsonFile.name || 'Sin nombre'}
					emoji="📋"
					color={primaryColor}
					isFavorite={jsonFile.isFavorite || false}
					compact={compact}
				/>

				{/* Contenido principal */}
				{!compact && (
					<div className="flex-1 p-4 flex flex-col gap-3">
						{/* Icono del JSON */}
						<div className="flex items-center justify-center py-4">
							<div
								className="relative p-6 rounded-2xl"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<FileJsonIcon className="h-12 w-12" style={{ color: primaryColor }} />

								{/* Badge de validez */}
								<div
									className="absolute -top-2 -right-2 p-1 rounded-full"
									style={{
										backgroundColor: primaryColor,
										color: 'white',
									}}
								>
									{jsonStats.isValid ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
								</div>
							</div>
						</div>

						{/* Preview del JSON */}
						{showPreview && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="bg-muted/30 rounded-lg p-3 text-xs font-mono overflow-auto max-h-32"
							>
								<pre className="whitespace-pre-wrap text-muted-foreground">{jsonPreview}</pre>
							</motion.div>
						)}

						{/* Descripción */}
						{jsonFile.description && !showPreview && (
							<div className="text-sm text-muted-foreground line-clamp-2 italic">{jsonFile.description}</div>
						)}

						{/* Estadísticas en modo TCG */}
						{tcgMode && !showPreview && (
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div
									className="flex items-center justify-between px-2 py-1 rounded"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Claves</span>
									<span className="font-bold">{jsonStats.keys}</span>
								</div>
								<div
									className="flex items-center justify-between px-2 py-1 rounded"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Tamaño</span>
									<span className="font-bold">{formatSize(jsonStats.size)}</span>
								</div>
								<div
									className="col-span-2 flex items-center justify-between px-2 py-1 rounded"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Tipo</span>
									<span className="font-bold">{jsonStats.type || 'N/A'}</span>
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
								onClick={togglePreview}
								className="p-1 rounded hover:bg-muted/50 transition-colors"
								style={{ color: primaryColor }}
								title={showPreview ? 'Ocultar preview' : 'Mostrar preview'}
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

						{/* Estado y fecha */}
						<div className="flex items-center gap-2">
							<span
								className="px-2 py-1 rounded text-xs font-medium"
								style={{
									backgroundColor: `${primaryColor}20`,
									color: primaryColor,
								}}
							>
								{jsonStats.isValid ? 'Válido' : 'Inválido'}
							</span>
							<span className="text-muted-foreground">{new Date(jsonFile.updatedAt).toLocaleDateString()}</span>
						</div>
					</div>

					{/* Barra de progreso estilo TCG */}
					{tcgMode && (
						<div className="mt-2 h-1 w-full rounded-full overflow-hidden bg-muted/30">
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${jsonStats.isValid ? 100 : 50}%`,
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
