// Editor minimalista para Markdown
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import 'easymde/dist/easymde.min.css';
import { useState } from 'react';
import SimpleMDE from 'react-simplemde-editor';

/**
 * Editor de Markdown minimalista basado en SimpleMDE
 * Permite edición y guardado de archivos markdown.
 */
export function MarkdownEditor({ initialValue, onSave }: { initialValue: string; onSave?: (value: string) => void }) {
	const [value, setValue] = useState(initialValue);

	return (
		<Card className="p-4 w-full max-w-2xl mx-auto mt-6">
			<SimpleMDE value={value} onChange={setValue} options={{ spellChecker: false, status: false }} />
			<div className="flex justify-end mt-2">
				<Button onClick={() => onSave?.(value)} variant="default" size="sm">
					Guardar
				</Button>
			</div>
		</Card>
	);
}

/**
 * 📝 Documentación:
 * - Editor markdown minimalista, ideal para notas y documentos.
 * - Usa SimpleMDE, soporta edición básica y guardado.
 * - Extensible para validación, preview y shortcuts.
 */
