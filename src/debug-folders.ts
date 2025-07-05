// Debug temporal para probar getAllFolders
import { getAllFolders } from '@/services/folder/folder.service';

export async function testGetAllFolders() {
	try {
		console.log('🧪 [Debug] Probando getAllFolders...');
		const result = await getAllFolders();

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
