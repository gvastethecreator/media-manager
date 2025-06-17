// Vista de archivos JSON
import { JsonFileCard } from '@/components/entities/json-file/json-file-card';
import { JsonFileViewer } from './json-file-viewer';

/**
 * Vista de ejemplo para archivos JSON
 * Mostrará una lista de archivos con cards y soporte futuro para edición/visualización.
 */
export function JsonFilesView() {
	// Ejemplo de datos mock
	const files = [{ name: 'config.json' }, { name: 'data.json' }];

	// Datos de ejemplo para el visor
	const exampleJson = {
		nombre: 'Demo',
		version: 1,
		items: [
			{ id: 1, valor: 'A' },
			{ id: 2, valor: 'B' },
		],
	};

	return (
		<>
			<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{files.map((file) => (
					<JsonFileCard key={file.name} name={file.name} />
				))}
			</div>
			<JsonFileViewer name="config.json" json={exampleJson} />
			{/* Próximamente: visor/edición de JSON */}
		</>
	);
}

/**
 * 📝 Documentación:
 * - Esta vista lista archivos JSON y permitirá edición/visualización.
 * - Extensible para validación y edición avanzada.
 */
