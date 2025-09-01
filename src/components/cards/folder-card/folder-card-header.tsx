import { FolderTreeIcon, Star } from 'lucide-react';
import { memo, useMemo } from 'react';

interface FolderCardHeaderProps {
	name: string;
	emoji?: string | null;
	primaryColor: string;
	secondaryColor?: string;
	path?: string;
	tcgMode?: boolean;
	isFavorite?: boolean;
}

/**
 * Componente para el header/encabezado de la tarjeta de carpeta.
 * Diseñado con estilos de carta TCG con efectos holográficos.
 */
export const FolderCardHeader = memo(function FolderCardHeader({
	name,
	emoji,
	primaryColor,
	secondaryColor,
	path,
	tcgMode = false,
	isFavorite = false,
}: FolderCardHeaderProps) {
	// Memoize computed styles to prevent recalculation
	const headerStyles = useMemo(() => {
		const gradientColors = tcgMode
			? `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}50 50%, ${secondaryColor || primaryColor}30 100%)`
			: undefined;

		return {
			background: gradientColors,
			borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
		};
	}, [primaryColor, secondaryColor, tcgMode]);
	// Determinar si es una carpeta raíz basado en la ruta
	const isRootFolder = path === '/' || !path?.includes('/') || path === '';

	// Helper function para determinar el código del tipo de carpeta
	const getFolderTypeCode = (): string => {
		const FOLDER_TYPE_CODES = {
			root: 'ROOT',
			sub: 'SUB',
			standard: 'STD',
		} as const;

		if (path) {
			return isRootFolder ? FOLDER_TYPE_CODES.root : FOLDER_TYPE_CODES.sub;
		}
		return FOLDER_TYPE_CODES.standard;
	};

	// Determinar tipo de carpeta (extraído para bajar complejidad)
	const folderType = (() => {
		if (!path) {
			return 'Folder';
		}
		const mappings: Array<{ test: (p: string) => boolean; label: string }> = [
			{ test: () => isRootFolder, label: 'Root' },
			{ test: (p) => p.includes('system'), label: 'System' },
			{ test: (p) => p.includes('media'), label: 'Media' },
			{ test: (p) => p.includes('archive'), label: 'Archive' },
			{ test: (p) => p.includes('backups'), label: 'Backup' },
			{ test: (p) => p.split('/').length > 3, label: 'Deep' },
		];
		for (const m of mappings) {
			if (m.test(path)) {
				return m.label;
			}
		}
		return 'Folder';
	})();

	return (
		<div className="relative">
			{/* Versión estándar del encabezado */}
			{!tcgMode && (
				<div className="flex items-center border-b px-4 py-2" style={{ borderColor: `${primaryColor}40` }}>
					<div className="mr-3 text-2xl" style={{ filter: `drop-shadow(0 1px 1px ${primaryColor}80)` }}>
						{emoji}
					</div>

					<div className="min-w-0 flex-1">
						<h3 className="truncate font-semibold text-base" style={{ color: primaryColor }}>
							{name}
						</h3>
						{path && (
							<p className="truncate text-muted-foreground text-xs">
								{path.length > 30 ? `...${path.substring(path.length - 30)}` : path}
							</p>
						)}
					</div>

					{isFavorite && <Star className="ml-2 h-4 w-4 fill-yellow-200 text-yellow-400" />}
				</div>
			)}

			{/* Versión TCG del encabezado */}
			{tcgMode && (
				<div className="relative overflow-hidden">
					{/* Fondo con degradado */}
					<div
						className="absolute inset-0 z-0"
						style={{
							background: `linear-gradient(to right, ${primaryColor}80, ${primaryColor}40, transparent)`,
							opacity: 0.9,
						}}
					/>

					{/* Textura para el fondo */}
					<div className="absolute inset-0 z-0 bg-noise-subtle opacity-10 mix-blend-overlay" />

					{/* Encabezado principal con nombre y emoji */}
					<div className="relative z-10 flex items-center p-3">
						<div
							className="relative mr-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2"
							style={{
								borderColor: `${primaryColor}`,
								background: `radial-gradient(circle, ${primaryColor}40, ${primaryColor}20)`,
								boxShadow: `0 0 10px ${primaryColor}40`,
							}}
						>
							<span className="text-xl drop-shadow-md">{emoji}</span>

							{/* Resplandor del emoji */}
							<div className="absolute inset-0 opacity-60 blur-md" style={{ backgroundColor: `${primaryColor}30` }} />
						</div>

						<div className="min-w-0 flex-1">
							<h3
								className="truncate font-bold text-lg"
								style={{
									color: 'white',
									textShadow: `0 0 3px ${primaryColor}, 0 0 5px rgba(0,0,0,0.5)`,
								}}
							>
								{name}
							</h3>
							{path && (
								<div className="flex items-center text-xs">
									<FolderTreeIcon className="mr-1 h-3 w-3 text-white/70" />
									<p className="truncate text-white/70">
										{path.length > 30 ? `...${path.substring(path.length - 30)}` : path}
									</p>
								</div>
							)}
						</div>

						{isFavorite && <Star className="ml-2 h-5 w-5 fill-yellow-200 text-yellow-400" />}
					</div>

					{/* Barra inferior con tipo de carpeta */}
					<div
						className="flex items-center justify-between border-y bg-black/40 px-3.5 py-1.5 text-white text-xs"
						style={{
							borderBottom: `1px solid ${primaryColor}50`,
							borderTop: `1px solid ${primaryColor}30`,
							boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
						}}
					>
						<span className="font-semibold tracking-wide">{folderType}</span>
						<span
							className="rounded-sm bg-black/30 px-1.5 py-0.5 text-[10px] opacity-80"
							style={{ border: `1px solid ${primaryColor}40` }}
						>
							{getFolderTypeCode()}-{name.substring(0, 3).toUpperCase()}
						</span>
					</div>
				</div>
			)}
		</div>
	);
});
