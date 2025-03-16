import { NextResponse } from 'next/server';

// Configuración visual predeterminada para colecciones
const DEFAULT_COLLECTION_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'collection',
		variant: 'default',
		aspectRatio: '1/1',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#9333ea',
	secondaryColor: '#6366f1',
	hoverLiftHeight: 12,
	maxRotation: 15,
};

export async function GET() {
	try {
		// En el futuro, aquí podríamos obtener la configuración desde la base de datos
		// o desde algún otro servicio basado en el contexto del usuario
		return NextResponse.json(DEFAULT_COLLECTION_OPTIONS);
	} catch (error) {
		console.error('Error al obtener la configuración visual de colecciones:', error);
		return NextResponse.json({ error: 'Error al obtener la configuración visual de colecciones' }, { status: 500 });
	}
}
