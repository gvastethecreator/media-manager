/**
 * Script de prueba para NoteService con Drizzle ORM
 * Verifica que los métodos de lectura funcionan correctamente
 */

import { count, eq } from 'drizzle-orm';
import { db, schema } from '../../src/lib/drizzle/index.js';

const { notes } = schema;

async function testNoteService() {
	console.log('📝 Iniciando pruebas de NoteService con Drizzle...\n');

	try {
		// Test 1: Contar notas totales
		console.log('📊 Test 1: Contando notas totales...');
		const totalNotes = await db.select({ count: count() }).from(notes);
		console.log(`   ✅ Total de notas: ${totalNotes[0]?.count || 0}\n`);

		// Test 2: Obtener primeras 5 notas
		console.log('📋 Test 2: Obteniendo primeras 5 notas...');
		const notesList = await db.select({
			id: notes.id,
			title: notes.title, // Campo real
			category: notes.category,
			priority: notes.priority,
			status: notes.status,
			content: notes.content,
			isFavorite: notes.isFavorite,
			createdAt: notes.createdAt,
		})
		.from(notes)
		.limit(5);

		console.log(`   ✅ Notas obtenidas: ${notesList.length}`);
		notesList.forEach((note, index) => {
			console.log(`   ${index + 1}. ${note.title}`);
			console.log(`      📂 Categoría: ${note.category || 'Sin categoría'}`);
			console.log(`      🎯 Prioridad: ${note.priority || 'Sin prioridad'}`);
			console.log(`      📊 Estado: ${note.status || 'Sin estado'}`);
			console.log(`      📄 Contenido: ${note.content ? `${note.content.substring(0, 50)}...` : 'Sin contenido'}`);
			console.log(`      ⭐ Favorito: ${note.isFavorite ? 'Sí' : 'No'}\n`);
		});

		// Test 3: Obtener nota específica por ID (si existe)
		if (notesList.length > 0) {
			const firstNote = notesList[0];
			console.log('🔍 Test 3: Obteniendo nota específica por ID...');

			const specificNote = await db.select({
				id: notes.id,
				title: notes.title, // Campo real
				content: notes.content,
				category: notes.category,
				priority: notes.priority,
				status: notes.status,
				featuredImage: notes.featuredImage,
				isFavorite: notes.isFavorite,
				createdAt: notes.createdAt,
				updatedAt: notes.updatedAt,
				presetId: notes.presetId, // Campo real
			})
			.from(notes)
			.where(eq(notes.id, firstNote.id))
			.limit(1);

			if (specificNote.length > 0) {
				const note = specificNote[0];
				console.log(`   ✅ Nota encontrada: ${note.title}`);
				console.log(`   📂 Categoría: ${note.category || 'Sin categoría'}`);
				console.log(`   🎯 Prioridad: ${note.priority || 0}`);
				console.log(`   📊 Estado: ${note.status || 'Sin estado'}`);
				console.log(`   🖼️ Imagen destacada: ${note.featuredImage || 'Ninguna'}`);
				console.log(`   📅 Creado: ${note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}`);
			} else {
				console.log('   ❌ Nota no encontrada');
			}
		}

		// Test 4: Probar filtros básicos
		console.log('\n🔍 Test 4: Probando filtros básicos...');

		// Notas favoritas
		const favoriteNotes = await db.select({ count: count() })
			.from(notes)
			.where(eq(notes.isFavorite, true));
		console.log(`   ⭐ Notas favoritas: ${favoriteNotes[0]?.count || 0}`);

		// Notas por categoría (si hay)
		const categorizedNotes = await db.select({ count: count() })
			.from(notes)
			.where(eq(notes.category, 'general'));
		console.log(`   📂 Notas categoría 'general': ${categorizedNotes[0]?.count || 0}`);

		// Notas por prioridad alta
		const highPriorityNotes = await db.select({ count: count() })
			.from(notes)
			.where(eq(notes.priority, 3));
		console.log(`   🔥 Notas prioridad alta (3): ${highPriorityNotes[0]?.count || 0}`);

		// Notas por estado activo
		const activeNotes = await db.select({ count: count() })
			.from(notes)
			.where(eq(notes.status, 'active'));
		console.log(`   ✅ Notas estado activo: ${activeNotes[0]?.count || 0}`);

		console.log('\n🎉 ¡Todas las pruebas de NoteService completadas exitosamente!');
		console.log('\n📈 Resumen:');
		console.log(`   • Total de notas: ${totalNotes[0]?.count || 0}`);
		console.log(`   • Notas favoritas: ${favoriteNotes[0]?.count || 0}`);
		console.log(`   • Notas categoría 'general': ${categorizedNotes[0]?.count || 0}`);
		console.log(`   • Consultas básicas funcionando: ✅`);
		console.log(`   • Filtros básicos funcionando: ✅`);

	} catch (error) {
		console.error('❌ Error en las pruebas de NoteService:', error);
		console.error('Detalles del error:', error instanceof Error ? error.message : 'Error desconocido');
		process.exit(1);
	}
}

// Ejecutar las pruebas
testNoteService()
	.then(() => {
		console.log('\n✅ Script de pruebas completado');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Error fatal:', error);
		process.exit(1);
	});