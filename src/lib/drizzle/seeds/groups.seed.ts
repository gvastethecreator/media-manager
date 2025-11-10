import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { groups } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra grupos de personajes y organizaciones
 * Mundo: "Nexus Realms"
 */
export async function seedGroups(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('👥 Creando grupos de ejemplo...');

	try {
		const sampleGroups = [
			{
				id: 'group-1',
				name: 'Guardianes de Lumina',
				description: 'Grupo de héroes fantasy que protegen el Reino de Lumina de las fuerzas oscuras. Liderado por Aria Stormwind.',
			},
			{
				id: 'group-2',
				name: 'Red Underground',
				description: 'Colectivo de hackers y rebeldes en Neo-Tokyo que luchan contra la opresión corporativa. Marcus Steel y Nova Chrome son miembros clave.',
			},
			{
				id: 'group-3',
				name: 'Consejo del Equilibrio',
				description: 'Organización neutral que mantiene el balance entre el mundo fantasy y tech. Zephyr y The Architect forman parte.',
			},
			{
				id: 'group-4',
				name: 'Fuerzas de la Sombra',
				description: 'Ejército oscuro de Lord Shadowbane dedicado a resucitar al Dios Olvidado y dominar Lumina.',
			},
			{
				id: 'group-5',
				name: 'GenoTech Security',
				description: 'Fuerza de seguridad privada de la corporación GenoTech, liderada por el Dr. Silas Helix.',
			},
		];

		await db.insert(groups).values(sampleGroups);

		seedLogger.success(`✅ ${sampleGroups.length} grupos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando grupos:', error);
		throw error;
	}
}
