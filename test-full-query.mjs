import { getDbClient } from './src/lib/drizzle/index.js';

async function testFullQuery() {
    console.log('🧪 Probando consulta completa con el nuevo formato...');
    
    const client = getDbClient();
    if (!client) {
        console.error('❌ No se pudo obtener cliente de DB');
        return;
    }
    
    try {
        const querySql = `
            SELECT 
                files_fts.entity_id as id, 
                files_fts.name, 
                CASE files_fts.entity_type
                    WHEN 'image' THEN (SELECT path FROM Image WHERE id = files_fts.entity_id)
                    WHEN 'video' THEN (SELECT path FROM Video WHERE id = files_fts.entity_id)
                    WHEN 'audio' THEN (SELECT path FROM Audio WHERE id = files_fts.entity_id)
                    WHEN 'document' THEN (SELECT path FROM Document WHERE id = files_fts.entity_id)
                END as path,
                files_fts.tags, 
                files_fts.entity_type,
                bm25(files_fts) as score 
            FROM files_fts 
            WHERE files_fts MATCH ? 
            ORDER BY score 
            LIMIT ? OFFSET ?
        `;
        
        const result = await client.execute({ sql: querySql, args: ['cartoon', 3, 0] });
        console.log(`✅ Consulta exitosa: ${result.rows.length} resultados`);
        
        result.rows.forEach((row, i) => {
            console.log(`${i+1}. ID: ${row[0]}, Nombre: ${row[1]}, Path: ${row[2]}, Tipo: ${row[4]}, Score: ${row[5]}`);
        });
        
    } catch (error) {
        console.error('❌ Error en consulta:', error);
    }
}

testFullQuery().catch(console.error);