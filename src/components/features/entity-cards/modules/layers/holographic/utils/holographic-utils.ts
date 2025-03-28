import type { HolographicConfig } from '../actions/holographic-config.action';

interface HolographicEffectOptions extends Partial<HolographicConfig> {
	width: number;
	height: number;
	time?: number;
}

// 🌈 Generar color del arcoíris
function generateRainbowColor(
	time: number,
	saturation: number,
	brightness: number
): { r: number; g: number; b: number } {
	const hue = (time * 360) % 360;
	const s = saturation;
	const v = brightness;

	const h = hue / 60;
	const i = Math.floor(h);
	const f = h - i;
	const p = v * (1 - s);
	const q = v * (1 - s * f);
	const t = v * (1 - s * (1 - f));

	let r = 0,
		g = 0,
		b = 0;

	switch (i % 6) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		case 5:
			r = v;
			g = p;
			b = q;
			break;
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
}

// ✨ Generar efecto de iridiscencia
function generateIridescence(
	x: number,
	y: number,
	width: number,
	height: number,
	time: number,
	amount: number
): { r: number; g: number; b: number } {
	const angle = Math.atan2(y - height / 2, x - width / 2);
	const distance = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
	const normalizedDistance = distance / Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));

	const hue = (((angle + Math.PI) / (2 * Math.PI)) * 360 + time * 100) % 360;
	const saturation = 0.8;
	const brightness = Math.max(0.2, 1 - normalizedDistance) * amount;

	const h = hue / 60;
	const i = Math.floor(h);
	const f = h - i;
	const p = brightness * (1 - saturation);
	const q = brightness * (1 - saturation * f);
	const t = brightness * (1 - saturation * (1 - f));

	let r = 0,
		g = 0,
		b = 0;

	switch (i % 6) {
		case 0:
			r = brightness;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = brightness;
			b = p;
			break;
		case 2:
			r = p;
			g = brightness;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = brightness;
			break;
		case 4:
			r = t;
			g = p;
			b = brightness;
			break;
		case 5:
			r = brightness;
			g = p;
			b = q;
			break;
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
}

// 🌟 Generar efecto metálico
function generateMetallicEffect(
	x: number,
	y: number,
	width: number,
	height: number,
	time: number,
	amount: number
): number {
	const angle = Math.atan2(y - height / 2, x - width / 2);
	const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
	const wave = Math.sin(normalizedAngle * 10 + time * 2) * 0.5 + 0.5;
	return wave * amount;
}

// 🪞 Generar reflexión
function generateReflection(x: number, y: number, width: number, height: number, time: number, amount: number): number {
	const normalizedY = y / height;
	const wave = Math.sin(normalizedY * 10 + time * 3) * 0.5 + 0.5;
	return wave * amount;
}

// 🌫️ Generar grano
function generateGrain(amount: number): number {
	return Math.random() * amount;
}

// 🎨 Generar efecto holográfico
export function generateHolographicEffect(ctx: CanvasRenderingContext2D, options: HolographicEffectOptions): void {
	const {
		width,
		height,
		intensity = 0.5,
		time = 0,
		rainbow = true,
		rainbowSpeed = 1,
		rainbowSaturation = 0.8,
		rainbowBrightness = 0.8,
		iridescence = true,
		iridescenceAmount = 0.5,
		metallic = true,
		metallicAmount = 0.5,
		reflection = true,
		reflectionAmount = 0.3,
		grain = true,
		grainAmount = 0.2,
	} = options;

	// Obtener datos de imagen
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;

	// Calcular tiempo normalizado
	const normalizedTime = time * rainbowSpeed;

	// Generar color base del arcoíris
	const baseColor = rainbow
		? generateRainbowColor(normalizedTime, rainbowSaturation, rainbowBrightness)
		: { r: 255, g: 255, b: 255 };

	// Procesar cada píxel
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;

			// Color base
			let r = baseColor.r;
			let g = baseColor.g;
			let b = baseColor.b;
			let a = 255;

			// Aplicar iridiscencia
			if (iridescence) {
				const iridColor = generateIridescence(x, y, width, height, normalizedTime, iridescenceAmount);
				r = Math.round((r + iridColor.r) / 2);
				g = Math.round((g + iridColor.g) / 2);
				b = Math.round((b + iridColor.b) / 2);
			}

			// Aplicar efecto metálico
			if (metallic) {
				const metallicValue = generateMetallicEffect(x, y, width, height, normalizedTime, metallicAmount);
				r = Math.round(r * (1 - metallicValue) + 255 * metallicValue);
				g = Math.round(g * (1 - metallicValue) + 255 * metallicValue);
				b = Math.round(b * (1 - metallicValue) + 255 * metallicValue);
			}

			// Aplicar reflexión
			if (reflection) {
				const reflectionValue = generateReflection(x, y, width, height, normalizedTime, reflectionAmount);
				r = Math.round(r * (1 - reflectionValue) + 255 * reflectionValue);
				g = Math.round(g * (1 - reflectionValue) + 255 * reflectionValue);
				b = Math.round(b * (1 - reflectionValue) + 255 * reflectionValue);
			}

			// Aplicar grano
			if (grain) {
				const grainValue = generateGrain(grainAmount);
				r = Math.round(r * (1 - grainValue) + 255 * grainValue);
				g = Math.round(g * (1 - grainValue) + 255 * grainValue);
				b = Math.round(b * (1 - grainValue) + 255 * grainValue);
			}

			// Aplicar intensidad general
			r = Math.round(r * intensity);
			g = Math.round(g * intensity);
			b = Math.round(b * intensity);
			a = Math.round(255 * intensity);

			// Asignar color final
			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
			data[i + 3] = a;
		}
	}

	// Actualizar canvas
	ctx.putImageData(imageData, 0, 0);
}
