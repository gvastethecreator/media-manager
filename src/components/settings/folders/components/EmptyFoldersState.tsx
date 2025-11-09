import { Folder } from 'lucide-react';
import { memo } from 'react';

export const EmptyFoldersState = memo(function EmptyFoldersState() {
	return (
		<div className="col-span-full py-8 text-center">
			<Folder className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
			<p className="text-muted-foreground text-sm">No hay carpetas indexadas</p>
			<p className="mt-1 text-muted-foreground/75 text-xs">Agrega una carpeta para comenzar a indexar imágenes</p>
		</div>
	);
});
