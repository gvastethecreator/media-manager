import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validación para el ID
const paramsSchema = z.object({
	id: z.string().min(1),
});

/**
 * GET /api/presets/[id]
 *
 * Retorna un preset visual por ID
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		// Validar el ID usando Zod - el params ya es un objeto, no una promesa
		const { id } = params;

		// Validar el ID
		paramsSchema.parse({ id });

		const preset = await prisma.visualPreset.findUnique({
			where: { id },
		});

		if (!preset) {
			return NextResponse.json({ error: 'Preset no encontrado' }, { status: 404 });
		}

		return NextResponse.json(preset);
	} catch (error) {
		console.error('Error al obtener preset:', error);
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'ID de preset inválido' }, { status: 400 });
		}
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
	}
}

/**
 * PUT /api/presets/[id]
 *
 * Actualiza un preset visual
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		// Validar el ID usando Zod - el params ya es un objeto, no una promesa
		const { id } = params;

		// Validar el ID
		paramsSchema.parse({ id });

		const body = await request.json();

		const updatedPreset = await prisma.visualPreset.update({
			where: { id },
			data: body,
		});

		return NextResponse.json(updatedPreset);
	} catch (error) {
		console.error('Error al actualizar el preset:', error);
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'ID de preset inválido' }, { status: 400 });
		}
		return NextResponse.json({ error: 'Error al actualizar el preset' }, { status: 500 });
	}
}
