import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { favorites } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra favoritos — fuente única de favoritos
 * Migrado desde isFavorite en seeds per-type según ADR-0002
 */
export async function seedFavorites(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('⭐ Creando favoritos de prueba...');

	try {
		const profileId = '88888888-8888-4888-a888-888888888881';
		const now = new Date();

		const sampleFavorites = [
			// Albums (2)
			{ id: 'fav-001', profileId, entityType: 'album', entityId: 'alb-favoritos-01', addedAt: now },
			{ id: 'fav-002', profileId, entityType: 'album', entityId: 'alb-paisajes-epic-01', addedAt: now },

			// Characters (2)
			{ id: 'fav-003', profileId, entityType: 'character', entityId: 'char-heroe-principal-01', addedAt: now },
			{ id: 'fav-004', profileId, entityType: 'character', entityId: 'char-villano-oscuro-01', addedAt: now },

			// Collections (2)
			{ id: 'fav-005', profileId, entityType: 'collection', entityId: 'col-biblioteca-principal-01', addedAt: now },
			{ id: 'fav-006', profileId, entityType: 'collection', entityId: 'col-referencias-artistic-01', addedAt: now },

			// Concepts (2)
			{ id: 'fav-007', profileId, entityType: 'concept', entityId: 'cpt-iluminacion-natural-01', addedAt: now },
			{ id: 'fav-008', profileId, entityType: 'concept', entityId: 'cpt-teoria-del-color-01', addedAt: now },

			// Folders (4)
			{ id: 'fav-009', profileId, entityType: 'folder', entityId: 'cursed-dump', addedAt: now },
			{ id: 'fav-010', profileId, entityType: 'folder', entityId: 'comfy', addedAt: now },
			{ id: 'fav-011', profileId, entityType: 'folder', entityId: 'cartoons', addedAt: now },
			{ id: 'fav-012', profileId, entityType: 'folder', entityId: 'aesthethic', addedAt: now },

			// Notes (2)
			{ id: 'fav-013', profileId, entityType: 'note', entityId: 'note-bienvenida-01', addedAt: now },
			{ id: 'fav-014', profileId, entityType: 'note', entityId: 'note-lista-tareas-01', addedAt: now },

			// Places (2)
			{ id: 'fav-015', profileId, entityType: 'place', entityId: 'place-ciudad-central-01', addedAt: now },
			{ id: 'fav-016', profileId, entityType: 'place', entityId: 'place-fortaleza-costera-01', addedAt: now },

			// Prompts (2)
			{ id: 'fav-017', profileId, entityType: 'prompt', entityId: 'prmpt-paisaje-fantastico-01', addedAt: now },
			{ id: 'fav-018', profileId, entityType: 'prompt', entityId: 'prmpt-criatura-mitica-01', addedAt: now },

			// Properties (1)
			{ id: 'fav-019', profileId, entityType: 'property', entityId: 'prop-estilo-artistico-01', addedAt: now },

			// Tags (3)
			{ id: 'fav-020', profileId, entityType: 'tag', entityId: 'tag-arte-digital-01', addedAt: now },
			{ id: 'fav-021', profileId, entityType: 'tag', entityId: 'tag-retrato-01', addedAt: now },
			{ id: 'fav-022', profileId, entityType: 'tag', entityId: 'tag-fantasia-01', addedAt: now },

			// Wildcards (2)
			{ id: 'fav-023', profileId, entityType: 'wildcard', entityId: 'wild-elemento-aleatorio-01', addedAt: now },
			{ id: 'fav-024', profileId, entityType: 'wildcard', entityId: 'wild-colores-vibrantes-01', addedAt: now },

			// World Items (2)
			{ id: 'fav-025', profileId, entityType: 'worldItem', entityId: 'item-espada-legendaria-01', addedAt: now },
			{ id: 'fav-026', profileId, entityType: 'worldItem', entityId: 'item-amuleto-proteccion-01', addedAt: now },
		];

		await db.insert(favorites).values(sampleFavorites);
		seedLogger.success(`✅ ${sampleFavorites.length} favoritos creados`);
	} catch (error) {
		seedLogger.error('❌ Could not create favorites:', error);
		throw error;
	}
}
