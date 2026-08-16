import { isAbsolute, relative, resolve, sep } from 'node:path';

/** Returns whether candidatePath is a strict descendant of directoryPath. */
export function isPathInsideDirectory(directoryPath: string, candidatePath: string): boolean {
	if (!(directoryPath && candidatePath)) return false;
	const relativePath = relative(resolve(directoryPath), resolve(candidatePath));
	return (
		relativePath.length > 0 &&
		relativePath !== '..' &&
		!relativePath.startsWith(`..${sep}`) &&
		!isAbsolute(relativePath)
	);
}
