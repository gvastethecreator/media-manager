// Script para probar el endpoint de stats y mostrar logs
const fetch = require('node-fetch');

async function testStatsEndpoint() {
	console.log('🔍 Probando endpoint /api/stats/system...');

	try {
		const response = await fetch('http://localhost:4000/api/stats/system');
		const data = await response.json();

		console.log('📊 Status:', response.status);
		console.log('📊 Response:', JSON.stringify(data, null, 2));

		if (data === null) {
			console.log('⚠️ El endpoint retorna null - revisar logs del servidor');
		}
	} catch (error) {
		console.error('❌ Error al hacer petición:', error.message);
	}
}

testStatsEndpoint();
