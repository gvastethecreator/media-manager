import { getDbClient } from './src/lib/drizzle/index.js';

async function testInsert() {
    console.log('🧪 Probando inserción FTS5...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // Limpiar tabla primero
        console.log('🧹 Limpiando tabla files_fts...');
        await client.execute('DELETE FROM files_fts');
        
        // Probar con una sola imagen primero
        console.log('🔧 Probando inserción de una imagen...');
        const testQuery = `
        INSERT INTO files_fts(rowid, name, content, tags)
        SELECT 
          id,
          name,
          (name || ' ' || path),
          ''
        FROM Image
        LIMIT 1
        `;
        
        await client.execute(testQuery);
        
        // Verificar resultado
        const count = await client.execute('SELECT COUNT(*) FROM files_fts');
        console.log(`✅ Registros insertados: ${count.rows[0][0]}`);
        
        // Probar con todos los tipos de tabla
        console.log('🔧 Probando inserción completa...');
        await client.execute('DELETE FROM files_fts');
        
        const fullQuery = `
        INSERT INTO files_fts(rowid, name, content, tags)
        SELECT 
          id,
          name,
          (name || ' ' || path),
          ''
        FROM Image
        UNION ALL
        SELECT 
          id,
          name,
          (name || ' ' || path),
          ''
        FROM Video
        UNION ALL
        SELECT 
          id,
          name,
          (name || ' ' || path),
          ''
        FROM Audio
        UNION ALL
        SELECT 
          id,
          name,
          (name || ' ' || path),
          ''
        FROM Document
        `;
        
        await client.execute(fullQuery);
        
        const finalCount = await client.execute('SELECT COUNT(*) FROM files_fts');
        console.log(`🎉 Total registros insertados: ${finalCount.rows[0][0]}`);
        
    } catch (error) {
        console.error('❌ Error en inserción:', error);
    }
}

testInsert().catch(console.error);