import { NextResponse } from 'next/server';

// Configuración visual predeterminada para personajes
const DEFAULT_CHARACTER_OPTIONS = {
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
		preset: 'character',
		variant: 'default',
		aspectRatio: '2/3',
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
	primaryColor: '#f59e0b',
	secondaryColor: '#ef4444',
	hoverLiftHeight: 15,
	maxRotation: 18,
};

export async function GET() {
	try {
		// En el futuro, aquí podríamos obtener la configuración desde la base de datos
		// o desde algún otro servicio basado en el contexto del usuario
		return NextResponse.json(DEFAULT_CHARACTER_OPTIONS);
	} catch (error) {
		console.error('Error al obtener la configuración visual de personajes:', error);
		return NextResponse.json({ error: 'Error al obtener la configuración visual de personajes' }, { status: 500 });
	}
}
