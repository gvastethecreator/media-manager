import { getDbClient } from './src/lib/drizzle/index.js';

async function recreateFts5() {
    console.log('🔄 Recreando tabla FTS5...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // 1. Eliminar tabla FTS5 antigua si existe
        console.log('1. Eliminando tablas FTS5 existentes...');
        try {
            await client.execute('DROP TABLE IF EXISTS media_fts');
            console.log('   ✅ media_fts eliminada');
        } catch (e) {
            console.log('   ⚠️ media_fts no existía:', e.message);
        }
        
        try {
            await client.execute('DROP TABLE IF EXISTS files_fts');
            console.log('   ✅ files_fts eliminada');
        } catch (e) {
            console.log('   ⚠️ files_fts no existía:', e.message);
        }
        
        // 2. Eliminar triggers antiguos
        console.log('2. Eliminando triggers antiguos...');
        const oldTriggers = [
            'images_ai', 'images_ad', 'images_au',
            'videos_ai', 'videos_ad', 'videos_au', 
            'documents_ai', 'documents_ad', 'documents_au',
            'audios_ai', 'audios_ad', 'audios_au',
            'files_ai', 'files_ad', 'files_au'
        ];
        
        for (const trigger of oldTriggers) {
            try {
                await client.execute(`DROP TRIGGER IF EXISTS ${trigger}`);
            } catch (e) {
                // Ignorar errores de triggers que no existen
            }
        }
        console.log('   ✅ Triggers eliminados');
        
        // 3. Verificar tabla File existe
        console.log('3. Verificando tabla File...');
        const fileCount = await client.execute('SELECT COUNT(1) FROM File');
        const totalFiles = Number(fileCount.rows?.[0]?.[0] || 0);
        console.log(`   ✅ Tabla File encontrada con ${totalFiles} registros`);
        
        // 4. Crear nueva tabla FTS5
        console.log('4. Creando nueva tabla files_fts...');
        await client.execute(`CREATE VIRTUAL TABLE files_fts USING fts5(
          name,
          content,
          tags,
          tokenize = 'unicode61 remove_diacritics 2'
        )`);
        console.log('   ✅ Tabla files_fts creada');
        
        // 5. Poblar tabla FTS5
        console.log('5. Poblando tabla FTS5...');
        await client.execute(`
        INSERT INTO files_fts(rowid, name, content, tags)
        SELECT 
          id,
          name,
          (name || ' ' || path || ' ' || COALESCE(description, '') || ' ' || COALESCE(tags, '')),
          COALESCE(tags, '')
        FROM File
        `);
        
        const ftsCount = await client.execute('SELECT COUNT(1) FROM files_fts');
        const totalFts = Number(ftsCount.rows?.[0]?.[0] || 0);
        console.log(`   ✅ ${totalFts} registros insertados en files_fts`);
        
        // 6. Crear triggers
        console.log('6. Creando triggers...');
        await client.execute(`
        CREATE TRIGGER IF NOT EXISTS files_ai AFTER INSERT ON File BEGIN
          INSERT INTO files_fts(rowid, name, content, tags)
          VALUES (
            new.id,
            new.name,
            (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '') || ' ' || COALESCE(new.tags, '')),
            COALESCE(new.tags, '')
          );
        END;
        `);
        
        await client.execute(`
        CREATE TRIGGER IF NOT EXISTS files_ad AFTER DELETE ON File BEGIN
          DELETE FROM files_fts WHERE rowid = old.id;
        END;
        `);
        
        await client.execute(`
        CREATE TRIGGER IF NOT EXISTS files_au AFTER UPDATE ON File BEGIN
          UPDATE files_fts SET
            name = new.name,
            content = (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '') || ' ' || COALESCE(new.tags, '')),
            tags = COALESCE(new.tags, '')
          WHERE rowid = new.id;
        END;
        `);
        
        console.log('   ✅ Triggers creados');
        
        console.log('🎉 ¡FTS5 recreado exitosamente!');
        console.log(`   📊 Total archivos: ${totalFiles}`);
        console.log(`   📊 Total FTS5: ${totalFts}`);
        
    } catch (error) {
        console.error('❌ Error recreando FTS5:', error);
        throw error;
    }
}

recreateFts5().catch(console.error);