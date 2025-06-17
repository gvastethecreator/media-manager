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
				where: { name: 'Default' },
			});

			if (!existingProfile) {
				// Perfil principal
				await prisma.profile.create({
					data: {
						id: 'default-profile-id',
						name: 'Default',
						emoji: '🐸',
						color: '#AE3F94FF',
						description: 'Perfil por defecto',
						isActive: true,
					},
				});

				// Crear perfiles adicionales de ejemplo
				const extraProfiles = [
					{
						id: 'demo-profile-id',
						name: 'Demo',
						emoji: '🦁',
						color: '#f59e0b',
						description: 'Perfil de demostración',
						isActive: false,
					},
					{
						id: 'guest-profile-id',
						name: 'Guest',
						emoji: '🦉',
						color: '#3b82f6',
						description: 'Perfil invitado',
						isActive: false,
					},
					{
						id: 'writer-profile-id',
						name: 'Writer',
						emoji: '✍️',
						color: '#10b981',
						description: 'Perfil para escritura creativa',
						isActive: false,
					},
				];

				for (const profile of extraProfiles) {
					await prisma.profile.create({ data: profile });
				}

				// Crear settings para todos los perfiles
				const profileIds = ['default-profile-id', 'demo-profile-id', 'guest-profile-id'];
				for (const id of profileIds) {
					const settings = await prisma.settings.create({
						data: {
							theme: 'system',
							language: 'es',
							profileId: id,
							data: {}, // Campo JSON requerido por el modelo
						},
					});

					await prisma.profile.update({ where: { id }, data: { settingsId: settings.id } });
				}

				seedLogger.info(`✅ ${profileIds.length} perfiles creados con sus settings`);
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
