import { serverLogger } from '@/lib/logger/server-logger';
import { NextRequest, NextResponse } from 'next/server';

const logger = serverLogger.withContext('TagsAPI');

// Datos de ejemplo para etiquetas
const testTags = [
  {
    id: '1',
    name: 'Fantástico',
    description: 'Elementos que pertenecen al género fantástico',
    color: '#FF5733',
    icon: 'sparkles',
    category: 'Género',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: '2',
    name: 'Medieval',
    description: 'Ambientado en la época medieval',
    color: '#3366FF',
    icon: 'shield',
    category: 'Época',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
  },
  {
    id: '3',
    name: 'Personaje Principal',
    description: 'Etiqueta para personajes principales',
    color: '#33FF57',
    icon: 'user',
    category: 'Rol',
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
  },
  {
    id: '4',
    name: 'Inspiración',
    description: 'Ideas inspiradoras para el proyecto',
    color: '#FFD700',
    icon: 'lightbulb',
    category: 'Proceso Creativo',
    createdAt: new Date('2024-02-05').toISOString(),
    updatedAt: new Date('2024-02-05').toISOString(),
  },
  {
    id: '5',
    name: 'Por revisar',
    description: 'Elementos que requieren revisión',
    color: '#FF3366',
    icon: 'exclamation',
    category: 'Estado',
    createdAt: new Date('2024-02-10').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString(),
  }
];

/**
 * GET /api/entities/tags
 * Recupera la lista de etiquetas
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('📥 Petición GET recibida para obtener etiquetas');

    // Simulando un pequeño retraso para emular latencia de red
    await new Promise(resolve => setTimeout(resolve, 200));

    logger.info(`✅ Devolviendo ${testTags.length} etiquetas`);
    return NextResponse.json(testTags);
  } catch (error) {
    logger.error('❌ Error al procesar la petición GET:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener etiquetas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/entities/tags
 * Crea una nueva etiqueta
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('📥 Petición POST recibida para crear una etiqueta');

    const data = await request.json();

    // Validar datos mínimos
    if (!data.name) {
      logger.warn('⚠️ Datos insuficientes para crear etiqueta');
      return new NextResponse(
        JSON.stringify({ error: 'Se requiere al menos un nombre para la etiqueta' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear una nueva etiqueta (simulado)
    const newTag = {
      id: `${Date.now()}`, // ID único basado en timestamp
      name: data.name,
      description: data.description || '',
      color: data.color || '#CCCCCC',
      icon: data.icon || 'tag',
      category: data.category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('✅ Etiqueta creada correctamente:', { id: newTag.id, name: newTag.name });
    return NextResponse.json(newTag);
  } catch (error) {
    logger.error('❌ Error al procesar la petición POST:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error al crear etiqueta' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PATCH /api/entities/tags/:id
 * Actualiza una etiqueta existente
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = request.url.split('/').pop();
    logger.info(`📥 Petición PATCH recibida para actualizar etiqueta ${id}`);

    const data = await request.json();

    // Simulando actualización exitosa
    const updatedTag = {
      id,
      ...data,
      updatedAt: new Date().toISOString()
    };

    logger.info('✅ Etiqueta actualizada correctamente:', { id });
    return NextResponse.json(updatedTag);
  } catch (error) {
    logger.error('❌ Error al procesar la petición PATCH:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error al actualizar etiqueta' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/entities/tags/:id
 * Elimina una etiqueta
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.url.split('/').pop();
    logger.info(`📥 Petición DELETE recibida para eliminar etiqueta ${id}`);

    // Simulando eliminación exitosa
    logger.info('✅ Etiqueta eliminada correctamente:', { id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('❌ Error al procesar la petición DELETE:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error al eliminar etiqueta' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}