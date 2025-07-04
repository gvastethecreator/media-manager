#!/usr/bin/env bun
/**
 * Script para desarrollo del servidor con auto-restart
 * Solución simple al problema de onSuccess en Windows
 */

console.log('🚀 Iniciando servidor de desarrollo...');
console.log('� 1. Build inicial...');

// Ejecutar build inicial
const { spawn } = require('child_process');
const build = spawn('bun', ['run', 'build:server'], { stdio: 'inherit', shell: true });

build.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Build inicial completado');
        console.log('� 2. Iniciando watch mode...');

        // Iniciar watch mode
        const watch = spawn('bun', ['run', 'watch:server'], { stdio: 'inherit', shell: true });

        // En otra terminal, después de 3 segundos, iniciar el servidor
        setTimeout(() => {
            console.log('\n🌟 3. Iniciando servidor backend...');
            console.log('💡 Para iniciar el servidor manualmente ejecuta: bun run start:server');
            console.log('🌐 El servidor debería estar en: http://localhost:5173');
        }, 3000);

    } else {
        console.error('❌ Error en build inicial');
        process.exit(1);
    }
});
