// Editor minimalista para Markdown usando @uiw/react-md-editor
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Import dinámico para evitar problemas SSR
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

/**
 * Editor de Markdown minimalista basado en @uiw/react-md-editor
 * Permite edición y guardado de archivos markdown.
 */
export function MdEditor({ initialValue, onSave }: { initialValue: string; onSave?: (value: string) => void }) {
	const [value, setValue] = useState(initialValue);

	return (
		<Card className="p-4 w-full max-w-2xl mx-auto mt-6">
			<div data-color-mode="light">
				<MDEditor value={value} onChange={setValue} height={300} />
			</div>
			<div className="flex justify-end mt-2">
				<Button onClick={() => onSave?.(value)} variant="default" size="sm">Guardar</Button>
			</div>
		</Card>
	);
}

/**
 * 📝 Documentación:
 * - Editor markdown minimalista, ideal para notas y documentos.
 * - Usa @uiw/react-md-editor, soporta edición básica y guardado.
 * - Extensible para validación, preview y shortcuts.
 */
