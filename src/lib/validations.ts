import { db } from './db';

/**
 * Valida si un nombre está disponible para una entidad dada
 * @param entity Nombre de la entidad ('property', 'tag', etc.)
 * @param name Nombre a validar
 * @throws Error si el nombre ya está en uso
 */
export async function validateName(entity: string, name: string) {
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
	if (!/^[a-zA-Z0-9\s-]+$/.test(normalizedName)) {
		throw new Error('El nombre solo puede contener letras, números, espacios y guiones');
	}

	// Verificar que no exista
	const count = await db[entity].count({
		where: {
			name: {
				equals: name,
			},
		},
	});

	if (count > 0) {
		throw new Error(`Ya existe ${entity === 'property' ? 'una propiedad' : 'un elemento'} con este nombre`);
	}
}
