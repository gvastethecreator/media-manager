// 🔧 Resolver personalizado para Jest en Next.js 15 + React 19
// Maneja imports ESM y compatibilidad con el nuevo stack

const { createDefaultEsmPreset } = require('ts-jest');

module.exports = (path, options) => {
	// 🎯 Usar el resolver por defecto de Jest primero
	const defaultResolver = options.defaultResolver;

	try {
		// 🚀 Intentar resolver normalmente
		return defaultResolver(path, options);
	} catch (error) {
		// 🔧 Manejar casos especiales para Next.js 15 y React 19

		// 📦 Resolver módulos de Next.js con rutas específicas
		if (path.startsWith('next/')) {
			const nextPath = require.resolve(path, { paths: [options.basedir] });
			return nextPath;
		}

		// ⚛️ Resolver React 19 con compatibilidad
		if (path.startsWith('react') || path.startsWith('@types/react')) {
			const reactPath = require.resolve(path, { paths: [options.basedir] });
			return reactPath;
		}

		// 🎨 Resolver archivos CSS/SCSS como identity-obj-proxy
		if (/\.(css|scss|sass|less)$/.test(path)) {
			return require.resolve('identity-obj-proxy');
		}

		// 🖼️ Resolver archivos de imagen como string vacío
		if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(path)) {
			return require.resolve('./image-mock.js');
		}

		// 🔄 Si todo falla, intentar con paths del proyecto
		try {
			return require.resolve(path, {
				paths: [options.basedir, process.cwd(), ...(options.moduleDirectory || [])],
			});
		} catch (_finalError) {
			// 🚨 Lanzar el error original si no se puede resolver
			throw error;
		}
	}
};
