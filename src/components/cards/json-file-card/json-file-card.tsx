import { CheckIcon, DownloadIcon, EyeIcon, FileJsonIcon, XIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useJsonFile } from '@/lib/api/json-files';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format'; // Importar formatBytes
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

interface JsonFileCardProps {
	/** ID del archivo JSON a mostrar */
	jsonFileId: string;
	/** Tamaño compacto con menos información */
	compact?: boolean;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
	/** Deshabilitar interacciones */
	disabled?: boolean;
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: (jsonFileData: JsonFileWithStats) => void;
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
	jsonFileId,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
	isActive = false,
}: JsonFileCardProps) {
	const { data: jsonFile, isLoading, error } = useJsonFile(jsonFileId);
	const [isHovered, setIsHovered] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

	// Funciones para manejar eventos
	const handleClick = useCallback(() => {
		if (onClick && jsonFile) {
			onClick(jsonFile);
		}
	}, [onClick, jsonFile]);

	const handleMouseEnter = useCallback(() => {
		setIsHovered(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHovered(false);
	}, []);

	const togglePreview = useCallback(() => {
		setShowPreview((prev) => !prev);
	}, []);

	// Color basado en la validez del JSON
	const primaryColor = useMemo(() => {
		if (!jsonFile) return '#6b7280';
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
	}, [jsonFile?.content, jsonFile]);

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
		if (!jsonFile) return { isValid: false, keys: 0, size: 0 };
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
	}, [jsonFile?.content, jsonFile]);

	// Preview del JSON formateado
	const jsonPreview = useMemo(() => {
		if (!jsonFile?.content) return '';
		try {
			return JSON.stringify(JSON.parse(jsonFile.content), null, 2);
		} catch {
			return jsonFile.content; // Mostrar contenido sin formatear si es inválido
		}
	}, [jsonFile?.content, jsonFile]);

	// Si no hay datos del archivo JSON o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
					className
				)}
			>
				<p className="text-gray-500">Cargando archivo JSON...</p>
			</div>
		);
	}

	if (error || !jsonFile) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Archivo JSON no encontrado'}</p>
			</div>
		);
	}

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
					{jsonFile.isFavorite && (
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
				<CardHeader compact={compact} primaryColor={primaryColor} title={jsonFile.name || 'Sin nombre'} />

				{/* Contenido principal */}
				{!compact && (
					<div className="flex flex-1 flex-col gap-3 p-4">
						{/* Icono del JSON */}
						<div className="flex items-center justify-center py-4">
							<div
								className="relative rounded-2xl p-6"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<FileJsonIcon className="h-12 w-12" style={{ color: primaryColor }} />

								{/* Badge de validez */}
								<div
									className="-top-2 -right-2 absolute rounded-full p-1"
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
								animate={{ opacity: 1, height: 'auto' }}
								className="max-h-32 overflow-auto rounded-lg bg-muted/30 p-3 font-mono text-xs"
								exit={{ opacity: 0, height: 0 }}
								initial={{ opacity: 0, height: 0 }}
							>
								<pre className="whitespace-pre-wrap text-muted-foreground">{jsonPreview}</pre>
							</motion.div>
						)}

						{/* Estadísticas en modo TCG */}
						{tcgMode && !showPreview && (
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div
									className="flex items-center justify-between rounded px-2 py-1"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Claves</span>
									<span className="font-bold">{jsonStats.keys}</span>
								</div>
								<div
									className="flex items-center justify-between rounded px-2 py-1"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Tamaño</span>
									<span className="font-bold">{formatBytes(jsonStats.size)}</span>
								</div>
								<div
									className="col-span-2 flex items-center justify-between rounded px-2 py-1"
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
				<div className="border-border/20 border-t p-3">
					<div className="flex items-center justify-between text-xs">
						{/* Acciones rápidas */}
						<div className="flex items-center gap-2">
							<button
								className="rounded p-1 transition-colors hover:bg-muted/50"
								onClick={togglePreview}
								style={{ color: primaryColor }}
								title={showPreview ? 'Ocultar preview' : 'Mostrar preview'}
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

						{/* Estado y fecha */}
						<div className="flex items-center justify-between text-xs">
							<span
								className="rounded px-2 py-1 font-medium text-xs"
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
						<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/30">
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
