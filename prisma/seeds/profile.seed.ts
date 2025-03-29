import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los perfiles por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedProfiles(prisma: PrismaClient): Promise<void> {
	seedLogger.info('👤 Creando perfil default...');

	try {
		// Verificar si la tabla Profile existe
		if (await tableExists(prisma, 'Profile')) {
			// Verificar si ya existe un perfil por defecto
			const existingProfile = await prisma.profile.findFirst({
				where: { name: 'Default' }
			});

			if (!existingProfile) {
				// Crear perfil por defecto sin settings inicialmente
				await prisma.profile.create({
					data: {
						id: 'default-profile-id',
						name: 'Default',
						emoji: '🐸',
						color: '#AE3F94FF',
						description: 'Perfil por defecto',
						isActive: true
					},
				});

				// Ahora crear settings y vincularlo al perfil
				await prisma.settings.create({
					data: {
						theme: 'system',
						language: 'es',
						profileId: 'default-profile-id'
					}
				});

				// Actualizar el perfil con el ID de settings
				const settings = await prisma.settings.findFirst({
					where: { profileId: 'default-profile-id' }
				});

				if (settings) {
					await prisma.profile.update({
						where: { id: 'default-profile-id' },
						data: { settingsId: settings.id }
					});
				}

				seedLogger.info('✅ Perfil por defecto creado con sus settings');
			} else {
				seedLogger.info('ℹ️ Ya existe un perfil por defecto');
			}
		} else {
			seedLogger.warn('⚠️ La tabla Profile no existe, saltando creación de perfil');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando perfil:', error);
		throw error;
	}
}
