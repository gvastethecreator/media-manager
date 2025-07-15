// Módulo vacío para reemplazar dependencias de Node.js en el cliente
// Proporciona tanto export default como exports nombrados para evitar errores

const emptyObject = {};
const emptyFunction = () => {};
const emptyPromise = Promise.resolve();

export default emptyObject;
export { emptyObject, emptyFunction, emptyPromise };

// Exportaciones adicionales comunes que podrían ser requeridas
export const readFile = emptyFunction;
export const writeFile = emptyFunction;
export const existsSync = () => false;
export const mkdirSync = emptyFunction;
export const resolve = (...args: string[]) => args.join('/');
export const join = (...args: string[]) => args.join('/');
export const dirname = (path: string) => path.split('/').slice(0, -1).join('/');
export const basename = (path: string) => path.split('/').pop() || '';
export const extname = (path: string) => {
	const name = basename(path);
	const index = name.lastIndexOf('.');
	return index > 0 ? name.slice(index) : '';
};

// Para compatibilidad con sharp y crypto
export const sharp = emptyFunction;
export const createHash = () => ({
	update: emptyFunction,
	digest: () => '',
});
export const randomBytes = () => Buffer.alloc(0);

// Para compatibilidad con fs/promises
export const stat = emptyFunction;
export const readdir = emptyFunction;
export const mkdir = emptyFunction;
export const rmdir = emptyFunction;
export const unlink = emptyFunction;
export const rename = emptyFunction;
export const copyFile = emptyFunction;
export const access = emptyFunction;
export const lstat = emptyFunction;
export const realpath = emptyFunction;
export const watchFile = emptyFunction;
export const unwatchFile = emptyFunction;
export const createReadStream = emptyFunction;
export const createWriteStream = emptyFunction;
export const promises = {
	readFile: emptyFunction,
	writeFile: emptyFunction,
	stat: emptyFunction,
	readdir: emptyFunction,
	mkdir: emptyFunction,
	rmdir: emptyFunction,
	unlink: emptyFunction,
	rename: emptyFunction,
	copyFile: emptyFunction,
	access: emptyFunction,
	lstat: emptyFunction,
	realpath: emptyFunction,
};

// Para compatibilidad con tipos de fs
export interface Stats {
	isFile: () => boolean;
	isDirectory: () => boolean;
	isBlockDevice: () => boolean;
	isCharacterDevice: () => boolean;
	isSymbolicLink: () => boolean;
	isFIFO: () => boolean;
	isSocket: () => boolean;
	dev: number;
	ino: number;
	mode: number;
	nlink: number;
	uid: number;
	gid: number;
	rdev: number;
	size: number;
	blksize: number;
	blocks: number;
	atimeMs: number;
	mtimeMs: number;
	ctimeMs: number;
	birthtimeMs: number;
	atime: Date;
	mtime: Date;
	ctime: Date;
	birthtime: Date;
}
