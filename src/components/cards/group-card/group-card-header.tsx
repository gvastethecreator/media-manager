import { FolderIcon, FolderTreeIcon, LibraryBigIcon, PackageOpenIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupCardHeaderProps {
	name: string;
	emoji?: string;
	color?: string;
	category?: string;
	organizationType?: string;
	organizationLevel?: number;
	isFavorite?: boolean;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * Encabezado para tarjeta de grupo en estilo TCG
 */
export function GroupCardHeader({
	name,
	emoji = '📂',
	color = 'var(--dt-primary-500)',
	category = 'General',
	organizationType = 'Mixto',
	organizationLevel = 1,
	isFavorite = false,
	tcgMode = true,
	compact = false,
}: GroupCardHeaderProps) {
	// Función para obtener el icono según el tipo de organización
	const getOrgTypeIcon = () => {
		switch (organizationType.toLowerCase()) {
			case 'archivo':
				return <LibraryBigIcon className="h-4 w-4" />;
			case 'colección':
				return <PackageOpenIcon className="h-4 w-4" />;
			case 'mundo':
				return <FolderTreeIcon className="h-4 w-4" />;
			case 'utilidad':
				return <FolderIcon className="h-4 w-4" />;
			default:
				return <FolderIcon className="h-4 w-4" />;
		}
	};

	return (
		<div
			className={cn(
				'relative overflow-hidden border-b',
				tcgMode ? 'border-border/40 bg-gradient-to-r from-black/30 to-transparent' : 'border-border',
				compact ? 'p-2' : 'p-3'
			)}
			style={{
				background: tcgMode ? `linear-gradient(135deg, ${color}60, ${color}20, transparent)` : undefined,
			}}
		>
			{/* Fondo decorativo para TCG */}
			{tcgMode && (
				<div className="absolute inset-0 z-0 opacity-20">
					<div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/40 to-transparent" />
					<div
						className="absolute inset-0"
						style={{
							backgroundImage: `radial-gradient(circle at 30% 50%, ${color}40, transparent 70%)`,
						}}
					/>
				</div>
			)}

			<div className="relative z-10 flex items-center">
				{/* Emoji del grupo */}
				<div
					className={cn(
						'flex items-center justify-center rounded',
						tcgMode ? 'bg-muted/20 p-1' : 'bg-background/10 p-0.5',
						compact ? 'mr-1.5 h-6 w-6' : 'mr-2 h-8 w-8'
					)}
					style={{
						boxShadow: tcgMode ? `0 0 10px ${color}40` : undefined,
					}}
				>
					<span className={compact ? 'text-lg' : 'text-xl'}>{emoji}</span>
				</div>

				{/* Nombre y categoría */}
				<div className="min-w-0 flex-1">
					<h3 className={cn('line-clamp-1 font-semibold', compact ? 'text-sm' : 'text-base')}>{name}</h3>
					<div className="flex items-center">
						<span className={cn('text-sm opacity-80', compact ? 'line-clamp-1' : '')}>{category}</span>
					</div>
				</div>

				{/* Tipo de organización y nivel (solo para TCG) */}
				{tcgMode && (
					<div className="ml-2 flex flex-col items-end">
						<div className="mb-1 flex items-center">
							<span className="mr-1 font-medium text-sm">{organizationType}</span>
							{getOrgTypeIcon()}
						</div>

						{/* Indicador visual del nivel de organización */}
						<div className="flex items-center space-x-0.5">
							{Array.from({ length: Math.min(5, organizationLevel) }).map((_, i) => {
								const levelValue = `org-level-${name}-${i + 1}-${organizationLevel}`;
								return <div className="h-1.5 w-1.5 rounded-full" key={levelValue} style={{ backgroundColor: color }} />;
							})}
							{organizationLevel > 5 && <span className="ml-1 text-xs">+{organizationLevel - 5}</span>}
						</div>
					</div>
				)}
			</div>

			{/* Líneas decorativas para TCG */}
			{tcgMode && (
				<>
					<div
						className="absolute bottom-0 left-0 h-[1px] w-full opacity-30"
						style={{ background: `linear-gradient(90deg, ${color}, transparent 80%)` }}
					/>
					<div
						className="absolute top-0 left-0 h-[1px] w-full opacity-30"
						style={{ background: `linear-gradient(90deg, ${color}, transparent 80%)` }}
					/>
				</>
			)}

			{/* Estrella de favorito */}
			{isFavorite && <div className="absolute top-1 right-1 text-warning text-sm">★</div>}
		</div>
	);
}
