import { CheckIcon, DownloadIcon, EyeIcon, FileJsonIcon, XIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { darkenHex } from '@/components/cards/shared/rarity-style';
import { motion } from '@/components/ui/motion-shim';
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
export function JsonFileCard(props: JsonFileCardProps) {
	const state = useJsonFileCardState(props);
	if (state.isLoading) {
		return <LoadingState className={props.className} />;
	}
	if (state.error || !state.jsonFile) {
		return <ErrorState className={props.className} error={state.error} />;
	}
	return <JsonFileCardView {...state} />;
}

// ---- Hook de estado y derivaciones ----
interface JsonStats {
	isValid: boolean;
	keys: number;
	size: number;
	type?: string;
}

interface JsonFileCardState extends JsonFileCardProps {
	jsonFile?: JsonFileWithStats;
	isLoading: boolean;
	error: Error | null;
	isHovered: boolean;
	showPreview: boolean;
	primaryColor: string;
	secondaryColor: string;
	jsonStats: JsonStats;
	jsonPreview: string;
	cardHeightClass: string;
	togglePreview: () => void;
	handleClick: () => void;
	handleMouseEnter: () => void;
	handleMouseLeave: () => void;
}

function useJsonFileCardState({
	jsonFileId,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
	isActive = false,
}: JsonFileCardProps): JsonFileCardState {
	const { data: jsonFile, isLoading, error } = useJsonFile(jsonFileId);
	const [isHovered, setIsHovered] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

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
	const togglePreview = useCallback(() => setShowPreview((p) => !p), []);

	const primaryColor = useMemo(() => computePrimaryColor(jsonFile), [jsonFile]);
	const secondaryColor = useMemo(() => darkenHex(primaryColor, 0.6), [primaryColor]);
	const jsonStats = useMemo(() => computeJsonStats(jsonFile), [jsonFile]);
	const jsonPreview = useMemo(() => computeJsonPreview(jsonFile), [jsonFile]);

	const CARD_HEIGHT = { compact: 'h-32', preview: 'h-96', default: 'h-64' } as const;
	let cardHeightClass: (typeof CARD_HEIGHT)[keyof typeof CARD_HEIGHT] = CARD_HEIGHT.default;
	if (compact) {
		cardHeightClass = CARD_HEIGHT.compact;
	} else if (showPreview) {
		cardHeightClass = CARD_HEIGHT.preview;
	}

	return {
		jsonFileId,
		compact,
		tcgMode,
		disabled,
		className,
		onClick,
		isSelected,
		isActive,
		jsonFile,
		isLoading,
		error: error as Error | null,
		isHovered,
		showPreview,
		primaryColor,
		secondaryColor,
		jsonStats,
		jsonPreview,
		cardHeightClass,
		togglePreview,
		handleClick,
		handleMouseEnter,
		handleMouseLeave,
	};
}

// ---- Helpers puros ----
function computePrimaryColor(jsonFile?: JsonFileWithStats): string {
	if (!jsonFile) {
		return '#6b7280';
	}
	try {
		if (jsonFile.content) {
			JSON.parse(jsonFile.content);
			return '#10b981';
		}
		return '#f59e0b';
	} catch {
		return '#ef4444';
	}
}

// darkenHex ahora centralizado en shared/rarity-style

function computeJsonStats(jsonFile?: JsonFileWithStats): JsonStats {
	if (!jsonFile) {
		return { isValid: false, keys: 0, size: 0 };
	}
	try {
		if (!jsonFile.content) {
			return { isValid: false, keys: 0, size: 0 };
		}
		const parsed = JSON.parse(jsonFile.content);
		const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
		const size = new Blob([jsonFile.content]).size;
		return { isValid: true, keys, size, type: Array.isArray(parsed) ? 'Array' : typeof parsed };
	} catch {
		return { isValid: false, keys: 0, size: jsonFile.content ? new Blob([jsonFile.content]).size : 0 };
	}
}

function computeJsonPreview(jsonFile?: JsonFileWithStats): string {
	if (!jsonFile?.content) {
		return '';
	}
	try {
		return JSON.stringify(JSON.parse(jsonFile.content), null, 2);
	} catch {
		return jsonFile.content;
	}
}

// ---- Presentacional ----
const JsonFileCardView: React.FC<JsonFileCardState> = ({
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	isSelected = false,
	isActive = false,
	jsonFile,
	primaryColor,
	secondaryColor,
	jsonStats,
	jsonPreview,
	showPreview,
	isHovered,
	cardHeightClass,
	togglePreview,
	handleClick,
	handleMouseEnter,
	handleMouseLeave,
}) => {
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
				cardHeightClass,
				className
			)}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{tcgMode && jsonFile && (
				<TcgEffects
					isFavorite={jsonFile.isFavorite}
					isHovered={isHovered}
					jsonStats={jsonStats}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>
			)}
			<div className="relative z-1 flex h-full flex-col">
				<CardHeader compact={compact} primaryColor={primaryColor} title={jsonFile?.name || 'Sin nombre'} />
				{!compact && (
					<div className="flex flex-1 flex-col gap-3 p-4">
						<JsonIconBlock jsonStats={jsonStats} primaryColor={primaryColor} />
						{showPreview ? (
							<JsonPreviewBlock jsonPreview={jsonPreview} />
						) : (
							tcgMode && <JsonStatsGrid jsonStats={jsonStats} primaryColor={primaryColor} />
						)}
					</div>
				)}
				<CardFooter
					date={jsonFile?.updatedAt}
					jsonStats={jsonStats}
					primaryColor={primaryColor}
					showPreview={showPreview}
					tcgMode={tcgMode}
					togglePreview={togglePreview}
				/>
			</div>
		</CardContainer>
	);
};

const LoadingState: React.FC<{ className?: string }> = ({ className }) => (
	<div
		className={cn(
			'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
			className
		)}
	>
		<p className="text-gray-500">Cargando archivo JSON...</p>
	</div>
);

const ErrorState: React.FC<{ className?: string; error: Error | null }> = ({ className, error }) => (
	<div
		className={cn(
			'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
			className
		)}
	>
		<p className="text-red-800">Error: {error?.message || 'Archivo JSON no encontrado'}</p>
	</div>
);

const TcgEffects: React.FC<{
	primaryColor: string;
	secondaryColor: string;
	jsonStats: JsonStats;
	isHovered: boolean;
	isFavorite: boolean;
}> = ({ primaryColor, secondaryColor, jsonStats, isHovered, isFavorite }) => (
	<>
		<div
			className="absolute inset-0 opacity-10"
			style={{ background: `linear-gradient(135deg, ${primaryColor}20 0%, transparent 50%, ${secondaryColor}20 100%)` }}
		/>
		{jsonStats.isValid && isHovered && (
			<motion.div
				animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
				className="pointer-events-none absolute inset-0 opacity-20"
				style={{
					background: `linear-gradient(45deg, transparent 30%, ${primaryColor}40 50%, transparent 70%)`,
					backgroundSize: '200% 200%',
				}}
				transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
			/>
		)}
		{isFavorite && (
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
);

const JsonIconBlock: React.FC<{ primaryColor: string; jsonStats: JsonStats }> = ({ primaryColor, jsonStats }) => (
	<div className="flex items-center justify-center py-4">
		<div
			className="relative rounded-2xl p-6"
			style={{ backgroundColor: `${primaryColor}20`, border: `2px solid ${primaryColor}40` }}
		>
			<FileJsonIcon className="h-12 w-12" style={{ color: primaryColor }} />
			<div
				className="-top-2 -right-2 absolute rounded-full p-1"
				style={{ backgroundColor: primaryColor, color: 'white' }}
			>
				{jsonStats.isValid ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
			</div>
		</div>
	</div>
);

const JsonPreviewBlock: React.FC<{ jsonPreview: string }> = ({ jsonPreview }) => (
	<motion.div
		animate={{ opacity: 1, height: 'auto' }}
		className="max-h-32 overflow-auto rounded-lg bg-muted/30 p-3 font-mono text-xs"
		exit={{ opacity: 0, height: 0 }}
		initial={{ opacity: 0, height: 0 }}
	>
		<pre className="whitespace-pre-wrap text-muted-foreground">{jsonPreview}</pre>
	</motion.div>
);

const JsonStatsGrid: React.FC<{ primaryColor: string; jsonStats: JsonStats }> = ({ primaryColor, jsonStats }) => (
	<div className="grid grid-cols-2 gap-2 text-xs">
		<StatItem label="Claves" primaryColor={primaryColor} value={jsonStats.keys} />
		<StatItem label="Tamaño" primaryColor={primaryColor} value={formatBytes(jsonStats.size)} />
		<StatItem label="Tipo" primaryColor={primaryColor} span value={jsonStats.type || 'N/A'} />
	</div>
);

const StatItem: React.FC<{ label: string; value: string | number; primaryColor: string; span?: boolean }> = ({
	label,
	value,
	primaryColor,
	span = false,
}) => (
	<div
		className={cn('flex items-center justify-between rounded px-2 py-1', span && 'col-span-2')}
		style={{ backgroundColor: `${primaryColor}20` }}
	>
		<span>{label}</span>
		<span className="font-bold">{value}</span>
	</div>
);

const CardFooter: React.FC<{
	togglePreview: () => void;
	showPreview: boolean;
	primaryColor: string;
	jsonStats: JsonStats;
	date?: string | Date;
	tcgMode: boolean;
}> = ({ togglePreview, showPreview, primaryColor, jsonStats, date, tcgMode }) => (
	<div className="border-border/20 border-t p-3">
		<div className="flex items-center justify-between text-xs">
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
			<div className="flex items-center justify-between text-xs">
				<span
					className="rounded px-2 py-1 font-medium text-xs"
					style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
				>
					{jsonStats.isValid ? 'Válido' : 'Inválido'}
				</span>
				<span className="text-muted-foreground">{date ? new Date(date).toLocaleDateString() : ''}</span>
			</div>
		</div>
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
);
