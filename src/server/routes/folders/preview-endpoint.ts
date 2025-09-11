import { eq, sql } from 'drizzle-orm';
import type { RequestHandler, Router } from 'express';
import { db } from '@/lib/drizzle';
import { folders, images } from '@/lib/drizzle/schema/index';
import { isValidFolderId } from '@/lib/utils/folder-id-generator';

export function registerFolderPreviewEndpoint(router: Router) {
	const handler: RequestHandler = async (req, res) => {
		try {
			const { id } = req.params as { id: string };

			if (!isValidFolderId(id)) {
				res.status(400).json({ error: 'ID de carpeta inválido' });
				return;
			}

			// Imágenes directas
			let recentImages: Array<{ filename: string }> = [];
			try {
				const queryResult = await db.select().from(images).where(eq(images.folderId, id)).limit(4);
				recentImages = Array.isArray(queryResult) ? (queryResult as any) : queryResult ? [queryResult as any] : [];
			} catch {
				recentImages = [];
			}

			// Si vacío, buscar en subcarpetas
			if (recentImages.length === 0) {
				let subfolders: Array<{ id: string; name: string }> = [];
				try {
					const subfoldersResult = await db
						.select({ id: folders.id, name: folders.name })
						.from(folders)
						.where(eq(folders.parentId, id))
						.limit(10);
					subfolders = Array.isArray(subfoldersResult)
						? subfoldersResult
						: subfoldersResult
							? [subfoldersResult as any]
							: [];
				} catch {
					subfolders = [];
				}

				for (const subfolder of subfolders.slice(0, 5)) {
					if (recentImages.length >= 4) break;
					try {
						const subImagesResult = await db
							.select()
							.from(images)
							.where(eq(images.folderId, subfolder.id))
							.limit(4 - recentImages.length);
						const subImages = Array.isArray(subImagesResult)
							? subImagesResult
							: subImagesResult
								? [subImagesResult as any]
								: [];
						recentImages = [...recentImages, ...subImages.map((i: any) => ({ filename: i.filename }))];
					} catch {
						// ignore
					}
				}
			}

			if (!recentImages || recentImages.length === 0) {
				let hasSubfolders = false;
				try {
					const count = await db.select({ count: sql<number>`count(*)` }).from(folders).where(eq(folders.parentId, id));
					const first = Array.isArray(count) ? count[0] : (count as any);
					hasSubfolders = Boolean(first?.count && Number(first.count) > 0);
				} catch {
					hasSubfolders = false;
				}

				const message = hasSubfolders ? 'Contiene subcarpetas' : 'Sin imágenes';
				const fillColor = hasSubfolders ? '#fff3cd' : '#f8f9fa';
				const strokeColor = hasSubfolders ? '#ffeaa7' : '#dee2e6';
				const textColor = hasSubfolders ? '#856404' : '#6c757d';

				const emptySvg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${fillColor}"/>
          <rect x="25" y="50" width="150" height="100" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="5,5" rx="5"/>
          <text x="100" y="95" text-anchor="middle" font-family="Arial" font-size="12" fill="${textColor}">${message}</text>
          <text x="100" y="115" text-anchor="middle" font-family="Arial" font-size="10" fill="${textColor}" opacity="0.7">${id}</text>
        </svg>`;

				res.setHeader('Content-Type', 'image/svg+xml');
				res.setHeader('Cache-Control', 'public, max-age=300');
				res.send(emptySvg);
				return;
			}

			// Generar SVG simple con filenames
			const svgWidth = 200;
			const svgHeight = 200;
			const gridSize = recentImages.length >= 4 ? 2 : recentImages.length === 3 ? 2 : 1;
			const imageSize = svgWidth / gridSize;

			let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
			svgContent += `<rect width="100%" height="100%" fill="#f8f9fa"/>`;

			recentImages.forEach((image, index) => {
				if (!image?.filename) return;
				const row = Math.floor(index / gridSize);
				const col = index % gridSize;
				const x = col * imageSize;
				const y = row * imageSize;
				svgContent += `<rect x="${x}" y="${y}" width="${imageSize}" height="${imageSize}" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>`;
				const shortName = image.filename.length > 10 ? `${image.filename.substring(0, 10)}...` : image.filename;
				svgContent += `<text x="${x + imageSize / 2}" y="${y + imageSize / 2}" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">${shortName}</text>`;
			});

			svgContent += '</svg>';
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(svgContent);
		} catch (error) {
			const errorSvg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffe6e6"/>
        <rect x="50" y="50" width="100" height="100" fill="#ffcccc" stroke="#ff6b6b" stroke-width="2"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="#cc0000">Error</text>
        <text x="100" y="115" text-anchor="middle" font-family="Arial" font-size="10" fill="#ff6b6b">${(req.params as any).id}</text>
      </svg>`;
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.send(errorSvg);
		}
	};

	router.get('/:id/preview', handler);
}
