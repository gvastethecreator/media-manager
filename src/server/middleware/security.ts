import cookieParser from 'cookie-parser';
import type { Express, RequestHandler } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

import { ENV } from '@/config/env';
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('SecurityMiddleware');

function resolveOrigins(envValue: string | undefined) {
	if (!envValue) {
		return undefined;
	}

	const entries = envValue
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

	if (entries.length === 0) {
		return undefined;
	}

	if (entries.includes('*')) {
		return undefined;
	}

	return entries;
}

export function applySecurityMiddleware(app: Express): void {
	app.disable('x-powered-by');
	app.set('trust proxy', 1);

	const corsOrigin = resolveOrigins(process.env.CORS_ORIGIN ?? ENV.CORS_ORIGIN);

	app.use(
		cors({
			origin: corsOrigin ?? true,
			credentials: true,
			methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
			allowedHeaders: [
				'Content-Type',
				'Authorization',
				'X-Requested-With',
				'Accept',
				'Origin',
			],
			exposedHeaders: ['Content-Disposition'],
			maxAge: 86400,
		})
	);

	app.use(
		helmet({
			contentSecurityPolicy: false,
			crossOriginResourcePolicy: { policy: 'cross-origin' },
			crossOriginEmbedderPolicy: false,
			referrerPolicy: { policy: 'no-referrer' },
			hsts: process.env.NODE_ENV === 'production',
		})
	);

	const cookieSecret = process.env.COOKIE_SECRET;
	if (cookieSecret) {
		app.use(cookieParser(cookieSecret));
	} else {
		logger.warn('COOKIE_SECRET no definido; las cookies se firmaran sin secreto.');
		app.use(cookieParser());
	}
}

const allowedUploadMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

const uploadsMethodGuard: RequestHandler = (req, res, next) => {
	if (!allowedUploadMethods.has(req.method)) {
		res.status(405).json({ error: 'Metodo no permitido' });
		return;
	}
	next();
};

export function createUploadsRouter(uploadsDir: string): express.Router {
	const router = express.Router();
	const resolvedDir = path.resolve(uploadsDir);

	if (!fs.existsSync(resolvedDir)) {
		logger.warn(`Directorio de uploads no encontrado en ${resolvedDir}. Se creara automaticamente.`);
		fs.mkdirSync(resolvedDir, { recursive: true });
	}

	router.use(uploadsMethodGuard);
	router.use(
		express.static(resolvedDir, {
			fallthrough: false,
			maxAge: '1h',
			setHeaders: (res) => {
				res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
				res.setHeader('X-Content-Type-Options', 'nosniff');
				res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'self' 'unsafe-inline'");
			},
		})
	);

	return router;
}

