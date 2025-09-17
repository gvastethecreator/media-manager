// Configuración centralizada para caché de thumbnails y pipeline
import { join } from 'path';
import { cpus } from 'os';

export type ThumbsProvider = 'db' | 'disk';

export interface ThumbsConfig {
	provider: ThumbsProvider;
	rootDir: string; // carpeta raíz de cache disco
	subdirs: {
		byQuality: boolean; // agrupar por calidad/tamaño
	};
	sizes: {
		low: { width: number; height: number };
		medium: { width: number; height: number };
		high: { width: number; height: number };
	};
	ttlMs: number; // tiempo de vida recomendado para limpiar
	http: {
		maxAgeSeconds: number;
		immutable: boolean;
		etag: boolean; // ETag headers
		lastModified: boolean; // Last-Modified headers
	};
	concurrency: number; // p-queue
	memory: {
		enabled: boolean;
		maxEntries: number;
		ttlMs: number; // TTL para entradas en memoria
	};
	disk: {
		enabled: boolean;
		useHash: boolean; // usar xxhash64 para nombres de archivo
		compression: boolean; // compresión WebP optimizada
		quality: number; // calidad WebP 70-80
	};
}

const defaultRoot = join(process.cwd(), 'public', '.cache', 'thumbs');
const defaultConcurrency = Math.max(1, (cpus().length || 4) - 1); // cores - 1

export const thumbsConfig: ThumbsConfig = {
	provider: (process.env.THUMBS_PROVIDER as ThumbsProvider) || 'disk',
	rootDir: process.env.THUMBS_DIR || defaultRoot,
	subdirs: { byQuality: true },
	sizes: {
		low: { width: 128, height: 128 },
		medium: { width: 256, height: 256 },
		high: { width: 512, height: 512 },
	},
	ttlMs: 1000 * 60 * 60 * 24 * 30, // 30 días
	http: {
		maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
		immutable: true,
		etag: true,
		lastModified: true,
	},
	concurrency: Number.parseInt(process.env.THUMBS_CONCURRENCY || String(defaultConcurrency), 10),
	memory: {
		enabled: true,
		maxEntries: 500,
		ttlMs: 1000 * 60 * 10, // 10 minutos en memoria
	},
	disk: {
		enabled: true,
		useHash: true,
		compression: true,
		quality: 75, // WebP quality 75
	},
};

export const getThumbDirFor = (quality: 'low' | 'medium' | 'high') =>
	thumbsConfig.subdirs.byQuality ? join(thumbsConfig.rootDir, quality) : thumbsConfig.rootDir;
