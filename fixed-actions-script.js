/**
 * 🚀 Script avanzado para corregir errores en Server Actions
 *
 * Este script analiza y corrige automáticamente problemas comunes en los server actions:
 * - Elimina Promise<unknown> de parámetros de entrada
 * - Corrige tipos de retorno en funciones
 * - Actualiza importaciones de tipos Prisma a tipos canónicos
 * - Simplifica includes de Prisma
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 📁 Configuración
const ACTIONS_DIR = 'd:\\DEV\\image-manager\\src\\app\\actions';
const TYPES_DIR = 'd:\\DEV\\image-manager\\src\\types\\entities';
const RESULTS_FILE = path.join(__dirname, 'server-actions-fixes.log');
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

// 🔍 Patrones de reemplazo
const REPLACEMENTS = [
  // 1. Eliminar Promise<unknown> de parámetros de entrada
  {
    pattern: /(\w+)\s*:\s*Promise<unknown>(\w+)/g,
    replacement: '$1: $2',
  },
  
  // 2. Promise<unknown> en argumentos entre paréntesis
  {
    pattern: /\(\s*(\w+)\s*:\s*Promise<unknown>(\w+)\s*\)/g,
    replacement: '($1: $2)',
  },
  
  // 3. Corregir funciones sin tipo de retorno
  {
    pattern: /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*(?!:)(\s*{)/g,
    replacement: (match, fnName, brace, offset, string, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromPath(filePathStr);
      
      if (entity) {
        // Analizamos el contexto para determinar el tipo de retorno apropiado
        if (fnName.startsWith('get') && !fnName.endsWith('s') && !fnName.includes('All')) {
          return `export async function ${fnName}([^)]*): Promise<${entity}Extended | null>${brace}`;
        } 
        if (fnName.startsWith('create')) {
          return `export async function ${fnName}([^)]*): Promise<${entity}Extended>${brace}`;
        }
        if (fnName.startsWith('update')) {
          return `export async function ${fnName}([^)]*): Promise<${entity}Extended>${brace}`;
        }
        if (fnName.startsWith('delete')) {
          return `export async function ${fnName}([^)]*): Promise<void>${brace}`;
        }
        if (
          fnName.startsWith('getAll') || 
          fnName.startsWith('list') || 
          fnName.endsWith('s') || 
          fnName.includes('Many')
        ) {
          return `export async function ${fnName}([^)]*): Promise<${entity}Extended[]>${brace}`;
        }
      }
      
      return `export async function ${fnName}([^)]*): Promise<unknown>${brace}`;
    }
  },
  
  // 4. Reemplazar Promise<unknown> genérico con tipos específicos basados en el nombre de la función
  {
    pattern: /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*:\s*Promise<unknown>\s*{/g,
    replacement: (match, fnName, offset, string, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromPath(filePathStr);
      
      if (entity) {
        // Determinar tipo de retorno basado en el nombre de la función
        if (fnName.startsWith('get') && !fnName.endsWith('s') && !fnName.includes('All')) {
          return match.replace('Promise<unknown>', `Promise<${entity}Extended | null>`);
        } 
        if (fnName.startsWith('create')) {
          return match.replace('Promise<unknown>', `Promise<${entity}Extended>`);
        }
        if (fnName.startsWith('update')) {
          return match.replace('Promise<unknown>', `Promise<${entity}Extended>`);
        }
        if (fnName.startsWith('delete')) {
          return match.replace('Promise<unknown>', `Promise<void>`);
        }
        if (
          fnName.startsWith('getAll') || 
          fnName.startsWith('list') || 
          fnName.endsWith('s') || 
          fnName.includes('Many')
        ) {
          return match.replace('Promise<unknown>', `Promise<${entity}Extended[]>`);
        }
      }
      
      return match;
    }
  },
  
  // 5. Reemplazar importaciones de Prisma
  {
    pattern: /import\s+(?:{[^}]*?(?:type\s+)?(?:Prisma|\w+)(?:\s+as\s+\w+)?[^}]*?}|[^{}\n]+?(?:type\s+)?(?:Prisma|\w+)(?:\s+as\s+\w+)?)\s+from\s+['"]@prisma\/client['"]/g,
    replacement: (match, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromPath(filePathStr);
      
      if (!entity) {
        return match;
      }
      
      // Extraemos los tipos importados
      const importMatches = match.match(/{([^}]*)}/);
      if (importMatches) {
        const imports = importMatches[1].split(',').map(i => i.trim());
        const prismaImports = imports.filter(i => i.includes('Prisma') || ENTITIES_MAP[i.toLowerCase()]);
        
        if (prismaImports.length > 0) {
          return `// Usar tipos canónicos en lugar de Prisma
import type { ${entity}Base, ${entity}Extended, Create${entity}Data, Update${entity}Data } from '@/types/entities/${entity.toLowerCase()}'`;
        }
      }
      
      return match;
    }
  },
  
  // 6. Añadir importaciones de tipos necesarios al principio de los archivos
  {
    pattern: /'use server';(?:\r?\n)+/g,
    replacement: (match, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromPath(filePathStr);
      
      if (!entity) {
        return match;
      }
      
      // Comprobamos si el archivo ya tiene la importación
      try {
        const fileContent = fs.readFileSync(filePathStr, 'utf8');
        if (fileContent.includes(`from '@/types/entities/${entity.toLowerCase()}'`)) {
          return match;
        }
      } catch (err) {
        console.error(`Error leyendo archivo ${filePathStr}:`, err);
        return match;
      }
      
      return `'use server';

// Importamos tipos canónicos
import type { ${entity}Base, ${entity}Extended, Create${entity}Data, Update${entity}Data } from '@/types/entities/${entity.toLowerCase()}';

`;
    }
  },
  
  // 7. Simplificar includes complejos de Prisma
  {
    pattern: /include:\s*{(?:[^{}]+|{(?:[^{}]+|{[^{}]*})*})*}/gs,
    replacement: (match, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromPath(filePathStr);
      
      if (!entity) return match;
      
      // Si es un include muy largo, lo dejamos como está pero añadimos comentario
      if (match.split('\n').length > 5) {
        return `// TODO: Considerar simplificar este include
${match}`;
      }
      
      return match;
    }
  },
  
  // 8. Corregir tipos en exportacion de funciones CRUD
  {
    pattern: /export\s+async\s+function\s+(create|update|get|delete|getAll|list)(\w+)\s*\(([^)]*)\)/g,
    replacement: (match, actionType, entityName, params, offset, string, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromEntityName(entityName) || inferEntityFromPath(filePathStr);
      
      if (!entity) return match;
      
      // Corregir tipos de retorno basado en la acción
      const returnType = 
        actionType === 'get' ? `Promise<${entity}Extended | null>` :
        actionType === 'delete' ? 'Promise<void>' :
        actionType === 'getAll' || actionType === 'list' ? `Promise<${entity}Extended[]>` :
        `Promise<${entity}Extended>`;
      
      // Corregir los parámetros si incluyen Promise<unknown>
      const correctedParams = params.replace(/Promise<unknown>(\w+)/g, '$1');
      
      return `export async function ${actionType}${entityName}(${correctedParams}): ${returnType}`;
    }
  },
  
  // 9. Reemplazar Prisma.XYZCreateInput con tipos canónicos
  {
    pattern: /Prisma\.(\w+)(?:Create|Update)Input/g,
    replacement: (match, entityName, offset, string, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromEntityName(entityName) || inferEntityFromPath(filePathStr);
      
      if (entity) {
        if (match.includes('Create')) {
          return `Create${entity}Data`;
        }
        if (match.includes('Update')) {
          return `Update${entity}Data`;
        }
      }
      
      return match;
    }
  },
  
  // 10. Reemplazar any[] con tipos canónicos en arrays
  {
    pattern: /(Promise<)any(\[\]>)/g,
    replacement: (match, prefix, suffix, offset, string, filePath) => {
      // Asegurarnos de que filePath sea una cadena
      const filePathStr = String(filePath || '');
      const entity = inferEntityFromPath(filePathStr);
      
      if (entity) {
        return `${prefix}${entity}Extended${suffix}`;
      }
      
      return match;
    }
  }
];

/**
 * 🔍 Infiere la entidad desde la ruta del archivo
 */
function inferEntityFromPath(filePath) {
  if (!filePath) return null;
  
  // Asegurarnos de que filePath sea una cadena
  const filePathStr = String(filePath);
  
  try {
    // Extraer de la ruta con estructura /actions/entity/...
    const pathRegex = /[/\\]actions[/\\]([\w-]+)[/\\]/;
    const match = filePathStr.match(pathRegex);
    
    if (match) {
      const entityDir = match[1].toLowerCase();
      
      // Buscar en el mapa de entidades
      if (ENTITIES_MAP[entityDir]) {
        return ENTITIES_MAP[entityDir];
      }
      
      // Manejar casos especiales como "uploaded-images" -> "UploadedImage"
      if (entityDir.includes('-')) {
        const parts = entityDir.split('-');
        const camelCased = parts.map((part, i) => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join('');
        
        if (ENTITIES_MAP[camelCased.toLowerCase()]) {
          return ENTITIES_MAP[camelCased.toLowerCase()];
        }
        
        return camelCased;
      }
      
      // Singular y primera letra en mayúscula para el resto
      return entityDir.charAt(0).toUpperCase() + entityDir.slice(1).replace(/s$/, '');
    }
    
    // Si no podemos extraer de la ruta, intentamos del nombre del archivo
    const fileMatch = filePathStr.match(/[/\\]([\w-]+)(?:-crud|-query|-actions)?\.actions\.ts$/);
    if (fileMatch) {
      const entityName = fileMatch[1].toLowerCase();
      
      if (ENTITIES_MAP[entityName]) {
        return ENTITIES_MAP[entityName];
      }
      
      if (entityName.includes('-')) {
        const parts = entityName.split('-');
        const camelCased = parts.map((part, i) => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join('');
        
        if (ENTITIES_MAP[camelCased.toLowerCase()]) {
          return ENTITIES_MAP[camelCased.toLowerCase()];
        }
        
        return camelCased;
      }
      
      return entityName.charAt(0).toUpperCase() + entityName.slice(1).replace(/s$/, '');
    }
  } catch (error) {
    console.error(`Error inferiendo entidad desde ruta ${filePathStr}:`, error);
  }
  
  return null;
}

/**
 * 🔍 Infiere la entidad del nombre de una entidad
 */
function inferEntityFromEntityName(entityName) {
  if (!entityName) return null;
  
  try {
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
  } catch (error) {
    console.error(`Error inferiendo entidad desde nombre ${entityName}:`, error);
    return null;
  }
}

/**
 * 🔍 Procesa un archivo
 */
async function processFile(filePath) {
  console.log(`Procesando: ${filePath}`);
  filesScanned++;

  try {
    // Leer contenido
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;

    // Inferir entidad
    const entity = inferEntityFromPath(filePath);
    if (entity) {
      // Inicializar estadísticas para esta entidad si no existen
      if (!entityStats[entity]) {
        entityStats[entity] = { files: 0, modifications: 0 };
      }
      entityStats[entity].files++;
    }

    // Aplicar reemplazos
    for (const { pattern, replacement } of REPLACEMENTS) {
      try {
        newContent = newContent.replace(pattern, (...args) => {
          try {
            // Añadir la ruta del archivo como último argumento
            args.push(filePath);
            const result = typeof replacement === 'function' ? replacement(...args) : replacement;
  
            if (args[0] !== result) {
              modified = true;
              if (entity) {
                entityStats[entity].modifications = (entityStats[entity].modifications || 0) + 1;
              }
            }
  
            return result;
          } catch (replaceError) {
            console.error(`⚠️ Error en función de reemplazo para ${filePath}:`, replaceError);
            return args[0]; // Devolver el match original si hay error
          }
        });
      } catch (regexError) {
        console.error(`⚠️ Error en expresión regular para ${filePath}:`, regexError);
      }
    }

    // Guardar si hay cambios
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Archivo modificado: ${filePath}`);
      filesModified++;
      
      // Registrar en log
      const logEntry = `[${new Date().toISOString()}] Corregido: ${filePath}\n`;
      fs.appendFileSync(RESULTS_FILE, logEntry);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error);
    errors++;
    
    // Registrar error
    const errorLog = `[${new Date().toISOString()}] ERROR en ${filePath}: ${error.message}\n`;
    fs.appendFileSync(RESULTS_FILE, errorLog);
  }
}

/**
 * 🚀 Función principal
 */
async function main() {
  console.log('🔧 Iniciando corrección de server actions');
  
  // Inicializar archivo de log
  fs.writeFileSync(RESULTS_FILE, `# Log de correcciones de server actions\n\nIniciado: ${new Date().toISOString()}\n\n`);
  
  try {
    // Buscar archivos de server actions
    const files = await glob('**/*.actions.ts', { 
      cwd: ACTIONS_DIR,
      absolute: true 
    });
    
    // Procesar archivos
    for (const file of files) {
      await processFile(file);
    }
    
    // Resumen
    const summary = `
# Resumen de correcciones
- Archivos escaneados: ${filesScanned}
- Archivos modificados: ${filesModified}
- Errores: ${errors}

## Estadísticas por entidad
${Object.entries(entityStats).map(([entity, stats]) => 
  `- ${entity}: ${stats.files} archivos, ${stats.modifications} modificaciones`
).join('\n')}

Finalizado: ${new Date().toISOString()}
`;
    
    fs.appendFileSync(RESULTS_FILE, summary);
    console.log(summary);
    
    return { filesScanned, filesModified, errors, entityStats };
  } catch (error) {
    console.error('❌ Error general:', error);
    fs.appendFileSync(RESULTS_FILE, `\n## ERROR FATAL\n${error.stack}\n`);
    return { filesScanned, filesModified, errors: errors + 1, entityStats };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, processFile };
