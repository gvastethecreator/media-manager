import { FolderIcon } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { FolderBase } from '@/types/entities/folder';

interface FolderCardFooterProps {
	folder: Pick<FolderBase, 'id' | 'name' | 'color'>;
	tcgMode?: boolean;
	children?: ReactNode;
}

/**
 * Componente para el footer de la tarjeta de carpeta.
 * Diseñado con estilo de carta TCG para mostrar información adicional y efectos visuales.
 */
export const FolderCardFooter = memo(function FolderCardFooter({
	folder,
	tcgMode = false,
	children,
}: FolderCardFooterProps) {
	const folderId = typeof folder.id === 'string' ? folder.id : '';

	return (
		<div
			className={cn(
				'mt-auto flex items-center justify-between p-2',
				tcgMode ? 'border-border/60 border-t bg-muted/40' : 'bg-card'
			)}
			style={tcgMode ? {} : { borderTop: `1px solid ${folder.color ?? 'var(--dt-neutral-950)'}20` }}
		>
			{/* Contenido del footer */}
			<div className="flex items-center gap-2">
				{/* Información de la carta TCG */}
				{tcgMode && (
					<div className="flex items-center text-sm">
						<div
							className="flex h-5 w-5 items-center justify-center rounded-full border border-border/40 bg-muted/50"
							style={{ borderColor: `${folder.color ?? 'var(--dt-neutral-950)'}50` }}
							title="Folder icon"
						>
							<FolderIcon className="h-4 w-4" style={{ color: folder.color ?? 'var(--dt-neutral-950)' }} />
						</div>
						<span className="ml-1 font-semibold text-[0.65rem] text-white/70">
							Collection ID: {folderId.slice(0, 8)}
						</span>
					</div>
				)}

				{/* Contenido personalizado */}
				{children}
			</div>
		</div>
	);
});
