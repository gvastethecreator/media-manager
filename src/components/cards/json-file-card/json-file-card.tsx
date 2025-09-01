import { CheckIcon, DownloadIcon, EyeIcon, FileJsonIcon, XIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';
import type { JsonFileCardProps } from './json-file-card.types';

export function JsonFileCard({
	jsonFile,
	onClick,
	className,
	compact = false,
	tcgMode = true,
	disabled = false,
	isSelected = false,
	isActive = false,
}: JsonFileCardProps) {
	// Si no hay jsonFile, no renderizar nada
	if (!jsonFile) {
		return null;
	}

	const [isHovered, setIsHovered] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

	// Colores primarios y secundarios
	const primaryColor = useMemo(() => {
		if (jsonFile.stats.isValid) {
			return '#10b981'; // Verde esmeralda para JSON válido
		}
		return '#ef4444'; // Rojo para JSON inválido
	}, [jsonFile.stats.isValid]);

	// Estadísticas del JSON
	const jsonStats = useMemo(
		() => ({
			isValid: jsonFile.stats.isValid,
			keys: jsonFile.stats.keyCount,
			size: jsonFile.size,
			depth: jsonFile.stats.nestingDepth,
		}),
		[jsonFile.stats.isValid, jsonFile.stats.keyCount, jsonFile.size, jsonFile.stats.nestingDepth]
	);

	// Preview del contenido JSON (primeras líneas)
	const jsonPreview = useMemo(() => {
		if (!jsonFile.content) return 'Sin contenido';

		try {
			const parsed = JSON.parse(jsonFile.content);
			return `${JSON.stringify(parsed, null, 2).slice(0, 200)}...`;
		} catch {
			return `${jsonFile.content.slice(0, 200)}...`;
		}
	}, [jsonFile.content]);

	const handleClick = useCallback(() => {
		if (onClick && !disabled) {
			onClick();
		}
	}, [onClick, disabled]);

	const togglePreview = useCallback(() => {
		setShowPreview((prev) => !prev);
	}, []);

	const handleMouseEnter = useCallback(() => {
		setIsHovered(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHovered(false);
	}, []);

	return (
		<CardContainer
			className={cn(
				'json-file-card',
				tcgMode && 'tcg-mode',
				compact && 'compact',
				disabled && 'disabled',
				isSelected && 'selected',
				isActive && 'active',
				className
			)}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			style={{
				borderColor: primaryColor,
				boxShadow: tcgMode ? `0 0 15px ${primaryColor}40` : undefined,
			}}
		>
			{/* Header */}
			<CardHeader
				icon={<FileJsonIcon />}
				primaryColor={primaryColor}
				subtitle={`${formatBytes(jsonFile.size)} • ${jsonStats.keys} claves`}
				title={jsonFile.name}
			/>

			{/* Contenido principal */}
			<div className="flex-1 p-3">
				{/* Estado de validación */}
				<div className="mb-2 flex items-center gap-2">
					{jsonStats.isValid ? (
						<div className="flex items-center gap-1 text-green-600">
							<CheckIcon className="h-3 w-3" />
							<span className="text-xs">JSON válido</span>
						</div>
					) : (
						<div className="flex items-center gap-1 text-red-600">
							<XIcon className="h-3 w-3" />
							<span className="text-xs">JSON inválido</span>
						</div>
					)}
					<span className="text-muted-foreground text-xs">Profundidad: {jsonStats.depth}</span>
				</div>

				{/* Schema si está disponible */}
				{jsonFile.schema && <div className="mb-2 text-muted-foreground text-xs">Schema: {jsonFile.schema}</div>}

				{/* Preview del contenido */}
				{showPreview && (
					<div className="rounded bg-muted/50 p-2 font-mono text-xs">
						<pre className="overflow-hidden whitespace-pre-wrap">{jsonPreview}</pre>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="border-border/50 border-t p-3">
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						<button
							className="rounded p-1 hover:bg-muted/50"
							onClick={(e) => {
								e.stopPropagation();
								togglePreview();
							}}
							title="Vista previa"
							type="button"
						>
							<EyeIcon className="h-3 w-3" />
						</button>
						<button
							className="rounded p-1 hover:bg-muted/50"
							onClick={(e) => e.stopPropagation()}
							title="Descargar"
							type="button"
						>
							<DownloadIcon className="h-3 w-3" />
						</button>
					</div>

					<div className="text-muted-foreground text-xs">{jsonFile.extension.toUpperCase()}</div>
				</div>
			</div>

			{/* Efectos TCG */}
			{tcgMode && isHovered && (
				<motion.div
					animate={{ opacity: 0.3 }}
					className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
					style={{
						background: `linear-gradient(45deg, ${primaryColor}50, transparent)`,
					}}
					transition={{ duration: 0.3 }}
				/>
			)}
		</CardContainer>
	);
}
