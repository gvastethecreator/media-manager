import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/presets/entity/[type]
 *
 * Retorna presets visuales por tipo de entidad
 */
export async function GET(request: Request, { params }: { params: { type: string } }) {
	try {
		// Por convención, los presets default para un tipo tienen la categoría 'type:nombreTipo'
		// También podemos hacer búsqueda en los metadatos si se almacena como JSON
		const entityType = await Promise.resolve(params.type);
		if (!entityType) {
			return NextResponse.json({ error: 'Tipo de entidad no proporcionado' }, { status: 400 });
		}

		// Obtenemos la URL actual para parsear parámetros de query
		const { searchParams } = new URL(request.url);
		const isDefault = searchParams.get('default') === 'true';
		const isPublic = searchParams.get('public') === 'true';
		const limit = Number(searchParams.get('limit') || '10');

		// Construir las condiciones de búsqueda
		const where: {
			OR: Array<{ category?: string } | { [key: string]: { not: null } }>;
		} = {
			OR: [{ category: `type:${entityType}` }, { category: entityType }, { [`${entityType}Config`]: { not: null } }],
		};

		// Filtrar por default/public si se especifica
		if (isDefault !== undefined) {
			where.isDefault = isDefault;
		}

		if (isPublic !== undefined) {
			where.isPublic = isPublic;
		}

		// Buscar presets que coincidan
		const presets = await prisma.visualPreset.findMany({
			where,
			orderBy: {
				isDefault: 'desc',
			},
			take: limit,
		});

		// Si se solicitó específicamente el preset por defecto, devolver solo el primero
		if (isDefault) {
			return NextResponse.json(presets[0] || null);
		}

		return NextResponse.json(presets);
	} catch (error) {
		console.error('Error al obtener presets por tipo:', error);
		return NextResponse.json({ error: 'Error al obtener presets' }, { status: 500 });
	}
}
