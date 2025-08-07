import { memo } from 'react';

export const ViewContainer = memo(function ViewContainer() {
	// NOTA: Este componente ahora es obsoleto ya que React Router maneja todas las rutas.
	// Se mantiene temporalmente para compatibilidad, pero debería ser removido eventualmente.

	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="p-0 text-center">
				<h2 className="mb-4 font-bold text-2xl">ViewContainer Obsoleto</h2>
				<p className="mb-4 text-muted-foreground">Este componente ha sido reemplazado por React Router.</p>
				<p className="text-muted-foreground text-sm">Todas las rutas ahora se manejan en router.tsx</p>
			</div>
		</div>
	);
});
