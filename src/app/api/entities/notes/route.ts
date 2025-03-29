import { serverLogger } from '@/lib/logger/server-logger';
import { NextResponse } from 'next/server';

// Logger específico para la API de notas
const notesApiLogger = serverLogger.withContext('NotesApi');

/**
 * GET /api/entities/notes
 * Obtiene todas las notas
 */
export async function GET() {
  try {
    notesApiLogger.info('🔄 Obteniendo lista de notas');

    // Creamos algunas notas de prueba para devolver
    const notes = [
      {
        id: 'note_1',
        title: 'Ideas para nueva campaña',
        content: 'Comenzar en una posada. El grupo es contratado para investigar desapariciones en el bosque cercano. Pistas llevan a un antiguo templo.',
        category: 'campaign',
        tags: ['dnd', 'fantasy', 'ideas'],
        pinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'note_2',
        title: 'Referencias visuales para personaje',
        content: 'Buscar referencias de guerreros con armadura ligera, preferentemente con estilo celta o vikingo. Paleta de colores: verdes oscuros y marrones.',
        category: 'reference',
        tags: ['character', 'visual', 'reference'],
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'note_3',
        title: 'Sistema de magia',
        content: 'La magia proviene de cristales elementales. Cada hechicero debe sintonizarse con un tipo específico. Limitaciones: distancia al cristal fuente, afinidad elemental.',
        category: 'worldbuilding',
        tags: ['magic', 'system', 'rules'],
        pinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    notesApiLogger.info(`✅ ${notes.length} notas obtenidas correctamente`);
    return NextResponse.json(notes);
  } catch (error) {
    notesApiLogger.error('❌ Error al obtener notas:', error);
    return NextResponse.json(
      { error: 'Error al obtener notas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entities/notes
 * Crea una nueva nota
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    notesApiLogger.info('➕ Intentando crear nueva nota:', data);

    // Validación básica
    if (!data.title) {
      return NextResponse.json(
        { error: 'El título de la nota es obligatorio' },
        { status: 400 }
      );
    }

    // Por ahora devolvemos un objeto simulado hasta implementar la conexión con la base de datos
    const newNote = {
      id: `note_${Date.now()}`,
      title: data.title,
      content: data.content || '',
      category: data.category || 'general',
      tags: data.tags || [],
      pinned: data.pinned || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notesApiLogger.info('✅ Nota creada correctamente:', newNote);
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    notesApiLogger.error('❌ Error al crear nota:', error);
    return NextResponse.json(
      { error: 'Error al crear nota' },
      { status: 500 }
    );
  }
}