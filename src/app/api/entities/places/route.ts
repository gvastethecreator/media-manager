import { NextResponse } from 'next/server';
import { serverLogger } from '@/lib/logger/server-logger';

// Logger específico para la API de lugares
const placesApiLogger = serverLogger.withContext('PlacesApi');

/**
 * GET /api/entities/places
 * Obtiene todos los lugares
 */
export async function GET() {
	try {
		placesApiLogger.info('🔄 Obteniendo lista de lugares');

		// Creamos algunos lugares de prueba para devolver
		const places = [
			{
				id: 'place_1',
				name: 'Montaña Nevada',
				description: 'Cordillera montañosa con picos nevados y senderos para excursionistas',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: 'place_2',
				name: 'Bosque Encantado',
				description: 'Denso bosque con árboles centenarios y arroyos cristalinos',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: 'place_3',
				name: 'Playa Dorada',
				description: 'Extensa playa de arena dorada con aguas turquesas',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		];

		placesApiLogger.info(`✅ ${places.length} lugares obtenidos correctamente`);
		return NextResponse.json(places);
	} catch (error) {
		placesApiLogger.error('❌ Error al obtener lugares:', error);
		return NextResponse.json({ error: 'Error al obtener lugares' }, { status: 500 });
	}
}

/**
 * POST /api/entities/places
 * Crea un nuevo lugar
 */
export async function POST(request: Request) {
	try {
		const data = await request.json();
		placesApiLogger.info('➕ Intentando crear nuevo lugar:', data);

		// Validación básica
		if (!data.name) {
			return NextResponse.json({ error: 'El nombre del lugar es obligatorio' }, { status: 400 });
		}

		// Por ahora devolvemos un objeto simulado hasta implementar la conexión con la base de datos
		const newPlace = {
			id: `place_${Date.now()}`,
			name: data.name,
			description: data.description || '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		placesApiLogger.info('✅ Lugar creado correctamente:', newPlace);
		return NextResponse.json(newPlace, { status: 201 });
	} catch (error) {
		placesApiLogger.error('❌ Error al crear lugar:', error);
		return NextResponse.json({ error: 'Error al crear lugar' }, { status: 500 });
	}
}
