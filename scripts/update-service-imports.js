import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const serviceReplacements = [
  // Servicios movidos a carpetas
  { old: '@/services/note.service', new: '@/services/note' },
  { old: '@/services/concept.service', new: '@/services/concept' },
  { old: '@/services/stats.service', new: '@/services/stats' },
  { old: '@/services/toast.service', new: '@/services/toast' },
  { old: '@/services/audio.service', new: '@/services/audio' },
  { old: '@/services/workflow.service', new: '@/services/workflow' },
  { old: '@/services/document.service', new: '@/services/document' },
  { old: '@/services/json-file.service', new: '@/services/json-file' },
  { old: '@/services/file3d.service', new: '@/services/file3d' },
  { old: '@/services/place.service', new: '@/services/place' },
  { old: '@/services/world-item.service', new: '@/services/world-item' },
  
  // Servicios que se movieron de ubicación
  { old: '@/services/collection-events.service', new: '@/services/collection/events.service' },
  { old: '@/services/image-converter.service', new: '@/services/image/converter.service' },
  
  // Servicios que ya están en carpetas pero se referenciaban mal
  { old: 'from \'@/services/collection/collection.service\'', new: 'from \'@/services/collection\'' },
  { old: 'from \'@/services/folder/folder.service\'', new: 'from \'@/services/folder\'' },
];

async function updateImports() {
  console.log('🔍 Buscando archivos TypeScript...');
  
  const files = await glob('src/**/*.{ts,tsx}', { 
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**', 'build/**']
  });
  
  console.log(`📁 Encontrados ${files.length} archivos`);
  
  let totalReplacements = 0;
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileReplacements = 0;
    
    for (const replacement of serviceReplacements) {
      const regex = new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = newContent.match(regex);
      if (matches) {
        newContent = newContent.replace(regex, replacement.new);
        fileReplacements += matches.length;
        totalReplacements += matches.length;
      }
    }
    
    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ ${file}: ${fileReplacements} reemplazos`);
    }
  }
  
  console.log(`\n🎉 Completado! Total de reemplazos: ${totalReplacements}`);
}

updateImports().catch(console.error);
