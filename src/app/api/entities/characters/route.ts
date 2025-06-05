import { serverLogger } from '@/lib/logger/server-logger';
import { NextResponse } from 'next/server';

// Logger específico para la API de personajes
const charactersApiLogger = serverLogger.withContext('CharactersApi');

/**
 * GET /api/entities/characters
 * Obtiene todos los personajes
 */
export async function GET() {
	try {
		charactersApiLogger.info('🔄 Obteniendo lista de personajes');

		// Creamos algunos personajes de prueba para devolver
		const characters = [
			{
				id: 'character_1',
				name: 'Eldrin',
				role: 'Mago',
				description: 'Sabio maestro de las artes arcanas y protector del reino',
				age: 120,
				origin: 'Bosque Élfico',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: 'character_2',
				name: 'Lyra',
				role: 'Guerrera',
				description: 'Valiente capitana de la guardia real, conocida por su fuerza y honor',
				age: 28,
				origin: 'Ciudad de Hierro',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: 'character_3',
				name: 'Thorn',
				role: 'Asesino',
				description: 'Sigiloso ejecutor de misiones secretas para la corona',
				age: 35,
				origin: 'Desconocido',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		];

		charactersApiLogger.info(`✅ ${characters.length} personajes obtenidos correctamente`);
		return NextResponse.json(characters);
	} catch (error) {
		charactersApiLogger.error('❌ Error al obtener personajes:', error);
		return NextResponse.json({ error: 'Error al obtener personajes' }, { status: 500 });
	}
}

/**
 * POST /api/entities/characters
 * Crea un nuevo personaje
 */
export async function POST(request: Request) {
	try {
		const data = await request.json();
		charactersApiLogger.info('➕ Intentando crear nuevo personaje:', data);

		// Validación básica
		if (!data.name) {
			return NextResponse.json({ error: 'El nombre del personaje es obligatorio' }, { status: 400 });
		}

		// Por ahora devolvemos un objeto simulado hasta implementar la conexión con la base de datos
		const newCharacter = {
			id: `character_${Date.now()}`,
			name: data.name,
			role: data.role || 'Sin rol definido',
			description: data.description || '',
			age: data.age || null,
			origin: data.origin || 'Desconocido',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		charactersApiLogger.info('✅ Personaje creado correctamente:', newCharacter);
		return NextResponse.json(newCharacter, { status: 201 });
	} catch (error) {
		charactersApiLogger.error('❌ Error al crear personaje:', error);
		return NextResponse.json({ error: 'Error al crear personaje' }, { status: 500 });
	}
}
