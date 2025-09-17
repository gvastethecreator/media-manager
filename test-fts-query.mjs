import { getDbClient } from './src/lib/drizzle/index.js';

async function testFtsQuery() {
    console.log('🧪 Probando consulta FTS5 directa...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        // Probar consulta básica FTS5
        console.log('1. Consulta básica FTS5...');
        const basicQuery = `
            SELECT 
                entity_id, 
                entity_type,
                name, 
                content,
                bm25(files_fts) as score 
            FROM files_fts 
            WHERE files_fts MATCH 'cartoon' 
            ORDER BY score 
            LIMIT 5
        `;
        
        const basicResult = await client.execute(basicQuery);
        console.log(`   ✅ Resultados básicos: ${basicResult.rows.length}`);
        basicResult.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ID: ${row[0]}, Tipo: ${row[1]}, Nombre: ${row[2]}, Score: ${row[4]}`);
        });
        
        // Probar consulta compleja con subquery
        console.log('\n2. Consulta compleja con subquery...');
        const complexQuery = `
            SELECT 
                ft.entity_id as id, 
                ft.name, 
                CASE ft.entity_type
                    WHEN 'image' THEN (SELECT path FROM Image WHERE id = ft.entity_id)
                    WHEN 'video' THEN (SELECT path FROM Video WHERE id = ft.entity_id)
                    WHEN 'audio' THEN (SELECT path FROM Audio WHERE id = ft.entity_id)
                    WHEN 'document' THEN (SELECT path FROM Document WHERE id = ft.entity_id)
                END as path,
                ft.tags, 
                ft.entity_type,
                bm25(files_fts) as score 
            FROM files_fts ft 
            WHERE ft MATCH 'cartoon' 
            ORDER BY score 
            LIMIT 3
        `;
        
        const complexResult = await client.execute(complexQuery);
        console.log(`   ✅ Resultados complejos: ${complexResult.rows.length}`);
        complexResult.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ID: ${row[0]}, Nombre: ${row[1]}, Path: ${row[2]}, Tipo: ${row[4]}, Score: ${row[5]}`);
        });
        
    } catch (error) {
        console.error('❌ Error en consulta FTS5:', error);
    }
}

testFtsQuery().catch(console.error);