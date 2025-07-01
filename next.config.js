/** @type {import('next').NextConfig} */

const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '3000',
				pathname: '/api/images/**',
			},
		],
		domains: ['localhost'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		formats: ['image/webp'],
		minimumCacheTTL: 60,
		dangerouslyAllowSVG: true,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		unoptimized: process.env.NODE_ENV === 'development',
	},
	experimental: {
		optimizePackageImports: ['@/components', 'lucide-react'],
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	// Configuración de webpack para resolver los módulos node:
	webpack: (config, { isServer }) => {
		// Soporte para importaciones node:*
		if (!config.resolve) {
			config.resolve = {};
		}

		if (!config.resolve.alias) {
			config.resolve.alias = {};
		}

		// Mapear los módulos node: a sus contrapartes regulares
		config.resolve.alias = {
			...config.resolve.alias,
			'node:os': 'os',
			'node:fs': 'fs',
			'node:path': 'path',
			'node:crypto': 'crypto',
			'node:stream': 'stream',
			'node:fs/promises': 'fs/promises',
			'node:util': 'util',
			'node:events': 'events',
			'node:buffer': 'buffer',
			'node:url': 'url',
			'node:http': 'http',
			'node:https': 'https',
			'node:assert': 'assert',
			'node:net': 'net',
			'node:tls': 'tls',
			'node:zlib': 'zlib',
			'node:dns': 'dns',
			'node:tty': 'tty',
			'node:child_process': 'child_process',
		};

		return config;
	},
	async headers() {
		return [
			{
				source: '/api/images/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET',
					},
				],
			},
		];
	},
};

export default nextConfig;
