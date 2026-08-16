import { getDbClient } from './src/lib/drizzle/index.js';

async function checkTables() {
    console.log('🔍 Verificando estructura de tablas...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // Verificar todas las tablas principales
        const tables = ['Image', 'Video', 'Audio', 'Document', 'File'];
        
        for (const table of tables) {
            try {
                const count = await client.execute(`SELECT COUNT(*) FROM ${table}`);
                console.log(`📊 ${table}: ${count.rows[0][0]} registros`);
            } catch (e) {
                console.log(`❌ ${table}: No existe o error - ${e.message}`);
            }
        }
        
        // Ver algunas muestras de la tabla Image
        console.log('\n📋 Muestra de registros en Image:');
        const sample = await client.execute('SELECT id, name, path FROM Image LIMIT 3');
        sample.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ID: ${row[0]}, Name: ${row[1]}, Path: ${row[2]}`);
        });
        
    } catch (error) {
        console.error('❌ Error verificando tablas:', error);
    }
}

checkTables().catch(console.error);