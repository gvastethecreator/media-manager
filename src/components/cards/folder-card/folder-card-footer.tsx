import type { Folder } from '@prisma/client';
import { Folder as FolderIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FolderCardFooterProps {
	folder: Pick<Folder, 'id' | 'name' | 'color'>;
	tcgMode?: boolean;
	children?: ReactNode;
}

/**
 * Componente para el footer de la tarjeta de carpeta
 * Incluye modo TCG para tarjetas estilo juego de cartas
 */
export function FolderCardFooter({ folder, tcgMode = false, children }: FolderCardFooterProps) {
	return (
		<div
			className={cn(
				'flex justify-between items-center mt-auto p-2',
				tcgMode ? 'border-t border-white/20 bg-black/40' : 'bg-card'
			)}
			style={!tcgMode ? { borderTop: `1px solid ${folder.color}20` } : {}}
		>
			{/* Contenido del footer */}
			<div className="flex items-center gap-2">
				{/* Información de la carta TCG */}
				{tcgMode && (
					<div className="text-xs flex items-center">
						<div
							className="w-5 h-5 flex items-center justify-center rounded-full bg-black/50 border border-white/10"
							style={{ borderColor: `${folder.color}50` }}
							title="Folder icon"
						>
							<FolderIcon className="w-3 h-3" style={{ color: folder.color }} />
						</div>
						<span className="ml-1 text-[0.65rem] font-semibold text-white/70">
							Collection ID: {folder.id.slice(0, 8)}
						</span>
					</div>
				)}

				{/* Contenido personalizado */}
				{children}
			</div>
		</div>
	);
}
