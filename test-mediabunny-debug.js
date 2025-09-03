// Test simple para verificar si mediabunny funciona
try {
	console.log('🧪 Probando importación de mediabunny...');

	const mediabunny = require('mediabunny');
	console.log('✅ mediabunny importado exitosamente');
	console.log('📦 Exports disponibles:', Object.keys(mediabunny));

	const { ALL_FORMATS, BufferSource, Input } = mediabunny;
	console.log('✅ Clases principales disponibles:', {
		ALL_FORMATS: !!ALL_FORMATS,
		BufferSource: !!BufferSource,
		Input: !!Input,
	});
} catch (error) {
	console.error('❌ Error importando mediabunny:', error);
	console.error('📋 Stack:', error.stack);
}
