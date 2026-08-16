export interface AuthorizedPathProof {
	absolutePath: string;
	relativePath: string;
	rootId: string;
}

const authorizedPathProofs = new WeakMap<object, Readonly<AuthorizedPathProof>>();

/**
 * Creates an in-process source reference carrying a non-serializable authorization proof.
 * JSON callers cannot manufacture or preserve the WeakMap association.
 */
export function createAuthorizedPathInput<TMetadata extends object = Record<string, never>>(
	proof: AuthorizedPathProof,
	metadata?: TMetadata
): TMetadata & { relativePath: string; rootId: string } {
	const input = {
		...(metadata ?? ({} as TMetadata)),
		relativePath: proof.relativePath,
		rootId: proof.rootId,
	};
	authorizedPathProofs.set(input, Object.freeze({ ...proof }));
	return input;
}

export function extendAuthorizedPathInput<TMetadata extends object>(
	input: object,
	metadata: TMetadata
): TMetadata & { relativePath: string; rootId: string } {
	const proof = authorizedPathProofs.get(input);
	if (!proof) throw new Error('The source lost its authorization proof during processing.');
	return createAuthorizedPathInput(proof, metadata);
}

export function getAuthorizedPathProof(input: object): Readonly<AuthorizedPathProof> | undefined {
	return authorizedPathProofs.get(input);
}
