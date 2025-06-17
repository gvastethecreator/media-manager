// Seed para archivos 3D
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.file3D.createMany({
		data: [
			{
				name: 'Modelo 1',
				filePath: '/3d/modelo1.glb',
				format: 'glb',
				size: 10240,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Escena',
				filePath: '/3d/escena.obj',
				format: 'obj',
				size: 20480,
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
 * - Este seed crea archivos 3D de ejemplo para pruebas y desarrollo.
 */
