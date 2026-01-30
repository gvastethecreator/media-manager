import { Router } from 'express';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { devFeatures, serverAlerts } from '@/lib/drizzle/schema/dev';
import { createServerAlert } from '@/server/utils/logger.alert';

const router = Router();

router.get('/features', async (req, res, next) => {
	try {
		const features = await db.select().from(devFeatures).orderBy(desc(devFeatures.createdAt));
		res.json(features);
	} catch (error) {
		next(error);
	}
});

router.post('/features', async (req, res, next) => {
	try {
		const { name, description, status, progress } = req.body;
		const [newFeature] = await db
			.insert(devFeatures)
			.values({ name, description, status, progress })
			.returning();
		res.json(newFeature);
	} catch (error) {
		next(error);
	}
});

router.get('/alerts', async (req, res, next) => {
	try {
		const { level, service, resolved } = req.query;
		const conditions = [];
		
		if (level) conditions.push(eq(serverAlerts.level, level as 'info' | 'warning' | 'error' | 'critical'));
		if (service) conditions.push(eq(serverAlerts.service, service as string));
		if (resolved !== undefined) conditions.push(eq(serverAlerts.resolved, resolved === 'true'));

		let query = db.select().from(serverAlerts);
		if (conditions.length > 0) query = query.where(and(...conditions));

		const alerts = await query.orderBy(desc(serverAlerts.createdAt)).limit(100);
		res.json(alerts);
	} catch (error) {
		next(error);
	}
});

router.post('/alerts', async (req, res, next) => {
	try {
		await createServerAlert(req.body);
		res.json({ success: true, message: 'Alerta registrada' });
	} catch (error) {
		next(error);
	}
});

router.patch('/alerts/:id/resolve', async (req, res, next) => {
	try {
		const { id } = req.params;
		await db
			.update(serverAlerts)
			.set({ resolved: true, resolvedAt: new Date() })
			.where(eq(serverAlerts.id, id));
		res.json({ success: true });
	} catch (error) {
		next(error);
	}
});

export default router;
