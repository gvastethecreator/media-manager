import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { docs, meta } from '../../../source.config';

// Compatibilidad defensiva: algunas versiones exponen docs iterable directamente,
// otras exponen { files } o { docs } dentro de la colección.
function isIterable(x: unknown): x is Iterable<unknown> {
	return !!x && typeof (x as any)[Symbol.iterator] === 'function';
}

function toIterable(input: unknown): Iterable<unknown> {
	if (isIterable(input)) return input as Iterable<unknown>;
	const anyInput = input as { files?: unknown; docs?: unknown } | undefined;
	if (anyInput?.files && isIterable(anyInput.files)) return anyInput.files;
	if (anyInput?.docs && isIterable(anyInput.docs)) return anyInput.docs;
	throw new Error('Fumadocs: colección de docs no iterable');
}

const source = createMDXSource(
	toIterable(docs) as unknown as Parameters<typeof createMDXSource>[0],
	meta as unknown as Parameters<typeof createMDXSource>[1]
);

export { source };
export const utils = loader({
	baseUrl: '/docs',
	source,
	pageTree: {
		generateFallback: true,
	},
});
