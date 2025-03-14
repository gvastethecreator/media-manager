import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/presets/[id]
 *
 * Retorna un preset visual por ID
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
	try {
		const preset = await prisma.visualPreset.findUnique({
			where: {
				id: params.id,
			},
		});

		if (!preset) {
			return NextResponse.json({ error: 'Preset no encontrado' }, { status: 404 });
		}

		return NextResponse.json(preset);
	} catch (error) {
		console.error('Error al obtener el preset:', error);
		return NextResponse.json({ error: 'Error al obtener el preset' }, { status: 500 });
	}
}

/**
 * PUT /api/presets/[id]
 *
 * Actualiza un preset visual
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json();

		const updatedPreset = await prisma.visualPreset.update({
			where: {
				id: params.id,
			},
			data: body,
		});

		return NextResponse.json(updatedPreset);
	} catch (error) {
		console.error('Error al actualizar el preset:', error);
		return NextResponse.json({ error: 'Error al actualizar el preset' }, { status: 500 });
	}
}
