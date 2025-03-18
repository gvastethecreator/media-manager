import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: { entityType: string; entityId: string } }) {
	try {
		const { entityType, entityId } = params;

		let visualConfig: Record<string, unknown> | null = null;

		switch (entityType) {
			case 'folders':
				visualConfig = await prisma.folderVisualConfig.findFirst({
					where: {
						folder: {
							id: entityId,
						},
					},
				});
				break;
			case 'images':
				visualConfig = await prisma.imageVisualConfig.findFirst({
					where: {
						image: {
							id: entityId,
						},
					},
				});
				break;
			case 'videos':
				visualConfig = await prisma.videoVisualConfig.findFirst({
					where: {
						video: {
							id: entityId,
						},
					},
				});
				break;
			default:
				return NextResponse.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
		}

		if (!visualConfig) {
			return NextResponse.json({ error: 'Configuración visual no encontrada' }, { status: 404 });
		}

		return NextResponse.json(visualConfig);
	} catch (error) {
		console.error('Error al obtener la configuración visual:', error);
		return NextResponse.json({ error: 'Error al obtener la configuración visual' }, { status: 500 });
	}
}

export async function PUT(request: Request, { params }: { params: { entityType: string; entityId: string } }) {
	try {
		const { entityType, entityId } = params;
		const data = await request.json();

		let visualConfig: Record<string, unknown> | null = null;

		switch (entityType) {
			case 'folders':
				visualConfig = await prisma.folderVisualConfig.upsert({
					where: {
						id: data.id || '',
					},
					update: {
						...data,
						folder: {
							connect: {
								id: entityId,
							},
						},
					},
					create: {
						...data,
						folder: {
							connect: {
								id: entityId,
							},
						},
					},
				});
				break;
			case 'images':
				visualConfig = await prisma.imageVisualConfig.upsert({
					where: {
						id: data.id || '',
					},
					update: {
						...data,
						image: {
							connect: {
								id: entityId,
							},
						},
					},
					create: {
						...data,
						image: {
							connect: {
								id: entityId,
							},
						},
					},
				});
				break;
			case 'videos':
				visualConfig = await prisma.videoVisualConfig.upsert({
					where: {
						id: data.id || '',
					},
					update: {
						...data,
						video: {
							connect: {
								id: entityId,
							},
						},
					},
					create: {
						...data,
						video: {
							connect: {
								id: entityId,
							},
						},
					},
				});
				break;
			default:
				return NextResponse.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
		}

		return NextResponse.json(visualConfig);
	} catch (error) {
		console.error('Error al actualizar la configuración visual:', error);
		return NextResponse.json({ error: 'Error al actualizar la configuración visual' }, { status: 500 });
	}
}

export async function DELETE(_request: Request, { params }: { params: { entityType: string; entityId: string } }) {
	try {
		const { entityType, entityId } = params;

		let visualConfig: Record<string, unknown> | null = null;

		switch (entityType) {
			case 'folders':
				visualConfig = await prisma.folderVisualConfig.delete({
					where: {
						folder: {
							id: entityId,
						},
					},
				});
				break;
			case 'images':
				visualConfig = await prisma.imageVisualConfig.delete({
					where: {
						image: {
							id: entityId,
						},
					},
				});
				break;
			case 'videos':
				visualConfig = await prisma.videoVisualConfig.delete({
					where: {
						video: {
							id: entityId,
						},
					},
				});
				break;
			default:
				return NextResponse.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
		}

		return NextResponse.json(visualConfig);
	} catch (error) {
		console.error('Error al eliminar la configuración visual:', error);
		return NextResponse.json({ error: 'Error al eliminar la configuración visual' }, { status: 500 });
	}
}
