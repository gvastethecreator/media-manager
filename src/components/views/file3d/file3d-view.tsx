// Vista de archivos 3D
import { File3DCard } from '@/components/entities/file3d/file3d-card';

/**
 * Vista de ejemplo para archivos 3D
 * Mostrará una lista de archivos 3D con cards y soporte futuro para previsualización interactiva.
 */
export function File3DView() {
	// Ejemplo de datos mock
	const files = [
		{ name: 'Modelo 1', format: 'glb' },
		{ name: 'Escena', format: 'obj' },
	];

	return (
		<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{files.map((file) => (
				<File3DCard key={file.name} name={file.name} format={file.format} />
			))}
			{/* Próximamente: visor 3D interactivo */}
		</div>
	);
}

/**
 * 📝 Documentación:
 * - Esta vista lista archivos 3D y permitirá previsualización interactiva.
 * - Extensible para soporte de múltiples formatos y controles de cámara.
 */
