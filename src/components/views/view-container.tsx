import { memo } from 'react';

export const ViewContainer = memo(function ViewContainer() {
	// NOTA: Este componente ahora es obsoleto ya que React Router maneja todas las rutas.
	// Se mantiene temporalmente para compatibilidad, pero debería ser removido eventualmente.
	
	return (
		<div className="h-full w-full flex items-center justify-center">
			<div className="text-center p-8">
				<h2 className="text-2xl font-bold mb-4">ViewContainer Obsoleto</h2>
				<p className="text-muted-foreground mb-4">
					Este componente ha sido reemplazado por React Router.
				</p>
				<p className="text-sm text-muted-foreground">
					Todas las rutas ahora se manejan en router.tsx
				</p>
			</div>
		</div>
	);
});
