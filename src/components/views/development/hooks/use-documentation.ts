import { useCallback, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
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
			clientLogger.error('Could not load documentation:', error);
			setError('Documentation could not be loaded');
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
