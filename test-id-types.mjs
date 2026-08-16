import { getDbClient } from './src/lib/drizzle/index.js';

async function testIdTypes() {
    console.log('🔍 Verificando tipos de ID...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // Ver algunos IDs de muestra
        const imageIds = await client.execute('SELECT id, typeof(id) as id_type FROM Image LIMIT 3');
        console.log('📊 IDs de Image:');
        imageIds.rows.forEach(row => {
            console.log(`   ID: ${row[0]}, Tipo: ${row[1]}`);
        });
        
        // Probar inserción manual con ID específico
        console.log('\n🧪 Probando inserción manual...');
        const sampleId = imageIds.rows[0][0];
        console.log(`   Usando ID: ${sampleId}`);
        
        // Limpiar primero
        await client.execute('DELETE FROM files_fts');
        
        // Probar inserción directa
        await client.execute(`
        INSERT INTO files_fts(rowid, name, content, tags)
        VALUES (?, 'test', 'test content', '')
        `, [sampleId]);
        
        const count = await client.execute('SELECT COUNT(*) FROM files_fts');
        console.log(`✅ Inserción manual exitosa: ${count.rows[0][0]} registros`);
        
        // Probar inserción con CAST
        await client.execute('DELETE FROM files_fts');
        await client.execute(`
        INSERT INTO files_fts(rowid, name, content, tags)
        SELECT 
          CAST(id AS TEXT),
          name,
          name,
          ''
        FROM Image
        LIMIT 1
        `);
        
        const countCast = await client.execute('SELECT COUNT(*) FROM files_fts');
        console.log(`✅ Inserción con CAST exitosa: ${countCast.rows[0][0]} registros`);
        
    } catch (error) {
        console.error('❌ Error verificando tipos:', error);
    }
}

testIdTypes().catch(console.error);