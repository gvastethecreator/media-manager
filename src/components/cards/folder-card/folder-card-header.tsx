import { FolderTreeIcon, Star } from 'lucide-react';

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
 * Encabezado para tarjeta de carpeta con estilo TCG
 *
 * Muestra el nombre de la carpeta, un emoji personalizado y metadatos
 * sobre la ubicación y tipo de carpeta.
 */
export function FolderCardHeader({
	name,
	emoji = '📁',
	primaryColor,
	secondaryColor,
	path,
	tcgMode = true,
	isFavorite = false
}: FolderCardHeaderProps) {
	// Determinar si es una carpeta raíz basado en la ruta
	const isRootFolder = path === '/' || !path?.includes('/') || path === '';

	// Analizar el tipo de carpeta basado en componentes del path
	let folderType = 'Folder';
	if (path?.includes('system')) {
		folderType = 'System';
	} else if (path?.includes('media')) {
		folderType = 'Media';
	} else if (isRootFolder) {
		folderType = 'Root';
	} else if (path?.includes('archive')) {
		folderType = 'Archive';
	} else if (path?.includes('backups')) {
		folderType = 'Backup';
	} else if (path?.split('/').length > 3) {
		folderType = 'Deep';
	}

	return (
		<div className="relative">
			{/* Versión estándar del encabezado */}
			{!tcgMode && (
				<div
					className="px-4 py-2 flex items-center border-b"
					style={{ borderColor: `${primaryColor}40` }}
				>
					<div
						className="text-2xl mr-3"
						style={{ filter: `drop-shadow(0 1px 1px ${primaryColor}80)` }}
					>
						{emoji}
					</div>

					<div className="flex-1 min-w-0">
						<h3
							className="font-semibold text-base truncate"
							style={{ color: primaryColor }}
						>
							{name}
						</h3>
						{path && (
							<p className="text-xs text-muted-foreground truncate">
								{path.length > 30 ? `...${path.substring(path.length - 30)}` : path}
							</p>
						)}
					</div>

					{isFavorite && (
						<Star className="w-4 h-4 fill-yellow-200 text-yellow-400 ml-2" />
					)}
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
							opacity: 0.9
						}}
					/>

					{/* Textura para el fondo */}
					<div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay bg-noise-subtle" />

					{/* Encabezado principal con nombre y emoji */}
					<div className="p-3 flex items-center relative z-10">
						<div
							className="w-10 h-10 flex items-center justify-center rounded-full border-2 overflow-hidden mr-3 relative"
							style={{
								borderColor: `${primaryColor}`,
								background: `radial-gradient(circle, ${primaryColor}40, ${primaryColor}20)`,
								boxShadow: `0 0 10px ${primaryColor}40`
							}}
						>
							<span className="text-xl drop-shadow-md">{emoji}</span>

							{/* Resplandor del emoji */}
							<div
								className="absolute inset-0 blur-md opacity-60"
								style={{ backgroundColor: `${primaryColor}30` }}
							/>
						</div>

						<div className="flex-1 min-w-0">
							<h3
								className="font-bold text-lg truncate"
								style={{
									color: 'white',
									textShadow: `0 0 3px ${primaryColor}, 0 0 5px rgba(0,0,0,0.5)`
								}}
							>
								{name}
							</h3>
							{path && (
								<div className="flex items-center text-xs">
									<FolderTreeIcon className="w-3 h-3 mr-1 text-white/70" />
									<p className="text-white/70 truncate">
										{path.length > 30 ? `...${path.substring(path.length - 30)}` : path}
									</p>
								</div>
							)}
						</div>

						{isFavorite && (
							<Star className="w-5 h-5 fill-yellow-200 text-yellow-400 ml-2" />
						)}
					</div>

					{/* Barra inferior con tipo de carpeta */}
					<div
						className="text-xs text-white px-3.5 py-1.5 bg-black/40 border-y flex justify-between items-center"
						style={{
							borderBottom: `1px solid ${primaryColor}50`,
							borderTop: `1px solid ${primaryColor}30`,
							boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
						}}
					>
						<span className="font-semibold tracking-wide">{folderType}</span>
						<span
							className="opacity-80 text-[10px] bg-black/30 px-1.5 py-0.5 rounded-sm"
							style={{ border: `1px solid ${primaryColor}40` }}
						>
							{path ? (isRootFolder ? 'ROOT' : 'SUB') : 'STD'}-{name.substring(0, 3).toUpperCase()}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}