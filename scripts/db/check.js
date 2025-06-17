/**
 * Script para verificar el estado de la base de datos
 * Versión mejorada para Windows
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

// Función para mostrar mensajes con colores
function log(message, color = colors.blue) {
	console.log(`${color}${message}${colors.reset}`);
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
	try {
		return fs.existsSync(filePath);
	} catch (error) {
		log(`Error al verificar si existe el archivo ${filePath}: ${error.message}`, colors.red);
		return false;
	}
}

// Función para ejecutar comandos con mejor manejo de errores
function runCommand(command, args = []) {
	try {
		const output = execSync(`${command} ${args.join(' ')}`, {
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		return { success: true, output };
	} catch (error) {
		return {
			success: false,
			error: error.message,
			output: error.stdout ? error.stdout.toString() : '',
		};
	}
}

// Función principal
function checkDatabase() {
	log('\n🔍 Verificando estado de la base de datos...', colors.blue);
	log('=============================================', colors.blue);

	// Verificar archivo .env
	const rootDir = path.resolve(__dirname, '../..');
	const envPath = path.join(rootDir, '.env');

	if (fileExists(envPath)) {
		log('✅ Archivo .env encontrado', colors.green);
		try {
			const envContent = fs.readFileSync(envPath, 'utf8');
			if (envContent.includes('DATABASE_URL=')) {
				const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
				if (dbUrlMatch?.[1]) {
					log(`✅ DATABASE_URL configurada: ${dbUrlMatch[1]}`, colors.green);
				} else {
					log('✅ DATABASE_URL configurada en .env', colors.green);
				}
			} else {
				log('❌ DATABASE_URL no encontrada en .env', colors.red);
			}
		} catch (error) {
			log(`❌ Error al leer el archivo .env: ${error.message}`, colors.red);
		}
	} else {
		log('❌ Archivo .env no encontrado', colors.red);
	}

	log('---------------------------------------------', colors.blue);

	// Verificar base de datos SQLite
	const dbPath = path.join(rootDir, 'prisma', 'dev.db');
	if (fileExists(dbPath)) {
		try {
			const stats = fs.statSync(dbPath);
			const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
			log(`✅ Base de datos SQLite encontrada (${sizeInMB} MB)`, colors.green);

			// Intentar contar registros en algunas tablas
			log('🔍 Verificando contenido de la base de datos...', colors.blue);

			// Verificar versión de Prisma
			const prismaVersionResult = runCommand('npx', ['prisma', '--version']);
			if (prismaVersionResult.success) {
				log(`✅ Versión de Prisma: ${prismaVersionResult.output.trim()}`, colors.green);
			} else {
				log('❌ No se pudo verificar la versión de Prisma', colors.red);
			}
		} catch (error) {
			log(`❌ Error al obtener información de la base de datos: ${error.message}`, colors.red);
		}
	} else {
		log('❌ Base de datos SQLite no encontrada', colors.red);
	}

	log('---------------------------------------------', colors.blue);

	// Verificar directorio de migraciones
	const migrationsPath = path.join(rootDir, 'prisma', 'migrations');
	if (fileExists(migrationsPath)) {
		try {
			const migrations = fs.readdirSync(migrationsPath);
			log(`✅ Directorio de migraciones encontrado con ${migrations.length} migraciones`, colors.green);

			if (migrations.length > 0) {
				log('📋 Migraciones disponibles:', colors.cyan);
				migrations.forEach((migration) => {
					log(`   - ${migration}`, colors.cyan);
				});
			}
		} catch (error) {
			log(`❌ Error al leer el directorio de migraciones: ${error.message}`, colors.red);
		}
	} else {
		log('ℹ️ Directorio de migraciones no encontrado (usando db push)', colors.yellow);
	}

	log('---------------------------------------------', colors.blue);

	// Verificar cliente Prisma generado
	const prismaClientPath = path.join(rootDir, 'node_modules', '.prisma');
	if (fileExists(prismaClientPath)) {
		log('✅ Cliente Prisma generado encontrado', colors.green);

		// Verificar archivos generados
		try {
			const clientFiles = fs.readdirSync(prismaClientPath);
			log(`✅ Archivos del cliente Prisma: ${clientFiles.length}`, colors.green);
		} catch (error) {
			log(`❌ Error al leer archivos del cliente Prisma: ${error.message}`, colors.red);
		}
	} else {
		log('❌ Cliente Prisma generado no encontrado', colors.red);
		log('   Ejecuta "npx prisma generate" para generarlo', colors.yellow);
	}

	log('---------------------------------------------', colors.blue);
	log('🔍 Verificación completada', colors.blue);
	log('\n📝 Resumen:', colors.magenta);
	log('- Si la base de datos existe y tiene tamaño, está correctamente configurada', colors.magenta);
	log('- Si no hay migraciones pero la base de datos existe, se está usando db push', colors.magenta);
	log('- Para resetear la base de datos: pnpm run db:full-reset', colors.magenta);
	log('- Para abrir Prisma Studio: npx prisma studio', colors.magenta);
}

// Ejecutar la función principal
checkDatabase();
