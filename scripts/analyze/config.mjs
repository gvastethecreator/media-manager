/**
 * Configuración para el sistema de análisis del proyecto
 * @module config
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración principal (debe ir primero)
export const CONFIG_PRINCIPAL = {
	rootDir: path.resolve(__dirname, '../../'),
	docsDir: path.resolve(__dirname, '../../docs/analisis'),
	thresholds: {
		largeFile: 300, // Número de líneas para considerar un archivo grande
		maxTodos: 20, // Número máximo de TODOs recomendados
		maxConsole: 10, // Número máximo de console.log recomendados
	},
};

/**
 * Configuración global del analizador
 */
export const CONFIG = {
	// Directorios
	srcDir: path.resolve(CONFIG_PRINCIPAL.rootDir, 'src'),
	outputDir: path.resolve(CONFIG_PRINCIPAL.rootDir, 'reports'),
	docsDir: CONFIG_PRINCIPAL.docsDir,

	// Análisis de código
	fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
	excludeDirs: ['node_modules', '.next', 'dist', 'build', 'coverage'],

	// Análisis de rendimiento
	performance: {
		bundleSizeThresholds: {
			warning: 500000, // 500KB
			error: 1000000, // 1MB
		},
		resourceThresholds: {
			maxJsFiles: 30,
			maxCssFiles: 10,
			maxImageFiles: 50,
			maxFontFiles: 5,
		},
		renderingThresholds: {
			fcp: 2000, // 2s
			tti: 3500, // 3.5s
			tbt: 300, // 300ms
			cls: 0.1, // 0.1
		},
	},

	// Análisis de dependencias
	dependencies: {
		checkVersions: true,
		checkVulnerabilities: true,
		checkLicenses: true,
	},

	// Análisis de código
	code: {
		maxLines: 300, // Líneas por archivo
		maxComplexity: 10, // Complejidad ciclomática
		maxParams: 4, // Parámetros por función
		maxDepth: 3, // Profundidad de anidación
		maxLength: 80, // Longitud de línea
		minCommentRatio: 0.1, // Ratio mínimo de comentarios
	},

	// Reportes
	reports: {
		format: 'markdown', // markdown o json
		includeTimestamp: true,
		includeGitInfo: true,
		saveToFile: true,
	},
};

/**
 * Unidades de bytes para formateo
 */
export const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Tipos de archivos para análisis
 */
export const FILE_TYPES = {
	JAVASCRIPT: 'javascript',
	TYPESCRIPT: 'typescript',
	REACT: 'react',
	STYLE: 'style',
	TEST: 'test',
	CONFIG: 'config',
	DOCUMENTATION: 'documentation',
};

/**
 * Patrones de archivos por tipo
 */
export const FILE_PATTERNS = {
	[FILE_TYPES.JAVASCRIPT]: /\.(js|jsx|mjs)$/,
	[FILE_TYPES.TYPESCRIPT]: /\.(ts|tsx)$/,
	[FILE_TYPES.REACT]: /\.(jsx|tsx)$/,
	[FILE_TYPES.STYLE]: /\.(css|scss|sass|less)$/,
	[FILE_TYPES.TEST]: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
	[FILE_TYPES.CONFIG]: /\.(config|rc)\.(js|json)$/,
	[FILE_TYPES.DOCUMENTATION]: /\.(md|mdx)$/,
};

/**
 * Niveles de severidad para problemas
 */
export const SEVERITY = {
	ERROR: 'error',
	WARNING: 'warning',
	INFO: 'info',
};

// Umbrales de rendimiento
export const PERFORMANCE_THRESHOLDS = {
	bundleSize: 244 * 1024, // 244KB límite recomendado para JS
	firstContentfulPaint: 1800, // 1.8s
	timeToInteractive: 3800, // 3.8s
	totalBlockingTime: 200, // 200ms
	unusedJavaScript: 20, // 20% máximo de JS sin usar
	styleCount: 2000, // número máximo de reglas de estilo
	deferredJs: 85, // 85% del JS debería ser diferido
};

// Configuración específica para Next.js 15 y React 19
export const NEXTJS_CONFIG = {
	// Directorios específicos de Next.js 15 App Router
	appDirs: ['app', 'components', 'lib', 'hooks', 'store', 'styles', 'providers'],

	// Patrones de archivos importantes en Next.js 15
	importantPatterns: [
		'layout.tsx',
		'page.tsx',
		'loading.tsx',
		'error.tsx',
		'not-found.tsx',
		'route.ts',
		'middleware.ts',
		'actions.ts',
	],

	// Hooks de React a analizar
	reactHooks: [
		'useState',
		'useEffect',
		'useContext',
		'useReducer',
		'useCallback',
		'useMemo',
		'useRef',
		'useImperativeHandle',
		'useLayoutEffect',
		'useDebugValue',
		'useDeferredValue',
		'useTransition',
		'useId',
		'useOptimistic',
		'useFormStatus',
		'useFormState',
	],
};

// Exportar la configuración completa
export default {
	CONFIG,
	BYTE_UNITS,
	FILE_TYPES,
	FILE_PATTERNS,
	SEVERITY,
	CONFIG_PRINCIPAL,
	PERFORMANCE_THRESHOLDS,
	NEXTJS_CONFIG,
};
