import { sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	albums,
	characters,
	collections,
	concepts,
	folders,
	images,
	notes,
	places,
	prompts,
	properties,
	tags,
	videos,
	wildcards,
	worldItems,
} from '@/lib/drizzle/schema';

// Regex top-level para validar nombres: letras, números, espacios y guiones
const VALID_NAME_REGEX = /^[a-zA-Z0-9\s-]+$/;

const entityTableMap = {
	album: albums,
	character: characters,
	collection: collections,
	concept: concepts,
	folder: folders,
	image: images,
	note: notes,
	place: places,
	prompt: prompts,
	property: properties,
	tag: tags,
	video: videos,
	wildcard: wildcards,
	worldItem: worldItems,
};

/**
 * Valida si un nombre está disponible para una entidad dada
 * @param entityType Tipo de la entidad ('property', 'tag', etc.)
 * @param name Nombre a validar
 * @throws Error si el nombre ya está en uso
 */
export async function validateName(entityType: keyof typeof entityTableMap, name: string) {
	const normalizedName = name.trim().toLowerCase();

	// Verificar longitud mínima
	if (normalizedName.length < 1) {
		throw new Error('El nombre no puede estar vacío');
	}

	// Verificar longitud máxima
	if (normalizedName.length > 50) {
		throw new Error('El nombre no puede tener más de 50 caracteres');
	}

	// Verificar caracteres válidos (letras, números, espacios y guiones)
	if (!VALID_NAME_REGEX.test(normalizedName)) {
		throw new Error('El nombre solo puede contener letras, números, espacios y guiones');
	}

	const table = entityTableMap[entityType];
	if (!table) {
		throw new Error(`Tipo de entidad desconocido: ${entityType}`);
	}

	// Verificar que no exista
	const [result] = await db
		.select({ count: sql<number>`count(*)` })
		.from(table)
		.where(sql`name = ${name}`);

	if (result.count > 0) {
		throw new Error(`Ya existe ${entityType === 'property' ? 'una propiedad' : 'un elemento'} con este nombre`);
	}
}
