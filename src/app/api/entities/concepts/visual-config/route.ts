import { NextResponse } from 'next/server';

// Configuración visual predeterminada para conceptos
const DEFAULT_CONCEPT_OPTIONS = {
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
		preset: 'concept',
		variant: 'default',
		aspectRatio: '3/2',
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
	primaryColor: '#a855f7',
	secondaryColor: '#8b5cf6',
	hoverLiftHeight: 10,
	maxRotation: 15,
};

export async function GET() {
	try {
		// En el futuro, aquí podríamos obtener la configuración desde la base de datos
		// o desde algún otro servicio basado en el contexto del usuario
		return NextResponse.json(DEFAULT_CONCEPT_OPTIONS);
	} catch (error) {
		console.error('Error al obtener la configuración visual de conceptos:', error);
		return NextResponse.json({ error: 'Error al obtener la configuración visual de conceptos' }, { status: 500 });
	}
}
