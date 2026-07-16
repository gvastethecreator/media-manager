import type { ImageCanonicalSourceInput } from '@/services/image/image-canonical-persistence';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import {
	createAuthorizedRootRegistryFromEnvironment,
	type AuthorizedRootRegistry,
	ROOT_GRANTS_ENV,
} from './authorized-roots';

let cachedConfig: string | undefined;
let cachedRegistry: Promise<AuthorizedRootRegistry> | undefined;

async function getConfiguredRegistry(): Promise<AuthorizedRootRegistry> {
	const currentConfig = process.env[ROOT_GRANTS_ENV];
	if (!cachedRegistry || cachedConfig !== currentConfig) {
		cachedConfig = currentConfig;
		cachedRegistry = createAuthorizedRootRegistryFromEnvironment(process.env);
	}
	return cachedRegistry;
}

/**
 * Resolves an absolute ingestion path only through the trusted root grants.
 * It never guesses a root from folder rows or path prefixes stored in the database.
 */
export async function resolveConfiguredMediaSource(absolutePath: string): Promise<ImageCanonicalSourceInput> {
	const registry = await getConfiguredRegistry();
	let resolved = await registry.authorizeAbsolutePath(absolutePath, 'read');
	resolved = await registry.authorizeAbsolutePath(absolutePath, 'index');
	return createAuthorizedPathInput(resolved);
}

export function resetConfiguredMediaSourceCache(): void {
	cachedConfig = undefined;
	cachedRegistry = undefined;
}
