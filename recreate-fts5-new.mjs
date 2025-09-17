import { getDbClient } from './src/lib/drizzle/index.js';

async function recreateFts5NewSchema() {
    console.log('🔄 Recreando FTS5 con nuevo esquema...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // 1. Eliminar tabla FTS5 antigua
        console.log('1. Eliminando tabla files_fts...');
        await client.execute('DROP TABLE IF EXISTS files_fts');
        console.log('   ✅ files_fts eliminada');
        
        // 2. Eliminar triggers antiguos
        console.log('2. Eliminando triggers antiguos...');
        const oldTriggers = [
            'images_ai', 'images_ad', 'images_au',
            'videos_ai', 'videos_ad', 'videos_au', 
            'documents_ai', 'documents_ad', 'documents_au',
            'audios_ai', 'audios_ad', 'audios_au'
        ];
        
        for (const trigger of oldTriggers) {
            try {
                await client.execute(`DROP TRIGGER IF EXISTS ${trigger}`);
            } catch (e) {
                // Ignorar errores
            }
        }
        console.log('   ✅ Triggers eliminados');
        
        // 3. Crear nueva tabla FTS5 con esquema mejorado
        console.log('3. Creando nueva tabla files_fts...');
        await client.execute(`CREATE VIRTUAL TABLE files_fts USING fts5(
          entity_id,
          entity_type,
          name,
          content,
          tags,
          tokenize = 'unicode61 remove_diacritics 2'
        )`);
        console.log('   ✅ Tabla files_fts creada');
        
        // 4. Poblar tabla FTS5
        console.log('4. Poblando tabla FTS5...');
        await client.execute(`
        INSERT INTO files_fts(entity_id, entity_type, name, content, tags)
        SELECT 
          id,
          'image',
          name,
          (name || ' ' || path || ' ' || COALESCE(description, '')),
          ''
        FROM Image
        UNION ALL
        SELECT 
          id,
          'video',
          name,
          (name || ' ' || path || ' ' || COALESCE(description, '')),
          ''
        FROM Video
        UNION ALL
        SELECT 
          id,
          'audio',
          name,
          (name || ' ' || path || ' ' || COALESCE(title, '') || ' ' || COALESCE(artist, '') || ' ' || COALESCE(album, '')),
          ''
        FROM Audio
        UNION ALL
        SELECT 
          id,
          'document',
          name,
          (name || ' ' || path || ' ' || COALESCE(title, '') || ' ' || COALESCE(author, '') || ' ' || COALESCE(subject, '') || ' ' || COALESCE(keywords, '')),
          ''
        FROM Document
        `);
        
        const ftsCount = await client.execute('SELECT COUNT(1) FROM files_fts');
        const totalFts = Number(ftsCount.rows?.[0]?.[0] || 0);
        console.log(`   ✅ ${totalFts} registros insertados en files_fts`);
        
        // 5. Crear triggers actualizados
        console.log('5. Creando triggers...');
        
        // Trigger para Image
        await client.execute(`
        CREATE TRIGGER IF NOT EXISTS images_ai AFTER INSERT ON Image BEGIN
          INSERT INTO files_fts(entity_id, entity_type, name, content, tags)
          VALUES (
            new.id,
            'image',
            new.name,
            (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '')),
            ''
          );
        END;
        `);
        
        await client.execute(`
        CREATE TRIGGER IF NOT EXISTS images_ad AFTER DELETE ON Image BEGIN
          DELETE FROM files_fts WHERE entity_id = old.id;
        END;
        `);
        
        await client.execute(`
        CREATE TRIGGER IF NOT EXISTS images_au AFTER UPDATE ON Image BEGIN
          UPDATE files_fts SET
            name = new.name,
            content = (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '')),
            tags = ''
          WHERE entity_id = new.id;
        END;
        `);
        
        // Trigger para Video (simplificando, solo Image por ahora)
        await client.execute(`
        CREATE TRIGGER IF NOT EXISTS videos_ai AFTER INSERT ON Video BEGIN
          INSERT INTO files_fts(entity_id, entity_type, name, content, tags)
          VALUES (
            new.id,
            'video',
            new.name,
            (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '')),
            ''
          );
        END;
        `);
        
        console.log('   ✅ Triggers principales creados (Image, Video)');
        
        console.log('🎉 ¡FTS5 recreado exitosamente con nuevo esquema!');
        console.log(`   📊 Total registros FTS5: ${totalFts}`);
        
        // Verificar muestra
        const sample = await client.execute('SELECT entity_id, entity_type, name FROM files_fts LIMIT 3');
        console.log('📋 Muestra de registros FTS5:');
        sample.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ID: ${row[0]}, Tipo: ${row[1]}, Nombre: ${row[2]}`);
        });
        
    } catch (error) {
        console.error('❌ Error recreando FTS5:', error);
        throw error;
    }
}

recreateFts5NewSchema().catch(console.error);