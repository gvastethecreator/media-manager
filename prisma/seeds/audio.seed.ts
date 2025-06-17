// Seed para archivos de audio
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.audio.createMany({
		data: [
			{
				name: 'Intro',
				filePath: '/audio/intro.mp3',
				format: 'mp3',
				duration: 30,
				size: 4096,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Entrevista',
				filePath: '/audio/entrevista.wav',
				format: 'wav',
				duration: 120,
				size: 8192,
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
 * - Este seed crea archivos de audio de ejemplo para pruebas y desarrollo.
 */
