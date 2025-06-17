import { type NextRequest, NextResponse } from 'next/server';
import { cleanThumbnails } from '@/app/actions/thumbnails/thumbnails.actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(_request: NextRequest) {
	try {
		const result = await cleanThumbnails();
		return NextResponse.json(result);
	} catch (error) {
		console.error('Error cleaning thumbnails:', error);
		return NextResponse.json({ error: 'Error cleaning thumbnails' }, { status: 500 });
	}
}
