import type { MetadataField } from '../types';

/**
 * Exporta metadatos a formato CSV
 */
export const exportToCSV = (metadata: MetadataField[], filename = 'metadatos'): void => {
	if (metadata.length === 0) {
		return;
	}

	// Crear encabezados CSV
	const headers = ['Categoría', 'Campo', 'Valor'];
	const csvContent = [
		headers.join(','),
		...metadata.map(({ key, value, category = 'general' }) => {
			// Escapar comillas y comas en los valores
			const escapedValue = `"${value.replace(/"/g, '""')}"`;
			const escapedKey = `"${key.replace(/"/g, '""')}"`;
			const escapedCategory = `"${category.replace(/"/g, '""')}"`;
			return `${escapedCategory},${escapedKey},${escapedValue}`;
		}),
	].join('\n');

	// Crear y descargar archivo
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(link.href);
};

/**
 * Exporta metadatos a formato JSON
 */
export const exportToJSON = (metadata: MetadataField[], filename = 'metadatos'): void => {
	if (metadata.length === 0) {
		return;
	}

	// Agrupar por categoría para mejor estructura JSON
	const groupedMetadata = metadata.reduce(
		(acc, item) => {
			const category = item.category || 'general';
			if (!acc[category]) {
				acc[category] = {};
			}
			acc[category][item.key] = item.value;
			return acc;
		},
		{} as Record<string, Record<string, string>>
	);

	// Crear JSON con metadata adicional
	const exportData = {
		timestamp: new Date().toISOString(),
		total_fields: metadata.length,
		categories: Object.keys(groupedMetadata),
		metadata: groupedMetadata,
	};

	// Crear y descargar archivo
	const blob = new Blob([JSON.stringify(exportData, null, 2)], {
		type: 'application/json;charset=utf-8;',
	});
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `${filename}.json`;
	link.click();
	URL.revokeObjectURL(link.href);
};
