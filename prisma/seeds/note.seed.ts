import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las notas por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedNotes(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📝 Creando notas por defecto...');

  // Verificar si la tabla Note existe
  if (await tableExists(prisma, 'Note')) {
    // Crear notas por defecto
    await prisma.note.createMany({
      data: [
        {
          title: 'Ideas para campaña de fantasía',
          content: '# Campaña de Fantasía\n\n## Trama principal\n- Reino amenazado por una antigua maldición\n- Objetos mágicos dispersos por el mundo\n- Profecía sobre el regreso de un dios oscuro\n\n## Personajes clave\n- Rey Aldric - gobernante preocupado\n- Magus Verin - mago misterioso\n- Lyra - guerrera con un pasado oculto',
          category: 'campaña',
          priority: 2,
          status: 'active',
          tags: JSON.stringify(['fantasía', 'campaña', 'rpg']),
        },
        {
          title: 'Sistema de magia elemental',
          content: '# Sistema de Magia Elemental\n\n## Elementos básicos\n- Fuego: ataque, pasión, destrucción\n- Agua: adaptabilidad, curación, emoción\n- Tierra: defensa, estabilidad, fuerza\n- Aire: velocidad, intelecto, libertad\n\n## Combinaciones\n- Fuego + Aire = Relámpago\n- Agua + Tierra = Naturaleza\n- Fuego + Tierra = Magma',
          category: 'sistemas',
          priority: 1,
          status: 'active',
          tags: JSON.stringify(['magia', 'sistema', 'elementos']),
        },
        {
          title: 'Lista de criaturas fantásticas',
          content: '# Bestiario\n\n## Criaturas comunes\n- Goblins: pequeños, verdes, astutos\n- Trolls: regeneración, vulnerables al fuego\n- Dragones: tipos según elemento, guardianes de tesoros\n\n## Criaturas raras\n- Fénix: renace de sus cenizas\n- Kraken: terror de los mares\n- Quimera: cuerpo de león, cabeza de cabra, cola de serpiente',
          category: 'bestiario',
          priority: 3,
          status: 'active',
          tags: JSON.stringify(['criaturas', 'monstruos', 'bestiario']),
        },
        {
          title: 'Ideas para sesión de la próxima semana',
          content: '# Sesión #12\n\n## Eventos principales\n- Llegada a la ciudad de Mirfell\n- Encuentro con el gremio de mercaderes\n- Revelación sobre el artefacto robado\n\n## Encuentros\n- Emboscada de bandidos en el camino\n- Mendigo que en realidad es un noble disfrazado\n\n## Tesoros\n- Mapa hacia la tumba olvidada\n- Poción de invisibilidad',
          category: 'sesión',
          priority: 4,
          status: 'pending',
          tags: JSON.stringify(['sesión', 'preparación', 'aventura']),
        },
        {
          title: 'Referencias visuales para personajes',
          content: '# Referencias Visuales\n\n## Personajes del grupo principal\n- Thorne: estilo guerrero nórdico, barba trenzada, cicatriz en ojo\n- Elara: hechicera elfa, ropa azul con detalles plateados, cabello blanco\n- Grimm: enano herrero, armadura pesada personalizada, martillo de guerra\n\n## Villanos\n- Lord Vex: noble corrupto, ropa lujosa oscura, anillo con gema roja\n- Umbra: asesina encapuchada, máscaras intercambiables, dagas envenenadas',
          category: 'referencias',
          priority: 2,
          status: 'active',
          tags: JSON.stringify(['referencias', 'personajes', 'visual']),
        },
      ],
    });
    seedLogger.info('✅ Notas creadas correctamente');
  } else {
    seedLogger.warn('⚠️ La tabla Note no existe, omitiendo...');
  }
}