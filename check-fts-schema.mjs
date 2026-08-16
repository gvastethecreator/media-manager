import { getDbClient } from './src/lib/drizzle/index.js';

async function checkFtsSchema() {
    console.log('🔍 Verificando esquema FTS5...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // Ver esquema de files_fts
        console.log('📋 Esquema de files_fts:');
        const schema = await client.execute('PRAGMA table_info(files_fts)');
        schema.rows.forEach(row => {
            console.log(`   ${row[1]} (${row[2]}) - ${row[3] ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Ver master de FTS5
        console.log('\n📋 Definición de files_fts:');
        const masterQuery = await client.execute("SELECT sql FROM sqlite_master WHERE name='files_fts'");
        if (masterQuery.rows.length > 0) {
            console.log(`   ${masterQuery.rows[0][0]}`);
        }
        
        // Probar inserción sin rowid (auto-assign)
        console.log('\n🧪 Probando inserción sin rowid...');
        await client.execute('DELETE FROM files_fts');
        
        await client.execute(`
        INSERT INTO files_fts(name, content, tags)
        VALUES ('test', 'test content', '')
        `);
        
        const result = await client.execute('SELECT rowid, name FROM files_fts');
        console.log(`✅ Inserción sin rowid exitosa:`);
        result.rows.forEach(row => {
            console.log(`   rowid: ${row[0]} (${typeof row[0]}), name: ${row[1]}`);
        });
        
    } catch (error) {
        console.error('❌ Error verificando esquema FTS:', error);
    }
}

checkFtsSchema().catch(console.error);