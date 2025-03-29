import { serverLogger } from '@/lib/logger/server-logger';
import { NextResponse } from 'next/server';

// Logger específico para la API de objetos del mundo
const worldItemsApiLogger = serverLogger.withContext('WorldItemsApi');

/**
 * GET /api/entities/world-items
 * Obtiene todos los objetos del mundo
 */
export async function GET() {
  try {
    worldItemsApiLogger.info('🔄 Obteniendo lista de objetos del mundo');

    // Creamos algunos objetos de prueba para devolver
    const worldItems = [
      {
        id: 'world_item_1',
        name: 'Espada Antigua',
        description: 'Espada forjada durante el reinado del Rey Eterno',
        type: 'weapon',
        rarity: 'rare',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'world_item_2',
        name: 'Amuleto Protector',
        description: 'Protege al portador de energías negativas',
        type: 'accessory',
        rarity: 'uncommon',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'world_item_3',
        name: 'Cáliz Dorado',
        description: 'Copa ceremonial utilizada en rituales antiguos',
        type: 'artifact',
        rarity: 'legendary',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    worldItemsApiLogger.info(`✅ ${worldItems.length} objetos del mundo obtenidos correctamente`);
    return NextResponse.json(worldItems);
  } catch (error) {
    worldItemsApiLogger.error('❌ Error al obtener objetos del mundo:', error);
    return NextResponse.json(
      { error: 'Error al obtener objetos del mundo' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entities/world-items
 * Crea un nuevo objeto del mundo
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    worldItemsApiLogger.info('➕ Intentando crear nuevo objeto del mundo:', data);

    // Validación básica
    if (!data.name) {
      return NextResponse.json(
        { error: 'El nombre del objeto es obligatorio' },
        { status: 400 }
      );
    }

    // Por ahora devolvemos un objeto simulado hasta implementar la conexión con la base de datos
    const newWorldItem = {
      id: `world_item_${Date.now()}`,
      name: data.name,
      description: data.description || '',
      type: data.type || 'misc',
      rarity: data.rarity || 'common',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    worldItemsApiLogger.info('✅ Objeto del mundo creado correctamente:', newWorldItem);
    return NextResponse.json(newWorldItem, { status: 201 });
  } catch (error) {
    worldItemsApiLogger.error('❌ Error al crear objeto del mundo:', error);
    return NextResponse.json(
      { error: 'Error al crear objeto del mundo' },
      { status: 500 }
    );
  }
}