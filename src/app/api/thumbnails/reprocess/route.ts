import { type NextRequest, NextResponse } from 'next/server';
import { reprocessThumbnails } from '@/app/actions/thumbnails/thumbnails.actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(_request: NextRequest) {
	try {
		const result = await reprocessThumbnails();
		return NextResponse.json(result);
	} catch (error) {
		console.error('Error reprocessing thumbnails:', error);
		return NextResponse.json({ error: 'Error reprocessing thumbnails' }, { status: 500 });
	}
}
