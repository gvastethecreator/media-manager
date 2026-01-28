import { ViewOptionsDebug } from '@/components/debug/view-options-debug';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { cleanupLargeLocalStorageItems, debugLocalStorageSize } from '@/utils/debug-localStorage';

/**
 * Componente de debug para probar includeSubfolders específicamente
 */
export function IncludeSubfoldersDebug() {
	const includeSubfolders = useViewOptionsStore((state) => state.includeSubfolders);
	const toggleIncludeSubfolders = useViewOptionsStore((state) => state.toggleIncludeSubfolders);
	const setIncludeSubfolders = useViewOptionsStore((state) => state.setIncludeSubfolders);
	const resetLocalStorage = useViewOptionsStore((state) => state.resetLocalStorage);

	return (
		<Card className="m-4 border-destructive">
			<CardHeader>
				<CardTitle className="text-destructive">🚨 Debug: includeSubfolders Issue</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="font-medium">includeSubfolders:</span>
							<Badge variant={includeSubfolders ? 'destructive' : 'secondary'}>
								{includeSubfolders ? 'TRUE (PROBLEMA)' : 'FALSE (NORMAL)'}
							</Badge>
						</div>
						<div className="text-muted-foreground text-xs">
							Debe ser FALSE por defecto. Si es TRUE siempre, hay un bug.
						</div>
					</div>
					<div className="space-y-2">
						<Button onClick={toggleIncludeSubfolders} size="sm" variant={includeSubfolders ? 'destructive' : 'default'}>
							Toggle: {includeSubfolders ? 'Desactivar' : 'Activar'}
						</Button>
						<Button onClick={() => setIncludeSubfolders(false)} size="sm" variant="outline">
							Forzar FALSE
						</Button>
						<Button onClick={() => setIncludeSubfolders(true)} size="sm" variant="outline">
							Forzar TRUE
						</Button>
					</div>
				</div>

				<div className="space-y-2">
					<Button className="w-full" onClick={resetLocalStorage} size="sm" variant="destructive">
						🗑️ Reset localStorage y Recargar
					</Button>
					<Button className="w-full" onClick={() => debugLocalStorageSize()} size="sm" variant="outline">
						🔍 Debug localStorage Size
					</Button>
					<Button className="w-full" onClick={() => cleanupLargeLocalStorageItems()} size="sm" variant="secondary">
						🧹 Limpiar Items Grandes
					</Button>
					<div className="text-muted-foreground text-xs">
						Usar si el estado está corrupto en localStorage o hay error 431
					</div>
				</div>

				<div className="border-t pt-4">
					<h4 className="mb-2 font-medium">Pruebas Manuales:</h4>
					<ol className="list-inside list-decimal space-y-1 text-sm">
						<li>Verificar que el estado inicial sea FALSE</li>
						<li>Hacer toggle y verificar que cambie</li>
						<li>Recargar página y verificar persistencia</li>
						<li>Ver si los archivos de subcarpetas aparecen/desaparecen correctamente</li>
					</ol>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Componente debug completo que incluye ViewOptionsDebug
 */
export function CompleteDebugPanel() {
	return (
		<div className="space-y-4">
			<ViewOptionsDebug />
			<IncludeSubfoldersDebug />
		</div>
	);
}
