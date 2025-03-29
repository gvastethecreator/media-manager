import { serverLogger } from '@/lib/logger/server-logger';
import { NextResponse } from 'next/server';

// Logger específico para la API de prompts
const promptsApiLogger = serverLogger.withContext('PromptsApi');

/**
 * GET /api/entities/prompts
 * Obtiene todos los prompts
 */
export async function GET() {
  try {
    promptsApiLogger.info('🔄 Obteniendo lista de prompts');

    // Creamos algunos prompts de prueba para devolver
    const prompts = [
      {
        id: 'prompt_1',
        name: 'Paisaje Fantástico',
        content: 'paisaje fantástico, alta resolución, montañas, cascadas, cielo colorido, estilo épico, detallado',
        type: 'landscape',
        negativePrompt: 'baja calidad, blurry, pixelado',
        favorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prompt_2',
        name: 'Retrato Artístico',
        content: 'retrato detallado, iluminación dramática, fondo bokeh, estilo cinematográfico, 8k, hyperrealistic',
        type: 'portrait',
        negativePrompt: 'deformidades, artefactos, distorsiones faciales',
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prompt_3',
        name: 'Escena Cyberpunk',
        content: 'ciudad cyberpunk, noche lluviosa, luces de neón, estilo blade runner, calles mojadas reflectantes',
        type: 'concept',
        negativePrompt: 'sol, día, colores claros',
        favorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    promptsApiLogger.info(`✅ ${prompts.length} prompts obtenidos correctamente`);
    return NextResponse.json(prompts);
  } catch (error) {
    promptsApiLogger.error('❌ Error al obtener prompts:', error);
    return NextResponse.json(
      { error: 'Error al obtener prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entities/prompts
 * Crea un nuevo prompt
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    promptsApiLogger.info('➕ Intentando crear nuevo prompt:', data);

    // Validación básica
    if (!data.name || !data.content) {
      return NextResponse.json(
        { error: 'El nombre y contenido del prompt son obligatorios' },
        { status: 400 }
      );
    }

    // Por ahora devolvemos un objeto simulado hasta implementar la conexión con la base de datos
    const newPrompt = {
      id: `prompt_${Date.now()}`,
      name: data.name,
      content: data.content,
      type: data.type || 'general',
      negativePrompt: data.negativePrompt || '',
      favorite: data.favorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    promptsApiLogger.info('✅ Prompt creado correctamente:', newPrompt);
    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    promptsApiLogger.error('❌ Error al crear prompt:', error);
    return NextResponse.json(
      { error: 'Error al crear prompt' },
      { status: 500 }
    );
  }
}