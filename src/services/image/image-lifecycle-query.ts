import { eq, isNull, notInArray, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { assets, images } from '@/lib/drizzle/schema';

/** Legacy Images remain visible; canonical Images disappear once their Asset is tombstoned. */
export const visibleImageLifecycleCondition = () =>
	or(
		isNull(images.assetId),
		notInArray(images.assetId, db.select({ id: assets.id }).from(assets).where(eq(assets.status, 'deleted')))
	);
