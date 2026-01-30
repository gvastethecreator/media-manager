/**
 * Utilidad para debuggear el tamaño del localStorage
 */
export function debugLocalStorageSize() {
	if (typeof window === 'undefined' || !window.localStorage) {
		console.log('localStorage no disponible');
		return;
	}

	let totalSize = 0;
	const items: { key: string; size: number; preview: string }[] = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key) continue;

		const value = localStorage.getItem(key) || '';
		const size = new Blob([value]).size;
		totalSize += size;

		items.push({
			key,
			size,
			preview: value.length > 100 ? `${value.substring(0, 100)}...` : value,
		});
	}

	// Ordenar por tamaño descendente
	items.sort((a, b) => b.size - a.size);

	console.group('🔍 Debug localStorage');
	console.log(`📊 Tamaño total: ${(totalSize / 1024).toFixed(2)} KB`);
	console.log(`📋 Items: ${items.length}`);

	if (totalSize > 1024 * 50) {
		// 50KB
		console.warn('⚠️ localStorage muy grande - puede causar problemas con headers HTTP');
	}

	console.table(
		items.map((item) => ({
			key: item.key,
			'size (KB)': (item.size / 1024).toFixed(2),
			preview: item.preview,
		}))
	);

	console.groupEnd();

	return {
		totalSize,
		totalSizeKB: totalSize / 1024,
		items,
	};
}

/**
 * Limpia items grandes del localStorage
 */
export function cleanupLargeLocalStorageItems(maxSizeKB = 10) {
	const debug = debugLocalStorageSize();
	if (!debug) return;

	const maxSizeBytes = maxSizeKB * 1024;
	let removedCount = 0;

	for (const item of debug.items) {
		if (item.size > maxSizeBytes) {
			console.warn(`🗑️ Eliminando item grande: ${item.key} (${(item.size / 1024).toFixed(2)} KB)`);
			localStorage.removeItem(item.key);
			removedCount++;
		}
	}

	if (removedCount > 0) {
		console.log(`✅ Eliminados ${removedCount} items grandes del localStorage`);
		debugLocalStorageSize(); // Mostrar estado después de limpieza
	}
}
