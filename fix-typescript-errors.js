#!/usr/bin/env node
/**
 * 🔧 Script de corrección automática de errores TypeScript
 * 📝 Registra cada corrección y mantiene un log detallado del progreso
 *
 * Actualizado para Image Manager v2 (2025)
 * Incluye nuevas reglas específicas para tipos canónicos y transformadores
 */

const fs = require('fs');
const path = require('path');

// 📁 Configuración de archivos
const TSC_LOG_FILE = 'tsc-log.txt';
const PROGRESS_LOG = 'typescript-fixes-log.md';
const CURRENT_TASK_FILE = 'CURRENT-TASK.md';

// 📝 Configuración de reglas de reemplazo
const REPLACEMENT_RULES = {
	// 1. Reemplazar importaciones de tipos Prisma
	prismaImports: {
		pattern: /import\s+(?:{[^}]*})?\s*from\s+['"]@prisma\/client['"]/g,
		replacement: (match, filePath) => {
			// No reemplazar en archivos de servidor o servicios
			if (filePath.includes('/server/') || filePath.includes('/services/')) {
				return match;
			}
			// Determinar qué tipos importar basado en el contexto
			if (filePath.includes('/album/')) {
				return `import { Album, AlbumBase } from '@/types/entities/album/types'`;
			} else if (filePath.includes('/image/')) {
				return `import { Image, ImageBase } from '@/types/entities/image/types'`;
			}
			// Regla genérica
			return `// Reemplazar con tipos canónicos adecuados
// import { TiposNecesarios } from '@/types/entities/...'`;
		},
	},

	// 2. Corregir tipos en transformadores
	transformerTypes: {
		pattern: /(\w+):\s*Prisma\.(\w+)/g,
		replacement: '$1: $2',
	},
};

class TypeScriptErrorFixer {
	constructor() {
		this.startTime = new Date();
		this.fixedErrors = [];
		this.pendingErrors = [];
		this.skippedErrors = [];
		this.logEntries = [];
		this.replacementRules = REPLACEMENT_RULES;

		this.initializeLog();
	}

	/**
	 * 🚀 Inicializa el archivo de log
	 */
	initializeLog() {
		const header = `# 🔧 Registro de Correcciones TypeScript
**Iniciado:** ${this.startTime.toLocaleString('es-ES')}
**Archivo fuente:** ${TSC_LOG_FILE}

## 📊 Resumen de Progreso
- ✅ **Errores corregidos:** 0
- ⏳ **Errores pendientes:** 0
- ⏭️ **Errores omitidos:** 0

---

`;
		this.writeToLog(header);
		console.log('📝 Log inicializado en:', PROGRESS_LOG);
		console.log('🔧 Reglas de reemplazo configuradas:', Object.keys(this.replacementRules).length);
	}

	/**
	 * 📖 Lee y parsea el archivo tsc-log.txt
	 */
	async parseErrorLog() {
		try {
			const content = fs.readFileSync(TSC_LOG_FILE, 'utf8');
			const lines = content.split('\n').filter((line) => line.trim());

			const errors = [];
			let currentError = null;

			for (const line of lines) {
				// Detectar nueva línea de error
				if (line.includes('error TS')) {
					if (currentError) {
						errors.push(currentError);
					}

					const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
					if (match) {
						currentError = {
							file: match[1],
							line: Number.parseInt(match[2]),
							column: Number.parseInt(match[3]),
							code: match[4],
							message: match[5],
							fullLine: line,
						};
					}
				} else if (currentError && line.trim()) {
					// Líneas adicionales del error
					currentError.message += ` ${line.trim()}`;
				}
			}

			if (currentError) {
				errors.push(currentError);
			}

			this.pendingErrors = errors;
			this.logProgress(`📊 Análisis completado: ${errors.length} errores encontrados`);

			return errors;
		} catch (error) {
			this.logProgress(`❌ Error leyendo ${TSC_LOG_FILE}: ${error.message}`);
			return [];
		}
	}

	/**
	 * 📈 Clasifica errores por tipo y prioridad
	 */
	categorizeErrors(errors) {
		const categories = {
			TS2344: { name: 'Argumentos de tipo genérico', priority: 1, errors: [] },
			TS2322: { name: 'Asignación de tipos', priority: 2, errors: [] },
			TS2305: { name: 'Módulos no encontrados', priority: 3, errors: [] },
			TS2345: { name: 'Argumentos de función', priority: 2, errors: [] },
			TS2339: { name: 'Propiedades inexistentes', priority: 2, errors: [] },
			TS2304: { name: 'Nombres no encontrados', priority: 3, errors: [] },
			otros: { name: 'Otros errores', priority: 4, errors: [] },
		};
		for (const error of errors) {
			const category = categories[error.code] || categories.otros;
			category.errors.push(error);
		}

		// Ordenar por prioridad
		const sortedCategories = Object.entries(categories)
			.filter(([, cat]) => cat.errors.length > 0)
			.sort((a, b) => a[1].priority - b[1].priority);
		this.logProgress('## 📋 Categorización de Errores\n');
		for (const [code, category] of sortedCategories) {
			this.logProgress(`### ${code} - ${category.name} (${category.errors.length} errores)`);
			for (const error of category.errors.slice(0, 3)) {
				this.logProgress(`- \`${error.file}:${error.line}\` - ${error.message.substring(0, 100)}...`);
			}
			this.logProgress('');
		}

		return sortedCategories;
	}

	/**
	 * 🔧 Procesa errores de un archivo específico
	 */
	async processFileErrors(filePath) {
		const fileErrors = this.pendingErrors.filter((e) => e.file === filePath);
		if (fileErrors.length === 0) return;

		this.logProgress(`\n## 🔧 Procesando: \`${filePath}\``);
		this.logProgress(`**Errores encontrados:** ${fileErrors.length}\n`);

		for (const error of fileErrors) {
			await this.processError(error);
		}
	}

	/**
	 * ⚡ Procesa un error específico
	 */
	async processError(error) {
		const timestamp = new Date().toLocaleTimeString('es-ES');

		this.logProgress(`### ⚡ Error ${error.code} - Línea ${error.line}`);
		this.logProgress(`**Tiempo:** ${timestamp}`);
		this.logProgress(`**Mensaje:** ${error.message}`);
		this.logProgress('');

		// Aquí implementarías la lógica específica para cada tipo de error
		switch (error.code) {
			case 'TS2344':
				await this.fixGenericTypeError(error);
				break;
			case 'TS2322':
				await this.fixTypeAssignmentError(error);
				break;
			case 'TS2305':
				await this.fixModuleNotFoundError(error);
				break;
			case 'TS2345':
				await this.fixFunctionArgumentError(error);
				break;
			default:
				this.markAsSkipped(error, 'Tipo de error no implementado aún');
		}
	}

	/**
	 * ✅ Marca un error como corregido
	 */
	markAsFixed(error, solution) {
		this.fixedErrors.push({ ...error, solution, timestamp: new Date() });
		this.pendingErrors = this.pendingErrors.filter((e) => e !== error);

		this.logProgress(`✅ **CORREGIDO:** ${solution}`);
		this.logProgress('');

		this.updateSummary();
	}

	/**
	 * ⏭️ Marca un error como omitido
	 */
	markAsSkipped(error, reason) {
		this.skippedErrors.push({ ...error, reason, timestamp: new Date() });
		this.pendingErrors = this.pendingErrors.filter((e) => e !== error);

		this.logProgress(`⏭️ **OMITIDO:** ${reason}`);
		this.logProgress('');

		this.updateSummary();
	}

	/**
	 * 🔄 Actualiza el resumen del progreso
	 */
	updateSummary() {
		const content = fs.readFileSync(PROGRESS_LOG, 'utf8');
		const newSummary = `## 📊 Resumen de Progreso
- ✅ **Errores corregidos:** ${this.fixedErrors.length}
- ⏳ **Errores pendientes:** ${this.pendingErrors.length}
- ⏭️ **Errores omitidos:** ${this.skippedErrors.length}

**Última actualización:** ${new Date().toLocaleTimeString('es-ES')}

---`;

		const updatedContent = content.replace(/## 📊 Resumen de Progreso[\s\S]*?---/, newSummary);

		fs.writeFileSync(PROGRESS_LOG, updatedContent);
	}

	/**
	 * 📝 Escribe al archivo de log
	 */ writeToLog(content) {
		fs.appendFileSync(PROGRESS_LOG, `${content}\n`);
	}

	/**
	 * 📢 Log con timestamp
	 */
	logProgress(message) {
		console.log(message);
		this.writeToLog(message);
	}

	// 🔧 Métodos específicos de corrección (ejemplos)
	async fixGenericTypeError(error) {
		this.markAsSkipped(error, 'Requiere análisis manual de tipos genéricos');
	}

	async fixTypeAssignmentError(error) {
		this.markAsSkipped(error, 'Requiere análisis manual de asignaciones');
	}

	async fixModuleNotFoundError(error) {
		this.markAsSkipped(error, 'Requiere verificación de imports');
	}

	async fixFunctionArgumentError(error) {
		this.markAsSkipped(error, 'Requiere análisis manual de parámetros');
	}

	/**
	 * 🏁 Genera reporte final
	 */
	generateFinalReport() {
		const duration = new Date() - this.startTime;
		const minutes = Math.floor(duration / 60000);
		const seconds = Math.floor((duration % 60000) / 1000);

		this.logProgress('\n# 🏁 Reporte Final');
		this.logProgress(`**Duración:** ${minutes}m ${seconds}s`);
		this.logProgress(`**Total errores procesados:** ${this.fixedErrors.length + this.skippedErrors.length}`);
		this.logProgress('');
		if (this.fixedErrors.length > 0) {
			this.logProgress('## ✅ Errores Corregidos');
			for (const error of this.fixedErrors) {
				this.logProgress(`- \`${error.file}:${error.line}\` - ${error.solution}`);
			}
			this.logProgress('');
		}
		if (this.pendingErrors.length > 0) {
			this.logProgress('## ⏳ Errores Pendientes');
			for (const error of this.pendingErrors.slice(0, 10)) {
				this.logProgress(`- \`${error.file}:${error.line}\` - ${error.code}: ${error.message.substring(0, 100)}...`);
			}
			this.logProgress('');
		}
	}
}

// 🚀 Función principal
async function main() {
	console.log('🔧 Iniciando corrección de errores TypeScript...\n');

	const fixer = new TypeScriptErrorFixer();

	try {
		// 1. Parsear errores
		const errors = await fixer.parseErrorLog();
		if (errors.length === 0) {
			console.log('✅ No se encontraron errores o archivo no existe');
			return;
		}

		// 2. Categorizar errores
		const categories = fixer.categorizeErrors(errors); // 3. Procesar por archivos (los más problemáticos primero)
		const fileGroups = {};
		for (const error of errors) {
			if (!fileGroups[error.file]) fileGroups[error.file] = [];
			fileGroups[error.file].push(error);
		}

		const sortedFiles = Object.entries(fileGroups)
			.sort((a, b) => b[1].length - a[1].length)
			.slice(0, 5); // Procesar solo los 5 archivos con más errores

		for (const [filePath, fileErrors] of sortedFiles) {
			await fixer.processFileErrors(filePath);
		}

		// 4. Generar reporte final
		fixer.generateFinalReport();

		console.log(`\n📝 Log completo guardado en: ${PROGRESS_LOG}`);
	} catch (error) {
		console.error('❌ Error durante la ejecución:', error);
		fixer.logProgress(`❌ Error fatal: ${error.message}`);
	}
}

// Ejecutar si es llamado directamente
if (require.main === module) {
	main();
}

module.exports = TypeScriptErrorFixer;
