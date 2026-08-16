import { getFts5Status, ensureFts5Ready } from './src/lib/drizzle/fts5.js';
import { getDbClient } from './src/lib/drizzle/index.js';

async function diagnoseFts5() {
    console.log('🔍 Diagnosticando estado FTS5...');
    
    // 1. Estado inicial
    const initialStatus = getFts5Status();
    console.log('1. Estado inicial:', initialStatus);
    
    // 2. Verificar cliente DB
    const client = getDbClient();
    console.log('2. Cliente DB:', client ? '✅ Disponible' : '❌ No disponible');
    
    if (!client) {
        return;
    }
    
    // 3. Verificar soporte FTS5
    try {
        const moduleCheck = await client.execute("SELECT 1 FROM pragma_module_list WHERE name='fts5' LIMIT 1");
        console.log('3. Módulo FTS5:', moduleCheck.rows.length > 0 ? '✅ Soportado' : '❌ No soportado');
    } catch (e) {
        console.log('3. Error verificando módulo FTS5:', e.message);
    }
    
    // 4. Verificar tablas existentes
    try {
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%fts%'");
        console.log('4. Tablas FTS existentes:', tables.rows.map(r => r[0]));
    } catch (e) {
        console.log('4. Error verificando tablas:', e.message);
    }
    
    // 5. Intentar inicializar
    console.log('5. Intentando inicializar FTS5...');
    try {
        await ensureFts5Ready({ backfill: false });
        const finalStatus = getFts5Status();
        console.log('   Estado final:', finalStatus);
    } catch (e) {
        console.log('   ❌ Error inicializando:', e.message);
    }
    
    // 6. Verificar tabla files_fts específicamente
    try {
        const ftsCount = await client.execute("SELECT COUNT(*) FROM files_fts");
        console.log('6. Registros en files_fts:', ftsCount.rows[0][0]);
    } catch (e) {
        console.log('6. Error consultando files_fts:', e.message);
    }
}

diagnoseFts5().catch(console.error);