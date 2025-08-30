import { createMDXSource } from 'fumadocs-mdx';
import { docs, meta } from '../../../source.config';

const source = createMDXSource(docs, meta);

export { source };
export const utils = source;
