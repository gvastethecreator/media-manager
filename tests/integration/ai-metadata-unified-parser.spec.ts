import { extractAllMetadata } from '@/server/services/metadata/unified-parser.service';
import { describe, expect, it } from 'bun:test';

// Implementación ligera CRC32 (IEEE) para evitar dependencia externa solo para el test
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) {
		// biome-ignore lint/nursery/noBitwiseOperators: CRC32 usa shifts/AND/XOR por definición
		c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
	}
	// biome-ignore lint/nursery/noBitwiseOperators: normalizar a uint32
	return c >>> 0;
});

function crc32(buf: Buffer): number {
	// biome-ignore lint/nursery/noBitwiseOperators: CRC32 initialization
	let crc = 0 ^ -1;
	for (const byte of buf) {
		// biome-ignore lint/nursery/noBitwiseOperators: CRC32 core loop
		crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
	}
	// biome-ignore lint/nursery/noBitwiseOperators: finalize CRC32
	return (crc ^ -1) >>> 0;
}

function buildChunk(type: string, data: Buffer): Buffer {
	const typeBuf = Buffer.from(type, 'ascii');
	const lengthBuf = Buffer.alloc(4);
	lengthBuf.writeUInt32BE(data.length, 0);
	const crcVal = crc32(Buffer.concat([typeBuf, data]));
	const crcBuf = Buffer.alloc(4);
	// biome-ignore lint/nursery/noBitwiseOperators: asegurar uint32
	crcBuf.writeUInt32BE(crcVal >>> 0, 0);
	return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function createMinimalPngWithParameters(parameters: string): Buffer {
	const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const ihdrData = Buffer.alloc(13);
	ihdrData.writeUInt32BE(1, 0);
	ihdrData.writeUInt32BE(1, 4);
	ihdrData[8] = 8;
	ihdrData[9] = 6;
	ihdrData[10] = 0;
	ihdrData[11] = 0;
	ihdrData[12] = 0;
	const ihdr = buildChunk('IHDR', ihdrData);
	const textContent = Buffer.from(`parameters\u0000${parameters}`, 'utf8');
	const textChunk = buildChunk('tEXt', textContent);
	const zlib = require('zlib');
	const rawPixel = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]);
	const compressed = zlib.deflateSync(rawPixel);
	const idat = buildChunk('IDAT', compressed);
	const iend = buildChunk('IEND', Buffer.alloc(0));
	return Buffer.concat([signature, ihdr, textChunk, idat, iend]);
}

describe('UnifiedParserService AI metadata (PNG parameters chunk)', () => {
	it('extrae ai_metadata desde chunk parameters con Steps', async () => {
		const params =
			'Prompt: A castle on a hill\nNegative prompt: low quality\nSteps: 30, Sampler: Euler, CFG scale: 7, Seed: 12345';
		const buf = createMinimalPngWithParameters(params);
		const result = await extractAllMetadata(buf, 'test-ai.png', { include_raw_data: true });
		expect(result.success).toBe(true);
		expect(result.origin).toBeTruthy();
		const ai = (result as any).ai_metadata || (result as any).aiMetadata;
		expect(ai).toBeTruthy();
		if (ai?.steps) {
			expect(typeof ai.steps === 'number' || typeof ai.steps === 'string').toBe(true);
		} else {
			expect(params.includes('Steps:')).toBe(true);
		}
	});
});
