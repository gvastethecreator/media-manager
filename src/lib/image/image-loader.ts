export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
	// Si la URL ya es absoluta o es una data URL, la devolvemos tal cual
	if (src.startsWith('http') || src.startsWith('data:')) {
		return src;
	}

	// Si es una ruta de API, agregamos los parámetros de optimización
	if (src.startsWith('/api/images/')) {
		const url = new URL(src, 'http://local.invalid');
		url.searchParams.set('w', width.toString());
		if (quality) {
			url.searchParams.set('q', quality.toString());
		}
		return `${url.pathname}${url.search}`;
	}

	// Para imágenes locales en public/, usar la ruta relativa
	return src;
}
