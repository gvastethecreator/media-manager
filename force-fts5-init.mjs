import { ensureFts5Ready, getFts5Status } from './src/lib/drizzle/fts5.js';

async function forceFts5Init() {
    console.log('🔧 Forzando inicialización FTS5...');
    
    try {
        // Estado antes
        const before = getFts5Status();
        console.log('Estado antes:', before);
        
        // Forzar inicialización
        await ensureFts5Ready({ backfill: true });
        
        // Estado después
        const after = getFts5Status();
        console.log('Estado después:', after);
        
        if (after.supported && after.initialized) {
            console.log('🎉 ¡FTS5 inicializado correctamente!');
        } else {
            console.log('⚠️ FTS5 no se inicializó correctamente');
        }
        
    } catch (error) {
        console.error('❌ Error forzando inicialización:', error);
    }
}

forceFts5Init().catch(console.error);