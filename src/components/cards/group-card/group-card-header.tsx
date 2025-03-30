'use client';

import { cn } from '@/lib/utils';
import { FolderIcon, FolderTreeIcon, LibraryBigIcon, PackageOpenIcon } from 'lucide-react';

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
	color = '#3b82f6',
	category = 'General',
	organizationType = 'Mixto',
	organizationLevel = 1,
	isFavorite = false,
	tcgMode = true,
	compact = false
}: GroupCardHeaderProps) {

	// Función para obtener el icono según el tipo de organización
	const getOrgTypeIcon = () => {
		switch (organizationType.toLowerCase()) {
			case 'archivo':
				return <LibraryBigIcon className="w-3 h-3" />;
			case 'colección':
				return <PackageOpenIcon className="w-3 h-3" />;
			case 'mundo':
				return <FolderTreeIcon className="w-3 h-3" />;
			case 'utilidad':
				return <FolderIcon className="w-3 h-3" />;
			default:
				return <FolderIcon className="w-3 h-3" />;
		}
	};

	return (
		<div
			className={cn(
				"relative overflow-hidden border-b",
				tcgMode ? "border-white/10 bg-gradient-to-r from-black/30 to-transparent" : "border-gray-200",
				compact ? "p-2" : "p-3"
			)}
			style={{
				background: tcgMode
					? `linear-gradient(135deg, ${color}60, ${color}20, transparent)`
					: undefined
			}}
		>
			{/* Fondo decorativo para TCG */}
			{tcgMode && (
				<div className="absolute inset-0 z-0 opacity-20">
					<div className="absolute right-0 inset-y-0 w-1/2 bg-gradient-to-l from-black/40 to-transparent" />
					<div
						className="absolute inset-0"
						style={{
							backgroundImage: `radial-gradient(circle at 30% 50%, ${color}40, transparent 70%)`
						}}
					/>
				</div>
			)}

			<div className="relative z-10 flex items-center">
				{/* Emoji del grupo */}
				<div
					className={cn(
						"flex items-center justify-center rounded",
						tcgMode ? "bg-black/20 p-1" : "bg-white/10 p-0.5",
						compact ? "h-6 w-6 mr-1.5" : "h-8 w-8 mr-2"
					)}
					style={{
						boxShadow: tcgMode ? `0 0 10px ${color}40` : undefined
					}}
				>
					<span className={compact ? "text-lg" : "text-xl"}>{emoji}</span>
				</div>

				{/* Nombre y categoría */}
				<div className="flex-1 min-w-0">
					<h3 className={cn(
						"font-semibold line-clamp-1",
						compact ? "text-sm" : "text-base"
					)}>
						{name}
					</h3>
					<div className="flex items-center">
						<span className={cn(
							"text-xs opacity-80",
							compact ? "line-clamp-1" : ""
						)}>
							{category}
						</span>
					</div>
				</div>

				{/* Tipo de organización y nivel (solo para TCG) */}
				{tcgMode && (
					<div className="flex flex-col items-end ml-2">
						<div className="flex items-center mb-1">
							<span className="text-xs font-medium mr-1">{organizationType}</span>
							{getOrgTypeIcon()}
						</div>

						{/* Indicador visual del nivel de organización */}
						<div className="flex items-center space-x-0.5">
							{Array.from({ length: Math.min(5, organizationLevel) }).map((_, i) => {
								const levelValue = `org-level-${name}-${i + 1}-${organizationLevel}`;
								return (
									<div
										key={levelValue}
										className="w-1.5 h-1.5 rounded-full"
										style={{ backgroundColor: color }}
									/>
								);
							})}
							{organizationLevel > 5 && (
								<span className="text-[10px] ml-1">+{organizationLevel - 5}</span>
							)}
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
			{isFavorite && (
				<div className="absolute top-1 right-1 text-yellow-400 text-xs">
					★
				</div>
			)}
		</div>
	);
}