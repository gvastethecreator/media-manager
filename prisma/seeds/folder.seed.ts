import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las carpetas por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedFolders(prisma: PrismaClient): Promise<void> {
	seedLogger.info('📁 Creando carpetas por defecto...');

	try {
		// Verificar si la tabla Folder existe
		if (await tableExists(prisma, 'Folder')) {
			// Obtener el preset visual por defecto para carpetas
			const folderPreset = await prisma.visualPreset.findFirst({
				where: { name: 'folder-default' },
			});

			// Definir carpetas de ejemplo con sus metadatos
			const sampleFolders = [
				{
					name: 'Imágenes de Paisajes',
					description: 'Cartoons',
					path: 'D:\\Pictures\\Cartoons',
					emoji: '🏞️',
					totalFiles: 45,
					totalSize: 230000000, // 230MB en bytes
					lastIndexed: new Date(),
					autoReindex: true,
					color: '#3b82f6',
					isFavorite: true,
				},
			];

			// Crear carpetas con sus configuraciones visuales
			for (const folderData of sampleFolders) {
				if (folderPreset) {
					await prisma.folder.create({
						data: {
							...folderData,
							// Usar connect en lugar de presetId directo
							preset: {
								connect: { id: folderPreset.id },
							},
							// Crear configuración visual para la carpeta
							visualConfig: {
								create: {
									enable3DEffect: true,
									enableHolographicEffect: true,
									enableGlowEffect: true,
									enableAnimatedBorder: true,
									enableLightHalo: true,
									// También usar connect para el preset en la configuración visual
									preset: {
										connect: { id: folderPreset.id },
									},
									// Configuración JSON personalizada para diseño
									designSystem: JSON.stringify({
										preset: 'folder',
										cornerStyle: 'rounded',
										aspectRatio: '7/10',
										elevation: 2,
										shadowStyle: 'soft',
									}),
									// Configuración de efectos
									effects: JSON.stringify({
										shadow: {
											enabled: true,
											color: 'rgba(0,0,0,0.2)',
											blur: 10,
											spread: 5,
										},
										reflection: {
											enabled: true,
											opacity: 0.1,
											blur: 2,
										},
										parallax: {
											enabled: true,
											intensity: 0.1,
											perspective: 1000,
										},
									}),
								},
							},
						},
					});
				} else {
					// Si no hay preset, crear la carpeta sin referencias al preset
					await prisma.folder.create({
						data: {
							...folderData,
							visualConfig: {
								create: {
									enable3DEffect: true,
									enableHolographicEffect: true,
									enableGlowEffect: true,
									enableAnimatedBorder: true,
									enableLightHalo: true,
									designSystem: JSON.stringify({
										preset: 'folder',
										cornerStyle: 'rounded',
										aspectRatio: '7/10',
										elevation: 2,
										shadowStyle: 'soft',
									}),
									effects: JSON.stringify({
										shadow: {
											enabled: true,
											color: 'rgba(0,0,0,0.2)',
											blur: 10,
											spread: 5,
										},
										reflection: {
											enabled: true,
											opacity: 0.1,
											blur: 2,
										},
										parallax: {
											enabled: true,
											intensity: 0.1,
											perspective: 1000,
										},
									}),
								},
							},
						},
					});
				}
			}

			seedLogger.info(`✅ ${sampleFolders.length} carpetas creadas con presets visuales`);
		} else {
			seedLogger.warn('⚠️ La tabla Folder no existe, saltando creación de carpetas');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando carpetas:', error);
		throw error;
	}
}
