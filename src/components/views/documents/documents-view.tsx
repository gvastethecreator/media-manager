// Vista de documentos Markdown y otros
import { DocumentCard } from '@/components/entities/document/document-card';
import { MdEditor } from './md-editor';

/**
 * Vista de ejemplo para documentos (Markdown, PDF, etc.)
 * Mostrará una lista de documentos con cards y soporte futuro para previsualización.
 */
export function DocumentsView() {
	// Ejemplo de datos mock
	const docs = [
		{ name: 'Manual de usuario', filePath: '/docs/manual.md' },
		{ name: 'Guía de integración', filePath: '/docs/integracion.md' },
	];

	// Estado para demo de edición
	const [editMode, setEditMode] = useState(false);
	const [mdValue, setMdValue] = useState('# Manual de usuario\n\nBienvenido!');

	return (
		<div className="p-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{docs.map((doc) => (
					<DocumentCard key={doc.filePath} name={doc.name} filePath={doc.filePath} />
				))}
			</div>
			<div className="mt-8">
				<button className="btn btn-sm" onClick={() => setEditMode((v) => !v)}>
					{editMode ? 'Ver documento' : 'Editar Markdown'}
				</button>
				{editMode ? (
					<MdEditor initialValue={mdValue} onSave={setMdValue} />
				) : (
					<pre className="bg-muted p-4 rounded mt-2">{mdValue}</pre>
				)}
			</div>
		</div>
	);
}

/**
 * 📝 Documentación:
 * - Esta vista lista documentos y permite futura previsualización.
 * - Extensible para soportar edición y visor de Markdown/PDF.
 */
