import { NextResponse } from 'next/server';
import { getPresetsByType } from '@/app/actions/presets';

/**
 * GET /api/presets/entity/[type]
 *
 * Retorna presets visuales por tipo de entidad
 */
export async function GET(request: Request, { params }: { params: { type: string } }) {
	try {
		// Por convención, los presets default para un tipo tienen la categoría 'type:nombreTipo'
		// También podemos hacer búsqueda en los metadatos si se almacena como JSON
                const entityType = params.type;
                const { searchParams } = new URL(request.url);
                const isDefault = searchParams.get('default') === 'true';
                const isPublic = searchParams.get('public') === 'true';
                const limit = Number(searchParams.get('limit') || '10');

                const presets = await getPresetsByType(entityType, { isDefault, isPublic, limit });
                return NextResponse.json(presets);
	} catch (error) {
		console.error('Error al obtener presets por tipo:', error);
		return NextResponse.json({ error: 'Error al obtener presets' }, { status: 500 });
	}
}
