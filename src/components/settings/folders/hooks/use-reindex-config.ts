import { useCallback, useState } from 'react';

/**
 * Hook para manejar la configuración avanzada de reindexado
 */
export function useReindexConfig() {
	const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
	const [useStructuredFlow, setUseStructuredFlow] = useState(false);
	const [skipThumbnails, setSkipThumbnails] = useState(false);
	const [skipMetadata, setSkipMetadata] = useState(false);

	const getConfig = useCallback(() => {
		return {
			useStructuredFlow,
			skipThumbnails,
			skipMetadata,
		};
	}, [useStructuredFlow, skipThumbnails, skipMetadata]);

	const toggleAdvanced = useCallback(() => {
		setShowAdvancedConfig((prev) => !prev);
	}, []);

	return {
		showAdvancedConfig,
		useStructuredFlow,
		skipThumbnails,
		skipMetadata,
		setShowAdvancedConfig,
		setUseStructuredFlow,
		setSkipThumbnails,
		setSkipMetadata,
		getConfig,
		toggleAdvanced,
	};
}
