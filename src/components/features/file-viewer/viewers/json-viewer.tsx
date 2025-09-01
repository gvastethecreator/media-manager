/**
 * Placeholder simple para visualizar JSON
 */
import { useMemo } from 'react';

export function JsonViewer({ value }: { value: unknown }) {
	const pretty = useMemo(() => {
		try {
			return typeof value === 'string' ? JSON.stringify(JSON.parse(value), null, 2) : JSON.stringify(value, null, 2);
		} catch {
			return typeof value === 'string' ? value : String(value);
		}
	}, [value]);
	return <pre className="max-h-[60vh] overflow-auto rounded-md bg-muted p-3 text-xs">{pretty}</pre>;
}
