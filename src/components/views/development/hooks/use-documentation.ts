'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadDocumentationFiles } from '../services/documentation';

export const DOCUMENTATION_FILES = ['PRD.md', 'FRONTEND.md', 'BACKEND.md', 'ROADMAP.md'];

export function useDocumentation() {
	const [isLoading, setIsLoading] = useState(true);
	const [documentationContent, setDocumentationContent] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);

	const fetchDocumentation = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const content = await loadDocumentationFiles(DOCUMENTATION_FILES);
			setDocumentationContent(content);
		} catch (error) {
			console.error('Error al cargar documentación:', error);
			setError('No se pudo cargar la documentación');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDocumentation();
	}, [fetchDocumentation]);

	return {
		isLoading,
		documentationContent,
		error,
		refreshDocumentation: fetchDocumentation,
	};
}
