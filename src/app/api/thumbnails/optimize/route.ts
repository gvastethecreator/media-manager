import { type NextRequest, NextResponse } from 'next/server';
import { optimizeThumbnails } from '@/app/actions/thumbnails/thumbnails.actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(_request: NextRequest) {
	try {
		const result = await optimizeThumbnails();
		return NextResponse.json(result);
	} catch (error) {
		console.error('Error optimizing thumbnails:', error);
		return NextResponse.json({ error: 'Error optimizing thumbnails' }, { status: 500 });
	}
}
