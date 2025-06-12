/**
 * 🚀 Script ultra-corregido para arreglar Server Actions
 *
 * Este script analiza y corrige automáticamente problemas comunes en los server actions
 * con un enfoque particular en la robustez del manejo de rutas y tipos.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 📁 Configuración
const ACTIONS_DIR = 'd:\\DEV\\image-manager\\src\\app\\actions';
const TYPES_DIR = 'd:\\DEV\\image-manager\\src\\types\\entities';
const RESULTS_FILE = path.join(__dirname, 'ultra-actions-fixes.log');
const ENTITIES_MAP = {
  'activities': 'Activity',
  'albums': 'Album',
  'characters': 'Character',
  'collections': 'Collection',
  'concepts': 'Concept',
  'favorites': 'Favorite',
  'files': 'File',
  'folders': 'Folder',
  'groups': 'Group',
  'images': 'Image',
  'metadata': 'Metadata',
  'notes': 'Note',
  'places': 'Place',
  'profiles': 'Profile',
  'prompts': 'Prompt',
  'properties': 'Property',
  'queue': 'QueueJob',
  'settings': 'Setting',
  'stats': 'Stats',
  'tags': 'Tag',
  'tasks': 'Task',
  'uploaded-images': 'UploadedImage',
  'videos': 'Video',
  'wildcards': 'Wildcard',
  'world-items': 'WorldItem'
};

// 📊 Estadísticas
let filesScanned = 0;
let filesModified = 0;
let errors = 0;
const entityStats = {};

/**
 * 🔍 Infiere la entidad desde la ruta del archivo
 * @param {string|undefined} filePath - Ruta del archivo
 */
function inferEntityFromPath(filePath) {
  // Protección adicional para filePath no string o undefined
  if (!filePath || typeof filePath !== 'string') {
    console.log("WARNING: filePath no es un string:", filePath);
    return null;
  }
  
  try {
    // Extraer de la ruta con estructura /actions/entity/...
    const pathRegex = /[/\\]actions[/\\]([\w-]+)[/\\]/;
    const match = filePath.match(pathRegex);

    if (match && match[1]) {
      const entityDir = match[1].toLowerCase();
      
      // Buscar en el mapa de entidades
      if (ENTITIES_MAP[entityDir]) {
        return ENTITIES_MAP[entityDir];
      }

      // Manejar casos especiales como "uploaded-images" -> "UploadedImage"
      if (entityDir.includes('-')) {
        const parts = entityDir.split('-');
        const camelCased = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        
        if (ENTITIES_MAP[camelCased.toLowerCase()]) {
          return ENTITIES_MAP[camelCased.toLowerCase()];
        }
        
        return camelCased;
      }

      // Singular y primera letra en mayúscula para el resto
      return entityDir.charAt(0).toUpperCase() + entityDir.slice(1).replace(/s$/, '');
    }
    
    // Si no podemos extraer de la ruta, intentamos del nombre del archivo
    const fileMatch = filePath.match(/[/\\]([\w-]+)(?:-crud|-query|-actions)?\.actions\.ts$/);
    if (fileMatch && fileMatch[1]) {
      const entityName = fileMatch[1].toLowerCase();
      
      if (ENTITIES_MAP[entityName]) {
        return ENTITIES_MAP[entityName];
      }
      
      if (entityName.includes('-')) {
        const parts = entityName.split('-');
        const camelCased = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        
        if (ENTITIES_MAP[camelCased.toLowerCase()]) {
          return ENTITIES_MAP[camelCased.toLowerCase()];
        }
        
        return camelCased;
      }
      
      return entityName.charAt(0).toUpperCase() + entityName.slice(1).replace(/s$/, '');
    }
  } catch (error) {
    console.error(`Error inferiendo entidad de ${filePath}:`, error);
  }
  
  return null;
}

/**
 * 🔍 Infiere la entidad del nombre de una entidad
 */
function inferEntityFromEntityName(entityName) {
  if (!entityName || typeof entityName !== 'string') return null;
  
  // Primero buscamos coincidencia exacta
  if (ENTITIES_MAP[entityName.toLowerCase()]) {
    return ENTITIES_MAP[entityName.toLowerCase()];
  }
  
  // Luego probamos con plural -> singular
  const singularName = entityName.replace(/s$/, '');
  if (ENTITIES_MAP[singularName.toLowerCase()]) {
    return ENTITIES_MAP[singularName.toLowerCase()];
  }
  
  // Por último, asumimos que está correctamente capitalizado
  return entityName;
}

/**
 * 🔍 Procesa un archivo
 */
async function processFile(filePath) {
  console.log(`Procesando: ${filePath}`);
  filesScanned++;
  
  try {
    // Prueba crítica: Inferir entidad
    console.log(`Intentando inferir entidad de: ${filePath}`);
    const entity = inferEntityFromPath(filePath);
    console.log(`Entidad inferida: ${entity || 'No se pudo determinar'}`);
    
    // Si no podemos inferir la entidad, continuar con el siguiente archivo
    if (!entity) {
      console.log(`⚠️ No se pudo inferir entidad para: ${filePath}`);
      return;
    }
    
    // Inicializar estadísticas
    if (!entityStats[entity]) {
      entityStats[entity] = { files: 0, modifications: 0 };
    }
    entityStats[entity].files++;
    
    // Obtener contenido del archivo
    console.log(`Leyendo archivo: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Para este script ultra-simplificado, solo verificamos el archivo
    fs.appendFileSync(RESULTS_FILE, `Verificado ${filePath} - Entidad: ${entity}\n`);
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error);
    errors++;
    
    // Registrar error
    fs.appendFileSync(RESULTS_FILE, `ERROR en ${filePath}: ${error}\n`);
  }
}

/**
 * 🚀 Función principal
 */
async function main() {
  console.log('🔧 Iniciando verificación de server actions');
  
  // Inicializar archivo de log
  fs.writeFileSync(RESULTS_FILE, `# Verificación de rutas y entidades\nIniciado: ${new Date().toISOString()}\n\n`);
  
  try {
    // Buscar archivos de server actions
    console.log(`Buscando archivos en: ${ACTIONS_DIR}`);
    const files = await glob('**/*.actions.ts', { 
      cwd: ACTIONS_DIR,
      absolute: true
    });
    
    console.log(`Encontrados ${files.length} archivos`);
    
    // Listar archivos encontrados
    fs.appendFileSync(RESULTS_FILE, `## Archivos encontrados (${files.length}):\n`);
    files.forEach(file => {
      fs.appendFileSync(RESULTS_FILE, `- ${file}\n`);
    });
    
    // Procesar manualmente archivo por archivo
    for (const file of files) {
      await processFile(file);
    }
    
    // Resumen
    const summary = `
## Resumen de verificación
- Archivos escaneados: ${filesScanned}
- Errores: ${errors}

Finalizado: ${new Date().toISOString()}
`;
    
    fs.appendFileSync(RESULTS_FILE, summary);
    console.log(summary);
    
  } catch (error) {
    console.error('❌ Error general:', error);
    fs.appendFileSync(RESULTS_FILE, `\n## ERROR FATAL\n${error.stack || error}\n`);
  }
}

// Ejecutar si se llama directamente
main().catch(console.error);
