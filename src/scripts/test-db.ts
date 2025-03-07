import { PrismaClient } from '@prisma/client';

async function main() {
	const prisma = new PrismaClient();
	try {
		// Intentar una consulta simple
		const _result = await prisma.$queryRaw`SELECT 1+1 as test`;

		// Verificar tablas
		const _profile = await prisma.profile.findFirst();
	} catch (error) {
		console.error('❌ Error al conectar:', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();
