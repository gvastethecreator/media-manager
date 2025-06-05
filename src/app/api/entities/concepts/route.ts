import { serverLogger } from '@/lib/logger/server-logger';
import { type NextRequest, NextResponse } from 'next/server';

// Logger específico para la API de conceptos
const conceptsApiLogger = serverLogger.withContext('ConceptsAPI');

// Datos de ejemplo para conceptos
const testConcepts = [
	{
		id: '1',
		name: 'El guardián del bosque',
		description: 'Un espíritu ancestral que protege el bosque de intrusos y mantiene el equilibrio natural',
		category: 'Espíritu',
		importance: 'Principal',
		imageUrl: '/placeholders/concepts/guardian.jpg',
		relatedEntities: ['2', '5'],
		createdAt: new Date('2024-01-15').toISOString(),
		updatedAt: new Date('2024-02-10').toISOString(),
	},
	{
		id: '2',
		name: 'Magia de cristal',
		description: 'Sistema mágico basado en cristales que absorben y canalizan energía elemental',
		category: 'Sistema mágico',
		importance: 'Secundario',
		imageUrl: '/placeholders/concepts/crystal-magic.jpg',
		relatedEntities: ['3'],
		createdAt: new Date('2024-01-20').toISOString(),
		updatedAt: new Date('2024-01-20').toISOString(),
	},
	{
		id: '3',
		name: 'El Pacto de las Tres Lunas',
		description: 'Tratado ancestral que mantiene la paz entre las tres grandes razas del continente',
		category: 'Evento histórico',
		importance: 'Principal',
		imageUrl: '/placeholders/concepts/three-moons.jpg',
		relatedEntities: ['1', '4'],
		createdAt: new Date('2024-01-25').toISOString(),
		updatedAt: new Date('2024-02-15').toISOString(),
	},
	{
		id: '4',
		name: 'Los Eruditos del Velo',
		description: 'Sociedad secreta dedicada al estudio de las dimensiones paralelas y el tejido de la realidad',
		category: 'Organización',
		importance: 'Secundario',
		imageUrl: '/placeholders/concepts/scholars.jpg',
		relatedEntities: [],
		createdAt: new Date('2024-02-01').toISOString(),
		updatedAt: new Date('2024-02-01').toISOString(),
	},
	{
		id: '5',
		name: 'La Resonancia del Alma',
		description: 'Fenómeno donde una persona puede sincronizarse con el espíritu de un lugar o elemento natural',
		category: 'Fenómeno',
		importance: 'Terciario',
		imageUrl: '/placeholders/concepts/resonance.jpg',
		relatedEntities: ['1'],
		createdAt: new Date('2024-02-10').toISOString(),
		updatedAt: new Date('2024-02-10').toISOString(),
	},
];

/**
 * GET /api/entities/concepts
 * Recupera la lista de conceptos
 */
export async function GET(request: NextRequest) {
	try {
		conceptsApiLogger.info('📥 Petición GET recibida para obtener conceptos');

		// Simulando un pequeño retraso para emular latencia de red
		await new Promise((resolve) => setTimeout(resolve, 300));

		conceptsApiLogger.info(`✅ Devolviendo ${testConcepts.length} conceptos`);
		return NextResponse.json(testConcepts);
	} catch (error) {
		conceptsApiLogger.error('❌ Error al procesar la petición GET:', error);
		return new NextResponse(JSON.stringify({ error: 'Error al obtener conceptos' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

/**
 * POST /api/entities/concepts
 * Crea un nuevo concepto
 */
export async function POST(request: NextRequest) {
	try {
		conceptsApiLogger.info('📥 Petición POST recibida para crear un concepto');

		const data = await request.json();

		// Validar datos mínimos
		if (!data.name) {
			conceptsApiLogger.warn('⚠️ Datos insuficientes para crear concepto');
			return new NextResponse(JSON.stringify({ error: 'Se requiere al menos un nombre para el concepto' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Crear un nuevo concepto (simulado)
		const newConcept = {
			id: `${Date.now()}`, // ID único basado en timestamp
			name: data.name,
			description: data.description || '',
			category: data.category || 'General',
			importance: data.importance || 'Secundario',
			imageUrl: data.imageUrl || '/placeholders/concepts/default.jpg',
			relatedEntities: data.relatedEntities || [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		conceptsApiLogger.info('✅ Concepto creado correctamente:', { id: newConcept.id, name: newConcept.name });
		return NextResponse.json(newConcept);
	} catch (error) {
		conceptsApiLogger.error('❌ Error al procesar la petición POST:', error);
		return new NextResponse(JSON.stringify({ error: 'Error al crear concepto' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
