/**
 * 🧪 Script de prueba para servicios de medios migrados a Drizzle
 * @description Valida DocumentService, AudioService y File3DService
 */

import { getAudioById, getAudios } from '@/services/audio/audio.service';
import { getDocumentById, getDocuments } from '@/services/document/document.service';
import { getFile3DById, getFile3Ds } from '@/services/file3d/file3d.service';

async function testDocumentService() {
	console.log('\n📄 === PRUEBAS DE DOCUMENT SERVICE ===');

	try {
		// Prueba getDocuments
		console.log('\n📋 Probando getDocuments...');
		const documents = await getDocuments();
		console.log(`✅ getDocuments exitoso: ${documents.length} documentos encontrados`);

		if (documents.length > 0) {
			console.log(`   📄 Primer documento: ${documents[0].name} (${documents[0].id})`);

			// Prueba getDocumentById
			console.log('\n🔍 Probando getDocumentById...');
			const document = await getDocumentById(documents[0].id);
			if (document) {
				console.log(`✅ getDocumentById exitoso: ${document.name}`);
				console.log(`   📊 Tipo: ${document.mimeType}, Tamaño: ${document.fileSize} bytes`);
			} else {
				console.log('❌ getDocumentById falló: documento no encontrado');
			}
		} else {
			console.log('ℹ️ No hay documentos para probar getDocumentById');
		}

	} catch (error) {
		console.error('❌ Error en DocumentService:', error);
	}
}

async function testAudioService() {
	console.log('\n🎵 === PRUEBAS DE AUDIO SERVICE ===');

	try {
		// Prueba getAudios
		console.log('\n📋 Probando getAudios...');
		const audios = await getAudios();
		console.log(`✅ getAudios exitoso: ${audios.length} audios encontrados`);

		if (audios.length > 0) {
			console.log(`   🎵 Primer audio: ${audios[0].name} (${audios[0].id})`);

			// Prueba getAudioById
			console.log('\n🔍 Probando getAudioById...');
			const audio = await getAudioById(audios[0].id);
			if (audio) {
				console.log(`✅ getAudioById exitoso: ${audio.name}`);
				console.log(`   📊 Duración: ${audio.duration}s, Bitrate: ${audio.bitrate}`);
			} else {
				console.log('❌ getAudioById falló: audio no encontrado');
			}
		} else {
			console.log('ℹ️ No hay audios para probar getAudioById');
		}

	} catch (error) {
		console.error('❌ Error en AudioService:', error);
	}
}

async function testFile3DService() {
	console.log('\n🧊 === PRUEBAS DE FILE3D SERVICE ===');

	try {
		// Prueba getFile3Ds
		console.log('\n📋 Probando getFile3Ds...');
		const file3Ds = await getFile3Ds();
		console.log(`✅ getFile3Ds exitoso: ${file3Ds.length} archivos 3D encontrados`);

		if (file3Ds.length > 0) {
			console.log(`   🧊 Primer archivo 3D: ${file3Ds[0].name} (${file3Ds[0].id})`);

			// Prueba getFile3DById
			console.log('\n🔍 Probando getFile3DById...');
			const file3D = await getFile3DById(file3Ds[0].id);
			if (file3D) {
				console.log(`✅ getFile3DById exitoso: ${file3D.name}`);
				console.log(`   📊 Formato: ${file3D.format}, Vértices: ${file3D.vertices}`);
			} else {
				console.log('❌ getFile3DById falló: archivo 3D no encontrado');
			}
		} else {
			console.log('ℹ️ No hay archivos 3D para probar getFile3DById');
		}

	} catch (error) {
		console.error('❌ Error en File3DService:', error);
	}
}

async function main() {
	console.log('🚀 Iniciando pruebas de servicios de medios...');

	await testDocumentService();
	await testAudioService();
	await testFile3DService();

	console.log('\n✅ Pruebas de servicios de medios completadas');
}

main().catch(console.error);