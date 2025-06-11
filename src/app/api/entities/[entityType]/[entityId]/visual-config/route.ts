import { NextResponse } from 'next/server';
import {
  getEntityVisualConfig,
  upsertEntityVisualConfig,
  deleteEntityVisualConfig,
} from '@/app/actions/visual-config.actions';

export async function GET(_request: Request, { params }: { params: { entityType: string; entityId: string } }) {
	try {
		const { entityType, entityId } = params;

                try {
                        const visualConfig = await getEntityVisualConfig(entityType, entityId);
                        if (!visualConfig) {
                                return NextResponse.json({ error: 'Configuración visual no encontrada' }, { status: 404 });
                        }
                        return NextResponse.json(visualConfig);
                } catch (_err) {
                        return NextResponse.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
                }
	} catch (error) {
		console.error('Error al obtener la configuración visual:', error);
		return NextResponse.json({ error: 'Error al obtener la configuración visual' }, { status: 500 });
	}
}

export async function PUT(request: Request, { params }: { params: { entityType: string; entityId: string } }) {
	try {
                const { entityType, entityId } = params;
                const data = await request.json();
                try {
                        const visualConfig = await upsertEntityVisualConfig(entityType, entityId, data);
                        return NextResponse.json(visualConfig);
                } catch (_err) {
                        return NextResponse.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
                }
	} catch (error) {
		console.error('Error al actualizar la configuración visual:', error);
		return NextResponse.json({ error: 'Error al actualizar la configuración visual' }, { status: 500 });
	}
}

export async function DELETE(_request: Request, { params }: { params: { entityType: string; entityId: string } }) {
        try {
                const { entityType, entityId } = params;
                try {
                        const visualConfig = await deleteEntityVisualConfig(entityType, entityId);
                        return NextResponse.json(visualConfig);
                } catch (_err) {
                        return NextResponse.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
                }
        } catch (error) {
                console.error('Error al eliminar la configuración visual:', error);
                return NextResponse.json({ error: 'Error al eliminar la configuración visual' }, { status: 500 });
        }
}
