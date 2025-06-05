// 🧹 Ejecutor simple para script de migración
// filepath: d:\DEV\image-manager\scripts\migrations\run-cleanup.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🔧 Función para normalizar strings comunes
function normalizeCommonStrings(field) {
  const trimmed = field.trim().toLowerCase();

  // Casos de "ningún valor" o "vacío"
  if (['ninguno', 'none', 'null', 'vacio', 'vacío', 'empty', 'n/a', 'na', '-'].includes(trimmed)) {
    return '[]'; // Array vacío por defecto
  }

  // Casos de valores undefined/null como string
  if (['undefined', 'null'].includes(trimmed)) {
    return '[]';
  }

  return null; // No hay normalización disponible
}

// 🔧 Función para reparar patrones de atributos
function repairAttributePattern(field) {
  const trimmed = field.trim();

  // Patrón: "Fuerza 15", "Agilidad 10", etc.
  const attributeMatch = trimmed.match(/^([a-záéíóúñ]+)\s*(\d+)$/i);
  if (attributeMatch) {
    const [, name, value] = attributeMatch;
    return `[{"name": "${name}", "value": ${value}}]`;
  }

  // Patrón: lista simple como "Fuerza, Agilidad"
  const listMatch = trimmed.match(/^([a-záéíóúñ\s,]+)$/i);
  if (listMatch && trimmed.includes(',')) {
    const items = trimmed.split(',').map(item => item.trim()).filter(Boolean);
    const jsonArray = items.map(item => `"${item}"`).join(', ');
    return `[${jsonArray}]`;
  }

  return null;
}

// 🔧 Función principal para reparar un campo JSON
function repairJsonField(field) {
  if (!field || typeof field !== 'string') {
    return '[]';
  }

  const trimmed = field.trim();

  // Si ya es JSON válido, no hacer nada
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Continuar con reparación
  }

  // Paso 1: Normalizar strings comunes
  let normalized = normalizeCommonStrings(trimmed);
  if (normalized) {
    return normalized;
  }

  // Paso 2: Reparar patrones específicos
  let repaired = repairAttributePattern(trimmed);
  if (repaired) {
    return repaired;
  }

  // Paso 3: Envolver string simple en array
  if (trimmed.length > 0) {
    return `["${trimmed.replace(/"/g, '\\"')}"]`;
  }

  return '[]';
}

// 🧹 Función principal de limpieza
async function cleanWorldItemJsonFields() {
  console.log('🚀 Iniciando limpieza de campos JSON en WorldItem...');

  const stats = {
    totalRecords: 0,
    fixedRecords: 0,
    errors: 0,
    fieldsFixed: {
      attributes: 0,
      effects: 0,
      stats: 0,
      requirements: 0,
      filters: 0
    }
  };

  try {
    // Obtener todos los WorldItems
    const worldItems = await prisma.worldItem.findMany({
      select: {
        id: true,
        attributes: true,
        effects: true,
        stats: true,
        requirements: true,
        filters: true
      }
    });

    stats.totalRecords = worldItems.length;
    console.log(`📊 Encontrados ${stats.totalRecords} registros para procesar`);

    for (const item of worldItems) {
      let needsUpdate = false;
      const updateData = {};

      // Procesar cada campo JSON
      const jsonFields = ['attributes', 'effects', 'stats', 'requirements', 'filters'];

      for (const fieldName of jsonFields) {
        const originalValue = item[fieldName];

        if (originalValue && typeof originalValue === 'string') {
          try {
            JSON.parse(originalValue);
            // Ya es JSON válido, no necesita reparación
          } catch {
            // Necesita reparación
            const repairedValue = repairJsonField(originalValue);

            if (repairedValue !== originalValue) {
              updateData[fieldName] = repairedValue;
              stats.fieldsFixed[fieldName]++;
              needsUpdate = true;

              console.log(`🔧 Reparando ${fieldName} en item ${item.id}: "${originalValue}" → "${repairedValue}"`);
            }
          }
        }
      }

      // Actualizar el registro si es necesario
      if (needsUpdate) {
        try {
          await prisma.worldItem.update({
            where: { id: item.id },
            data: updateData
          });

          stats.fixedRecords++;
          console.log(`✅ Item ${item.id} actualizado exitosamente`);
        } catch (error) {
          stats.errors++;
          console.error(`❌ Error actualizando item ${item.id}:`, error.message);
        }
      }
    }

    // Mostrar estadísticas finales
    console.log('\n📈 ESTADÍSTICAS DE LIMPIEZA:');
    console.log(`📊 Total de registros procesados: ${stats.totalRecords}`);
    console.log(`✅ Registros corregidos: ${stats.fixedRecords}`);
    console.log(`❌ Errores: ${stats.errors}`);
    console.log('📋 Campos reparados por tipo:');
    Object.entries(stats.fieldsFixed).forEach(([field, count]) => {
      if (count > 0) {
        console.log(`   - ${field}: ${count}`);
      }
    });

    console.log('\n🎉 Limpieza completada exitosamente!');

  } catch (error) {
    console.error('💥 Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
cleanWorldItemJsonFields()
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
