import { ensureFts5Ready } from './src/lib/drizzle/fts5.js';
import { getDbClient } from './src/lib/drizzle/index.js';

async function runBackfill() {
    console.log('🔄 Ejecutando backfill FTS5...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // Verificar registros antes
        const filesBefore = await client.execute('SELECT COUNT(*) FROM File');
        const ftsBefore = await client.execute('SELECT COUNT(*) FROM files_fts');
        
        console.log(`📊 Estado antes del backfill:`);
        console.log(`   Archivos en File: ${filesBefore.rows[0][0]}`);
        console.log(`   Registros en files_fts: ${ftsBefore.rows[0][0]}`);
        
        // Ejecutar backfill
        console.log('🚀 Ejecutando backfill...');
        await ensureFts5Ready({ backfill: true });
        
        // Verificar registros después
        const filesAfter = await client.execute('SELECT COUNT(*) FROM File');
        const ftsAfter = await client.execute('SELECT COUNT(*) FROM files_fts');
        
        console.log(`📊 Estado después del backfill:`);
        console.log(`   Archivos en File: ${filesAfter.rows[0][0]}`);
        console.log(`   Registros en files_fts: ${ftsAfter.rows[0][0]}`);
        
        if (Number(ftsAfter.rows[0][0]) > 0) {
            console.log('🎉 ¡Backfill exitoso!');
        } else {
            console.log('⚠️ El backfill no agregó registros. Verificar datos en tabla File.');
        }
        
    } catch (error) {
        console.error('❌ Error ejecutando backfill:', error);
    }
}

runBackfill().catch(console.error);