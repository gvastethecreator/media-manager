import { type NextRequest, NextResponse } from 'next/server';
import { generateThumbnailWithForce } from '@/app/actions/images';
import { normalizeQuality } from '@/lib/config/thumbnail.config';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const id = params.id;
		const { quality: requestedQuality = 'medium', force = false } = await request.json();
		const quality = normalizeQuality(requestedQuality);
		await generateThumbnailWithForce(id, quality, force);
		return NextResponse.json({ status: 'success', quality });
	} catch (error) {
		console.error('Error generating thumbnail:', error);
		return NextResponse.json({ error: 'Error generating thumbnail' }, { status: 500 });
	}
}
