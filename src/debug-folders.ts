// Debug temporal para probar getAllFolders
import { getFolders } from '@/services/folder/folder.service';

export async function testGetAllFolders() {
	try {
		console.log('🧪 [Debug] Probando getFolders...');
		const result = await getFolders();

		console.log('🧪 [Debug] Resultado de getAllFolders:', {
			isArray: Array.isArray(result),
			length: result ? result.length : 'null',
			data: result,
		});
		return result;
	} catch (error) {
		console.error('🧪 [Debug] Error en getAllFolders:', error);
		throw error;
	}
}
