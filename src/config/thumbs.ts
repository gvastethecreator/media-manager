// Configuración centralizada para caché de thumbnails y pipeline
import { join } from 'path';

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
  };
  concurrency: number; // p-queue
  memory: {
    enabled: boolean;
    maxEntries: number;
  };
}

const defaultRoot = join(process.cwd(), '.image-cache', 'thumbnails');

export const thumbsConfig: ThumbsConfig = {
  provider: (process.env.THUMBS_PROVIDER as ThumbsProvider) || 'db',
  rootDir: process.env.THUMBS_DIR || defaultRoot,
  subdirs: { byQuality: true },
  sizes: {
    low: { width: 200, height: 200 },
    medium: { width: 400, height: 400 },
    high: { width: 800, height: 800 },
  },
  ttlMs: 1000 * 60 * 60 * 24, // 24h
  http: {
    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
    immutable: true,
  },
  concurrency: Number.parseInt(process.env.THUMBS_CONCURRENCY || '4', 10),
  memory: {
    enabled: true,
    maxEntries: 500,
  },
};

export const getThumbDirFor = (quality: 'low' | 'medium' | 'high') =>
  thumbsConfig.subdirs.byQuality ? join(thumbsConfig.rootDir, quality) : thumbsConfig.rootDir;
