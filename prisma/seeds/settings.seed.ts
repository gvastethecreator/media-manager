import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra la configuración por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedSettings(prisma: PrismaClient): Promise<void> {
	seedLogger.info('⚙️ Verificando settings por defecto...');

	try {
		// Verificar si la tabla Settings existe
		if (await tableExists(prisma, 'Settings')) {
			// Verificar si ya existe algún setting
			const settingsCount = await prisma.settings.count();

			if (settingsCount === 0) {
				// Comprobar si existe un perfil "huérfano" (sin settings)
				const orphanProfile = await prisma.profile.findFirst({
					where: { settingsId: null }
				});

				if (orphanProfile) {
					// Crear settings vinculado al perfil huérfano
					await prisma.settings.create({
						data: {
							theme: 'system',
							language: 'es',
							profileId: orphanProfile.id
						}
					});

					// Obtener el settings recién creado
					const settings = await prisma.settings.findFirst({
						where: { profileId: orphanProfile.id }
					});

					// Actualizar el perfil con el ID de settings
					if (settings) {
						await prisma.profile.update({
							where: { id: orphanProfile.id },
							data: { settingsId: settings.id }
						});
					}

					seedLogger.info(`✅ Settings creado y vinculado al perfil ${orphanProfile.name}`);
				} else {
					// Si no hay perfiles sin settings, crear uno independiente
					seedLogger.info('ℹ️ No hay perfiles sin settings, creando settings independiente');
					await prisma.settings.create({
						data: {
							theme: 'system',
							language: 'es',
							profileId: 'settings-without-profile'
						}
					});
					seedLogger.info('✅ Settings independiente creado');
				}
			} else {
				seedLogger.info('ℹ️ Ya existen settings en la base de datos');
			}
		} else {
			seedLogger.warn('⚠️ La tabla Settings no existe, saltando creación de settings');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando settings:', error);
		throw error;
	}
}