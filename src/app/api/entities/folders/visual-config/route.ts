import { NextResponse } from 'next/server';

// Configuración visual predeterminada para carpetas
const DEFAULT_FOLDER_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	designSystem: {
		preset: 'folder',
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},
};

export async function GET() {
	try {
		// En el futuro, aquí podríamos obtener la configuración desde la base de datos
		// o desde algún otro servicio
		return NextResponse.json(DEFAULT_FOLDER_OPTIONS);
	} catch (error) {
		console.error('Error al obtener la configuración visual:', error);
		return NextResponse.json(
			{ error: 'Error al obtener la configuración visual' },
			{ status: 500 }
		);
	}
}