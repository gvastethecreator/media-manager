import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los perfiles por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedProfiles(prisma: PrismaClient): Promise<void> {
  seedLogger.info('👤 Creando perfil default...');
  
  // Verificar si la tabla Profile existe
  if (await tableExists(prisma, 'Profile')) {
    // Crear perfil por defecto
    await prisma.profile.create({
      data: {
        name: 'Default',
        emoji: '🐸',
        color: '#AE3F94FF',
        description: 'Perfil por defecto',
      },
    });
    
    seedLogger.info('✅ Perfil por defecto creado');
  } else {
    seedLogger.warn('⚠️ La tabla Profile no existe, saltando creación de perfil');
  }
}