import { NextResponse } from 'next/server';

// Configuración visual predeterminada para etiquetas
const DEFAULT_TAG_OPTIONS = {
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
		preset: 'tag',
		variant: 'default',
		aspectRatio: '4/3',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#3b82f6',
	secondaryColor: '#10b981',
	hoverLiftHeight: 8,
	maxRotation: 12,
};

export async function GET() {
	try {
		// En el futuro, aquí podríamos obtener la configuración desde la base de datos
		// o desde algún otro servicio basado en el contexto del usuario
		return NextResponse.json(DEFAULT_TAG_OPTIONS);
	} catch (error) {
		console.error('Error al obtener la configuración visual de etiquetas:', error);
		return NextResponse.json({ error: 'Error al obtener la configuración visual de etiquetas' }, { status: 500 });
	}
}
