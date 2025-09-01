#!/usr/bin/env bun

console.log('Testing basic mediabunny import...');

try {
	const mediabunny = await import('mediabunny');
	console.log('✅ Mediabunny imported successfully');
	console.log('Available exports:', Object.keys(mediabunny));

	console.log('Testing BufferSource...');
	const { Input, ALL_FORMATS, BufferSource } = mediabunny;

	// Test with a simple buffer
	const testBuffer = new TextEncoder().encode('Hello world');
	const bufferSource = new BufferSource(testBuffer);
	console.log('✅ BufferSource created');

	// Try to create input (this should fail with invalid format, but shouldn't crash)
	try {
		const input = new Input({
			source: bufferSource,
			formats: ALL_FORMATS,
		});
		console.log('✅ Input created (unexpected but ok)');
	} catch (error) {
		console.log('✅ Input creation failed as expected:', error.constructor.name);
	}
} catch (error) {
	console.error('❌ Error:', error);
}
