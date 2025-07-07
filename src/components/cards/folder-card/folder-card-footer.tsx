interface FolderCardFooterProps {
	folder: Pick<FolderBase, 'id' | 'name' | 'color'>;
	tcgMode?: boolean;
	children?: ReactNode;
}

/**
 * Componente para el footer de la tarjeta de carpeta
 * Incluye modo TCG para tarjetas estilo juego de cartas
 */
export function FolderCardFooter({ folder, tcgMode = false, children }: FolderCardFooterProps) {
	const folderId = typeof folder.id === 'string' ? folder.id : '';

	return (
		<div
			className={cn(
				'flex justify-between items-center mt-auto p-2',
				tcgMode ? 'border-t border-white/20 bg-black/40' : 'bg-card'
			)}
			style={!tcgMode ? { borderTop: `1px solid ${folder.color ?? '#000000'}20` } : {}}
		>
			{/* Contenido del footer */}
			<div className="flex items-center gap-2">
				{/* Información de la carta TCG */}
				{tcgMode && (
					<div className="text-xs flex items-center">
						<div
							className="w-5 h-5 flex items-center justify-center rounded-full bg-black/50 border border-white/10"
							style={{ borderColor: `${folder.color ?? '#000000'}50` }}
							title="Folder icon"
						>
							<FolderIcon className="w-3 h-3" style={{ color: folder.color ?? '#000000' }} />
						</div>
						<span className="ml-1 text-[0.65rem] font-semibold text-white/70">
							Collection ID: {folderId.slice(0, 8)}
						</span>
					</div>
				)}

				{/* Contenido personalizado */}
				{children}
			</div>
		</div>
	);
}
