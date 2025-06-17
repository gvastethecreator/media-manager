// Seed para archivos JSON
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.jsonFile.createMany({
		data: [
			{
				name: 'config.json',
				filePath: '/json/config.json',
				content: '{"theme":"dark","version":1}',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'data.json',
				filePath: '/json/data.json',
				content: '{"items":[1,2,3]}',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		],
	});
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());

/**
 * 📝 Documentación:
 * - Este seed crea archivos JSON de ejemplo para pruebas y desarrollo.
 */
