// Seed para workflows
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.workflow.createMany({
		data: [
			{
				name: 'Pipeline de imágenes',
				filePath: '/workflows/pipeline.json',
				content: '{"steps":[{"name":"resize"},{"name":"watermark"}]}',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Automatización de backup',
				filePath: '/workflows/backup.json',
				content: '{"steps":[{"name":"copy"},{"name":"notify"}]}',
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
 * - Este seed crea workflows de ejemplo para pruebas y desarrollo.
 */
