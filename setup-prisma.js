const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verificar si existe el archivo .env
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
	console.log('📄 Creando archivo .env...');
	fs.writeFileSync(envPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
	console.log('✅ Archivo .env creado con éxito');
} else {
	console.log('ℹ️ El archivo .env ya existe');

	// Verificar si contiene DATABASE_URL
	const envContent = fs.readFileSync(envPath, 'utf8');
	if (!envContent.includes('DATABASE_URL=')) {
		console.log('📝 Añadiendo DATABASE_URL al archivo .env...');
		fs.appendFileSync(envPath, '\nDATABASE_URL="file:./prisma/dev.db"\n');
		console.log('✅ DATABASE_URL añadido al archivo .env');
	}
}

// Verificar si existe la carpeta node_modules/.prisma
const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma');
if (!fs.existsSync(prismaClientPath)) {
	console.log('🔄 Generando cliente Prisma...');
	try {
		execSync('npx prisma generate', { stdio: 'inherit' });
		console.log('✅ Cliente Prisma generado con éxito');
	} catch (error) {
		console.error('❌ Error al generar el cliente Prisma:', error);
		process.exit(1);
	}
} else {
	console.log('ℹ️ El cliente Prisma ya está generado');
}

// Verificar si existe la base de datos
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
if (!fs.existsSync(dbPath)) {
	console.log('🔄 Creando la base de datos...');
	try {
		execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
		console.log('✅ Base de datos creada con éxito');

		console.log('🌱 Ejecutando seed para poblar la base de datos...');
		execSync('npx prisma db seed', { stdio: 'inherit' });
		console.log('✅ Seed ejecutado con éxito');
	} catch (error) {
		console.error('❌ Error al crear la base de datos:', error);
		process.exit(1);
	}
} else {
	console.log('ℹ️ La base de datos ya existe');
}

console.log('🎉 Entorno de Prisma configurado correctamente');
console.log('📚 Puedes usar el cliente Prisma en tu código importándolo desde src/lib/prisma.ts');
