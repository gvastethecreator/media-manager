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
					title: 'Ideas para nuevo proyecto',
					content: `# Ideas para proyecto de fantasía medieval

## Conceptos clave
- Mundo post-apocalíptico pero con estética medieval
- Magia basada en tecnología antigua olvidada
- Civilizaciones construidas sobre ruinas de ciudades avanzadas

## Personajes potenciales
- Arqueóloga que descubre secretos del pasado
- Guerrero con implantes tecnológicos antiguos
- Chamán que puede comunicarse con IA dormidas

## Localizaciones
- Ciudad construida dentro del casco de un rascacielos caído
- Bosque que creció sobre un centro comercial
- Minas que son en realidad bunkers subterráneos

## Objetos importantes
- "Varitas mágicas" que son en realidad herramientas tecnológicas
- Cristales de memoria con conocimientos antiguos
- Armas que combinan tecnología y artesanía medieval`,
					category: 'proyectos',
					priority: 3,
					status: 'active',
					featuredImage: null,
					isFavorite: true,
				},
				{
					title: 'Referencias visuales para personajes',
					content: `# Referencias para diseño de personajes

## Protagonista principal
- Estética: Combinación de armadura medieval y componentes tecnológicos
- Coloración: Tonos azules y plateados
- Referencias: Ver imágenes guardadas en carpeta Concept Art/Protagonista

## Antagonista
- Estética: Cibernética oculta bajo túnicas ceremoniales
- Coloración: Rojos, negros y detalles dorados
- Referencias: Folder Concept Art/Villanos

## Personajes secundarios
- Mercader: Aspecto tosco, mezcla de componentes metálicos y telas coloridas
- Sabio: Túnicas simples pero con dispositivos tecnológicos como accesorios
- Guardiana: Armadura pesada integrada con componentes luminosos`,
					category: 'referencias',
					priority: 2,
					status: 'active',
					featuredImage: null,
					isFavorite: false,
				},
				{
					title: 'Tareas pendientes para el worldbuilding',
					content: `# Tareas de worldbuilding pendientes

## Alta prioridad
- [ ] Definir sistema económico y recursos importantes
- [ ] Desarrollar religiones/creencias del mundo
- [ ] Crear mapa general con puntos de interés principales

## Media prioridad
- [ ] Desarrollar lenguajes o jergas locales
- [ ] Definir facciones políticas principales
- [ ] Crear línea temporal de eventos históricos importantes
- [ ] Diseñar vestimentas típicas de cada región

## Baja prioridad
- [ ] Desarrollar recetas y comidas típicas
- [ ] Crear instrumentos musicales únicos del mundo
- [ ] Definir deportes o juegos populares
- [ ] Desarrollar criaturas y fauna específica`,
					category: 'tareas',
					priority: 2,
					status: 'active',
					featuredImage: null,
					isFavorite: false,
				},
				{
					title: 'Guión para escena de introducción',
					content: `# Escena de apertura

EXTERIOR - RUINAS DE CIUDAD - AMANECER

*El sol se eleva lentamente sobre los restos de antiguas estructuras metálicas, ahora cubiertas de vegetación. En la distancia, una TORRE parcialmente derrumbada brilla con la luz del amanecer.*

NARRADOR (V.O.)
Han pasado trescientos años desde la Caída. Las grandes ciudades de cristal y metal son ahora leyendas contadas alrededor de fogatas.

*KARA (28), vestida con una combinación de ropa de cuero gastada y piezas de tecnología arcana recuperada, trepa por los restos de un edificio. Lleva un bastón cuya punta emite un tenue brillo azulado.*

NARRADOR (V.O.)
Pero algunas personas buscan en las ruinas el conocimiento perdido. Los llamamos Buscadores.

*Kara activa un pequeño dispositivo en su muñeca. Hologramas antiguas y dañadas aparecen, mostrando planos de la ciudad tal como era.*

KARA
(hablando sola)
Estaba aquí... la Cámara de los Ancestros debería estar justo debajo.

*Un RUGIDO distante. Kara se tensa, apaga rápidamente el dispositivo.*

NARRADOR (V.O.)
Lo que una vez fue creado para servir, ahora caza a los descendientes de sus creadores.

*Kara se esconde mientras una silueta mecánica gigante patrulla entre los edificios caídos. Sus ojos brillan con un inquietante resplandor rojo.*

CORTE A:

TÍTULO: "ECOS DEL MAÑANA"`,
					category: 'guiones',
					priority: 1,
					status: 'completed',
					featuredImage: null,
					isFavorite: false,
				},
				{
					title: 'Lista de recursos y referencias',
					content: `# Recursos y referencias para el proyecto

## Libros de referencia
- "El Nombre del Viento" de Patrick Rothfuss (sistema de magia)
- "Dune" de Frank Herbert (sociedades y política)
- "Horizon Zero Dawn" (concepto de civilización post-tecnológica)
- "The Broken Earth" de N.K. Jemisin (worldbuilding)

## Inspiración visual
- Películas:
  - Mad Max: Fury Road (estética de supervivencia)
  - Blade Runner 2049 (iluminación y color)
  - The Fall (vestuario y localizaciones)

- Videojuegos:
  - Horizon Zero Dawn / Forbidden West
  - The Legend of Zelda: Breath of the Wild
  - Final Fantasy VII Remake

## Música y atmósfera
- Bandas sonoras de Nier: Automata
- Bear McCreary (God of War)
- Hans Zimmer (Dune)
- Synthwave mezclado con instrumentos medievales`,
					category: 'referencias',
					priority: 1,
					status: 'active',
					featuredImage: null,
					isFavorite: false,
				},
				{
					title: 'Checklist de lanzamiento',
					content: `# Checklist de lanzamiento

- [ ] Revisar arte final
- [ ] Validar metadatos
- [ ] Publicar en la galería
- [ ] Anunciar en redes sociales`,
					category: 'tareas',
					priority: 2,
					status: 'pending',
					featuredImage: null,
					isFavorite: false,
				},
			],
		});
		seedLogger.info('✅ Notas creadas correctamente');
	} else {
		seedLogger.warn('⚠️ La tabla Note no existe, omitiendo...');
	}
}
