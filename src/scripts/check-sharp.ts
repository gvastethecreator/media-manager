import sharp from 'sharp';

console.log('Sharp version:', sharp.versions.sharp);
console.log('Libvips version:', sharp.versions.vips);
console.log('Format support:');
try {
	const formats = sharp.format;
	console.log(JSON.stringify(formats, null, 2));
} catch (e) {
	console.log('Could not get formats', e);
}
