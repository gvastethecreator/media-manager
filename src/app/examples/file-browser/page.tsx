import { FileBrowserExample } from '@/components/features/file-browser/examples/file-browser-example';

export const metadata = {
	title: 'File Browser Example',
	description: 'Ejemplo del navegador de archivos con búsqueda y filtrado avanzado',
};

export default function FileBrowserExamplePage() {
	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-4">Navegador de Archivos</h1>
			<p className="text-muted-foreground mb-6">
				Este ejemplo muestra el navegador de archivos con todas sus funcionalidades: múltiples vistas, búsqueda,
				filtrado avanzado, selección múltiple y acciones sobre archivos.
			</p>

			<FileBrowserExample />

			<div className="mt-8 p-4 bg-muted rounded-md">
				<h2 className="text-lg font-semibold mb-2">Instrucciones</h2>
				<ul className="list-disc pl-5 space-y-1 text-sm">
					<li>
						Usa la <strong>barra de búsqueda</strong> para filtrar archivos por nombre
					</li>
					<li>
						Haz clic en el botón <strong>Filtros</strong> para aplicar filtros avanzados
					</li>
					<li>
						Cambia entre diferentes <strong>modos de vista</strong> con los botones de la barra de herramientas
					</li>
					<li>
						Utiliza los botones <strong>▲</strong> y <strong>▼</strong> para ajustar el tamaño de los elementos
					</li>
					<li>
						Haz <strong>clic</strong> en un archivo para seleccionarlo
					</li>
					<li>
						Mantén <strong>Ctrl</strong> mientras haces clic para seleccionar múltiples archivos
					</li>
					<li>
						Mantén <strong>Shift</strong> mientras haces clic para seleccionar un rango
					</li>
					<li>
						Haz <strong>doble clic</strong> en un archivo para abrirlo
					</li>
					<li>
						Usa el botón <strong>ℹ️</strong> para mostrar/ocultar el panel de detalles
					</li>
				</ul>
			</div>
		</div>
	);
}
