// Seed para documentos (Markdown, PDF, etc.)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.document.createMany({
		data: [
			{
				name: 'Manual de usuario',
				filePath: '/docs/manual.md',
				content: '# Manual de usuario\n\nBienvenido!',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Guía de integración',
				filePath: '/docs/integracion.md',
				content: '# Guía de integración\n\nPasos para integrar...',
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
 * - Este seed crea documentos de ejemplo para pruebas y desarrollo.
 */
