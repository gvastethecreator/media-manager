import { type NextRequest, NextResponse } from 'next/server';
import { getCollectionImages } from '@/app/actions/collections';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
	try {
		const { id } = context.params;

		if (!id) {
			return NextResponse.json({ error: 'ID de colección no proporcionado' }, { status: 400 });
		}

		const images = await getCollectionImages(id);
		return NextResponse.json({ items: images });
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
