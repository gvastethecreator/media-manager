import { useCallback, useState } from 'react';

/**
 * Hook para manejar los valores de edición de la carpeta
 */
export function useEditValues(folder: any) {
	const [editValues, setEditValues] = useState({
		emoji: folder.emoji || '',
		description: folder.description || '',
		isFavorite: folder.isFavorite,
	});

	const handleEditValuesChange = useCallback((updates: Partial<typeof editValues>) => {
		setEditValues((prev) => ({ ...prev, ...updates }));
	}, []);

	const resetEditValues = useCallback(() => {
		setEditValues({
			emoji: folder.emoji || '',
			description: folder.description || '',
			isFavorite: folder.isFavorite,
		});
	}, [folder.emoji, folder.description, folder.isFavorite]);

	return {
		editValues,
		handleEditValuesChange,
		resetEditValues,
	};
}
