import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los objetos del mundo por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedWorldItems(prisma: PrismaClient): Promise<void> {
  seedLogger.info('🎯 Creando objetos del mundo por defecto...');

  // Verificar si la tabla WorldItem existe
  if (await tableExists(prisma, 'WorldItem')) {
    // Crear objetos del mundo por defecto
    await prisma.worldItem.createMany({
      data: [
        {
          name: 'Espada de Fuego',
          emoji: '🔥',
          color: '#ef4444',
          description: 'Una legendaria espada envuelta en llamas eternas',
          shortcut: 'fire-sword',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:weapon', 'rarity:legendary']),
          type: 'weapon',
          rarity: 'legendary',
          attributes: JSON.stringify(['damage:fire', 'bonus:+3', 'weight:medium']),
          effects: JSON.stringify(['Inflinge 2d6 de daño de fuego adicional', 'Ilumina 10 metros a la redonda', 'Inmunidad al frío para el portador']),
          size: 'medium',
          requirements: 'Fuerza 15, alineamiento no maligno',
          origin: 'Forjada en el corazón de un volcán por el herrero de los dioses',
          stats: JSON.stringify({
            damage: 18,
            durability: 20,
            value: 5000,
            weight: 3
          }),
          featuredImage: null,
          isFavorite: true,
        },
        {
          name: 'Amuleto de Protección',
          emoji: '🔮',
          color: '#8b5cf6',
          description: 'Un antiguo amuleto que protege contra la magia oscura',
          shortcut: 'amulet',
          category: 'accesorios',
          sortBy: 'name',
          filters: JSON.stringify(['type:accessory', 'rarity:rare']),
          type: 'accessory',
          rarity: 'rare',
          attributes: JSON.stringify(['protection:magic', 'bonus:+2', 'weight:light']),
          effects: JSON.stringify(['Resistencia a la magia necrótica', 'Advertencia de peligro inminente', 'Purifica agua contaminada una vez al día']),
          size: 'small',
          requirements: 'Ninguno',
          origin: 'Creado por una orden antigua de magos protectores',
          stats: JSON.stringify({
            protection: 15,
            charges: 3,
            value: 1200,
            weight: 0.2
          }),
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Grimorio Arcano',
          emoji: '📕',
          color: '#3b82f6',
          description: 'Un antiguo libro de hechizos con conocimientos olvidados',
          shortcut: 'grimoire',
          category: 'libros',
          sortBy: 'name',
          filters: JSON.stringify(['type:book', 'rarity:very-rare']),
          type: 'book',
          rarity: 'very rare',
          attributes: JSON.stringify(['knowledge:arcane', 'bonus:+3', 'weight:medium']),
          effects: JSON.stringify(['Permite memorizar un hechizo adicional por nivel', 'Proporciona ventaja en pruebas de Arcano', 'Puede revelar información oculta bajo la luz correcta']),
          size: 'medium',
          requirements: 'Inteligencia 16, clase lanzadora de hechizos',
          origin: 'Escrito por un archimagó de una civilización antigua',
          stats: JSON.stringify({
            knowledge: 18,
            pages: 500,
            value: 3500,
            weight: 2
          }),
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Poción de Curación',
          emoji: '🧪',
          color: '#10b981',
          description: 'Un líquido rojizo que cura heridas instantáneamente',
          shortcut: 'potion',
          category: 'consumibles',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:potion', 'rarity:common']),
          type: 'potion',
          rarity: 'common',
          attributes: JSON.stringify(['healing:2d4+2', 'uses:1', 'weight:light']),
          effects: JSON.stringify(['Restaura 2d4+2 puntos de vida', 'Detiene hemorragias', 'Reduce fiebre']),
          size: 'small',
          requirements: 'Ninguno',
          origin: 'Receta común entre alquimistas y herbolarios',
          stats: JSON.stringify({
            potency: 8,
            duration: 'instantáneo',
            value: 50,
            weight: 0.5
          }),
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Capa de Invisibilidad',
          emoji: '👻',
          color: '#6b7280',
          description: 'Una capa mágica que vuelve invisible a quien la porta',
          shortcut: 'invis-cloak',
          category: 'ropa',
          sortBy: 'name',
          filters: JSON.stringify(['type:clothing', 'rarity:rare']),
          type: 'clothing',
          rarity: 'rare',
          attributes: JSON.stringify(['stealth:advantage', 'duration:1-hour', 'weight:light']),
          effects: JSON.stringify(['Vuelve invisible al usuario y lo que lleva', 'Duración de 1 hora al día', 'La invisibilidad se rompe al atacar']),
          size: 'medium',
          requirements: 'Ninguno',
          origin: 'Tejida con pelo de criaturas etéreas y tratada con polvos de hadas',
          stats: JSON.stringify({
            stealth: 20,
            charges: 1,
            value: 2000,
            weight: 1
          }),
          featuredImage: null,
          isFavorite: false,
        },
        // Objetos de Aldric
        {
          name: 'Espada Maldita',
          emoji: '⚔️',
          color: '#1e293b',
          description: 'Una espada larga corrompida por la maldición de la no-muerte',
          shortcut: 'cursed-sword',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:weapon', 'rarity:rare']),
          type: 'weapon',
          rarity: 'rare',
          attributes: JSON.stringify(['damage:necrotic', 'bonus:+2', 'weight:medium']),
          effects: JSON.stringify(['Inflige daño necrótico adicional', 'Drena la vida de los objetivos', 'Susurra pensamientos oscuros']),
          size: 'medium',
          requirements: 'Ser no-muerto o resistente a la necromancia',
          origin: 'Transformada por la misma maldición que afectó a Aldric',
          stats: JSON.stringify({
            damage: 16,
            durability: 18,
            corruption: 20,
            weight: 3
          }),
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Armadura Oxidada',
          emoji: '🛡️',
          color: '#475569',
          description: 'Una armadura de placas corroída por el tiempo y la maldición',
          shortcut: 'rusted-armor',
          category: 'armadura',
          sortBy: 'name',
          filters: JSON.stringify(['type:armor', 'rarity:uncommon']),
          type: 'armor',
          rarity: 'uncommon',
          attributes: JSON.stringify(['protection:high', 'curse:active', 'weight:heavy']),
          effects: JSON.stringify(['Protege contra ataques físicos', 'Rechaza la magia de curación', 'Mantiene unido al no-muerto']),
          size: 'large',
          requirements: 'Fuerza 15, ser no-muerto',
          origin: 'Antiguamente una armadura de caballero, ahora corrompida',
          stats: JSON.stringify({
            defense: 17,
            weight: 45,
            durability: 14,
            corruption: 15
          }),
          featuredImage: null,
          isFavorite: false,
        },

        // Objetos de Elyra
        {
          name: 'Báculo de las Brasas',
          emoji: '🔥',
          color: '#f97316',
          description: 'Un báculo que canaliza el poder primordial del fuego',
          shortcut: 'ember-staff',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:staff', 'rarity:rare']),
          type: 'staff',
          rarity: 'rare',
          attributes: JSON.stringify(['damage:fire', 'bonus:+2', 'weight:medium']),
          effects: JSON.stringify(['Aumenta el daño de fuego', 'Puede absorber llamas', 'Protege contra el frío']),
          size: 'large',
          requirements: 'Afinidad con la magia de fuego',
          origin: 'Creado a partir de una rama del primer árbol quemado por magia',
          stats: JSON.stringify({
            power: 18,
            control: 16,
            heat: 20,
            weight: 4
          }),
          featuredImage: null,
          isFavorite: false,
        },

        // Objetos de Kael
        {
          name: 'Espada del Abismo',
          emoji: '⚔️',
          color: '#0f172a',
          description: 'Una espada marcada por el poder del vacío',
          shortcut: 'void-sword',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:weapon', 'rarity:legendary']),
          type: 'weapon',
          rarity: 'legendary',
          attributes: JSON.stringify(['damage:void', 'bonus:+3', 'weight:heavy']),
          effects: JSON.stringify(['Inflige daño del vacío', 'Puede cortar la realidad', 'Absorbe la luz']),
          size: 'large',
          requirements: 'Fuerza 18, resistencia mental alta',
          origin: 'Forjada con metal expuesto al Abismo',
          stats: JSON.stringify({
            damage: 20,
            corruption: 18,
            control: 15,
            weight: 6
          }),
          featuredImage: null,
          isFavorite: false,
        },

        // Objetos de Serafina
        {
          name: 'Maza Sagrada',
          emoji: '🔨',
          color: '#f3f4f6',
          description: 'Una maza que aún conserva parte de su bendición original',
          shortcut: 'holy-mace',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:weapon', 'rarity:rare']),
          type: 'weapon',
          rarity: 'rare',
          attributes: JSON.stringify(['damage:holy', 'bonus:+2', 'weight:medium']),
          effects: JSON.stringify(['Daño adicional contra no-muertos', 'Puede canalizar magia de curación', 'Brilla con luz sagrada']),
          size: 'medium',
          requirements: 'Fuerza 13, fe en alguna deidad',
          origin: 'Reliquia de la orden caída de Serafina',
          stats: JSON.stringify({
            damage: 15,
            holy: 18,
            healing: 16,
            weight: 4
          }),
          featuredImage: null,
          isFavorite: false,
        },

        // Objetos de Drenvar
        {
          name: 'Dagas Gemelas',
          emoji: '🗡️',
          color: '#374151',
          description: 'Un par de dagas perfectamente equilibradas para el asesinato',
          shortcut: 'twin-daggers',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:weapon', 'rarity:rare']),
          type: 'weapon',
          rarity: 'rare',
          attributes: JSON.stringify(['damage:piercing', 'bonus:+2', 'weight:light']),
          effects: JSON.stringify(['Daño crítico aumentado', 'Silenciosas al atacar', 'Veneno paralizante']),
          size: 'small',
          requirements: 'Destreza 16',
          origin: 'Forjadas por el mejor herrero asesino del gremio',
          stats: JSON.stringify({
            damage: 12,
            speed: 18,
            stealth: 20,
            weight: 1
          }),
          featuredImage: null,
          isFavorite: false,
        },

        // Objetos de Eryndor
        {
          name: 'Báculo de la Eternidad',
          emoji: '🔮',
          color: '#9ca3af',
          description: 'Un báculo imbuido con el poder de la no-muerte',
          shortcut: 'eternal-staff',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:staff', 'rarity:legendary']),
          type: 'staff',
          rarity: 'legendary',
          attributes: JSON.stringify(['damage:necrotic', 'bonus:+3', 'weight:medium']),
          effects: JSON.stringify(['Aumenta la magia necrótica', 'Drena la vida', 'Preserva al portador']),
          size: 'large',
          requirements: 'Inteligencia 18, ser no-muerto',
          origin: 'Creado por Eryndor en su búsqueda de la inmortalidad',
          stats: JSON.stringify({
            power: 20,
            necrotic: 18,
            lifeforce: 15,
            weight: 4
          }),
          featuredImage: null,
          isFavorite: false,
        },

        // Objetos de Garruk
        {
          name: 'Báculo Natural',
          emoji: '🌿',
          color: '#166534',
          description: 'Un báculo vivo que canaliza la fuerza de la naturaleza',
          shortcut: 'nature-staff',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:staff', 'rarity:rare']),
          type: 'staff',
          rarity: 'rare',
          attributes: JSON.stringify(['damage:nature', 'bonus:+2', 'weight:medium']),
          effects: JSON.stringify(['Aumenta la magia natural', 'Puede controlar plantas', 'Sana con energía vital']),
          size: 'large',
          requirements: 'Sabiduría 15, conexión con la naturaleza',
          origin: 'Creado a partir de una rama del Árbol Primordial',
          stats: JSON.stringify({
            nature: 18,
            healing: 16,
            growth: 15,
            weight: 3
          }),
          featuredImage: null,
          isFavorite: false,
        },

        // Objetos de Isolda
        {
          name: 'Hacha de Escarcha',
          emoji: '❄️',
          color: '#d1d5db',
          description: 'Un hacha forjada con hielo eterno del Norte',
          shortcut: 'frost-axe',
          category: 'armas',
          sortBy: 'rarity',
          filters: JSON.stringify(['type:weapon', 'rarity:rare']),
          type: 'weapon',
          rarity: 'rare',
          attributes: JSON.stringify(['damage:frost', 'bonus:+2', 'weight:heavy']),
          effects: JSON.stringify(['Daño de hielo adicional', 'Ralentiza objetivos', 'Resistencia al fuego']),
          size: 'large',
          requirements: 'Fuerza 16, resistencia al frío',
          origin: 'Forjada en las Tierras del Norte Helado',
          stats: JSON.stringify({
            damage: 17,
            frost: 16,
            durability: 18,
            weight: 5
          }),
          featuredImage: null,
          isFavorite: false,
        }
      ],
    });
    seedLogger.info('✅ Objetos del mundo creados correctamente');
  } else {
    seedLogger.warn('⚠️ La tabla WorldItem no existe, omitiendo...');
  }
}