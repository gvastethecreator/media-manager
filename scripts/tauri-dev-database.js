import { existsSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function isInside(root, candidate) {
	const pathFromRoot = relative(resolve(root), resolve(candidate));
	return pathFromRoot === '' || !(pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot));
}

function ensureContainedDirectory(anchor, canonicalAnchor, target) {
	if (!isInside(anchor, target)) {
		throw new Error('El directorio solicitado escapa de su raíz autorizada.');
	}
	let current = resolve(anchor);
	const pathFromAnchor = relative(current, resolve(target));
	const segments = pathFromAnchor === '' ? [] : pathFromAnchor.split(sep).filter(Boolean);
	for (const segment of segments) {
		current = join(current, segment);
		if (existsSync(current)) {
			const currentStats = lstatSync(current);
			if (currentStats.isSymbolicLink()) {
				throw new Error('El data dir de desarrollo dedicado no puede contener symlinks, junctions o reparse points.');
			}
			if (!currentStats.isDirectory()) {
				throw new Error('El data dir de desarrollo dedicado contiene un segmento que no es directorio.');
			}
		} else {
			mkdirSync(current);
		}
		if (!isInside(canonicalAnchor, realpathSync(current))) {
			throw new Error('El data dir de desarrollo dedicado debe permanecer dentro de su raíz canónica.');
		}
	}
	return realpathSync(target);
}

export function resolveTauriDevelopmentDatabase(environment = process.env) {
	const appDataRoot = resolve(environment.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'));
	if (!existsSync(appDataRoot)) {
		throw new Error('LOCALAPPDATA debe existir antes de iniciar Tauri en desarrollo.');
	}
	const canonicalAppDataRoot = realpathSync(appDataRoot);
	const developmentDataRoot = resolve(appDataRoot, 'MediaManager', 'development');
	const canonicalDevelopmentRoot = ensureContainedDirectory(appDataRoot, canonicalAppDataRoot, developmentDataRoot);
	if (!isInside(canonicalAppDataRoot, canonicalDevelopmentRoot)) {
		throw new Error('El data dir de desarrollo dedicado debe permanecer dentro de LOCALAPPDATA.');
	}

	const configured = environment.MEDIA_MANAGER_TAURI_DEV_DATABASE;
	const candidate = configured
		? configured.startsWith('file:')
			? fileURLToPath(configured)
			: configured
		: join(developmentDataRoot, 'media-manager.sqlite');
	if (!isAbsolute(candidate)) {
		throw new Error('MEDIA_MANAGER_TAURI_DEV_DATABASE debe ser un path absoluto o una file URL.');
	}
	const resolvedCandidate = resolve(candidate);
	if (!isInside(developmentDataRoot, resolvedCandidate)) {
		throw new Error('La base de Tauri dev debe permanecer dentro del data dir de desarrollo dedicado.');
	}
	const candidateParent = dirname(resolvedCandidate);
	const canonicalCandidateParent = ensureContainedDirectory(
		developmentDataRoot,
		canonicalDevelopmentRoot,
		candidateParent
	);
	if (existsSync(resolvedCandidate) && lstatSync(resolvedCandidate).isSymbolicLink()) {
		throw new Error('La base de Tauri dev no puede ser un symlink, junction o reparse point.');
	}
	const canonicalTarget = existsSync(resolvedCandidate) ? realpathSync(resolvedCandidate) : canonicalCandidateParent;
	if (!isInside(canonicalDevelopmentRoot, canonicalTarget)) {
		throw new Error('La base de Tauri dev debe permanecer dentro del data dir de desarrollo dedicado.');
	}
	return resolvedCandidate;
}
