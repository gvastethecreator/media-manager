import { getDbClient } from './src/lib/drizzle/index.js';

async function checkSchema() {
    console.log('🔍 Verificando esquema de tablas...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        const tables = ['Image', 'Video', 'Audio', 'Document'];
        
        for (const table of tables) {
            console.log(`\n📋 Esquema de ${table}:`);
            const schema = await client.execute(`PRAGMA table_info(${table})`);
            schema.rows.forEach(row => {
                console.log(`   ${row[1]} (${row[2]}) - ${row[3] ? 'NOT NULL' : 'NULL'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error verificando esquema:', error);
    }
}

checkSchema().catch(console.error);