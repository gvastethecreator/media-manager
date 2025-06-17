import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los conceptos por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedConcepts(prisma: PrismaClient): Promise<void> {
	seedLogger.info('💡 Creando conceptos por defecto...');

	try {
		// Verificar si la tabla Concept existe
		if (await tableExists(prisma, 'Concept')) {
			// Crear conceptos por defecto
			const conceptsData = [
				{
					name: 'Sistema de Magia',
					emoji: '✨',
					color: '#8b5cf6',
					description: 'Sistema de magia basado en elementos y energía vital',
					content: `# Sistema de Magia Elemental

Los magos de este mundo manipulan cinco elementos básicos: fuego, agua, tierra, aire y éter.

## Principios Fundamentales

1. **Conexión Elemental**: Cada mago tiene afinidad con uno o más elementos.
2. **Costo de Energía**: Toda magia consume energía vital del lanzador.
3. **Tiempo de Preparación**: Hechizos más poderosos requieren más tiempo.
4. **Materiales**: Algunos hechizos requieren componentes materiales.

## Escuelas de Magia

- **Evocación**: Manipulación directa de los elementos.
- **Conjuración**: Invocación de criaturas o materiales.
- **Adivinación**: Percepción del pasado, presente o futuro.
- **Alteración**: Modificación de propiedades físicas.
- **Ilusión**: Creación de percepciones falsas.

## Limitaciones

- La magia poderosa puede agotar al lanzador incluso hasta la muerte.
- El uso excesivo de magia deja marcas físicas permanentes.
- La magia de éter es la más rara y peligrosa de controlar.`,
					category: 'worldbuilding',
					featuredImage: null,
					isFavorite: true,
				},
				{
					name: 'Estructura Política',
					emoji: '👑',
					color: '#ef4444',
					description: 'Sistema feudal con influencias mercantiles',
					content: `# Estructura Política del Reino

## Jerarquía de Poder

1. **Rey/Reina**: Monarca hereditario con poder supremo.
2. **Consejo Real**: Asesores de la corona, incluye nobles y gremios.
3. **Duques**: Gobiernan grandes regiones.
4. **Condes y Barones**: Gobiernan territorios menores.
5. **Caballeros**: Guerreros juramentados a nobles.
6. **Ciudadanos Libres**: Mercaderes, artesanos, granjeros libres.
7. **Siervos**: Trabajadores atados a la tierra.

## Factores de Poder

- **Gremios Mercantiles**: Controlan el comercio y tienen gran influencia económica.
- **Órdenes Religiosas**: Poder moral y espiritual sobre la población.
- **Academias Arcanas**: Control del conocimiento mágico.
- **Gremios de Aventureros**: Mercenarios y exploradores que resuelven problemas.

## Tensiones Actuales

- Disputas entre la nobleza tradicional y los crecientes gremios mercantiles.
- Regiones fronterizas buscando mayor autonomía.
- Sectas religiosas rivales compitiendo por influencia.`,
					category: 'worldbuilding',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Sistema de Combate',
					emoji: '⚔️',
					color: '#f59e0b',
					description: 'Mecánicas de combate para juego de rol',
					content: `# Sistema de Combate

## Principios Básicos

1. **Iniciativa**: Determina el orden de actuación basado en destreza y percepción.
2. **Acciones**: Cada personaje tiene una acción principal, una acción menor y una reacción por turno.
3. **Movimiento**: Los personajes pueden moverse hasta su velocidad en metros.

## Tipos de Ataques

- **Ataques Básicos**: Daño directo basado en el arma.
- **Maniobras**: Efectos especiales como derribar, desarmar o empujar.
- **Ataques de Oportunidad**: Ataques fuera de turno cuando un enemigo baja la guardia.
- **Ataques Mágicos**: Hechizos ofensivos con efectos variados.

## Factores Tácticos

- **Cobertura**: Proporciona bonificaciones a la defensa.
- **Terreno**: Afecta movimiento y posicionamiento.
- **Flanqueo**: Atacar desde múltiples direcciones otorga ventajas.
- **Condiciones**: Estados como cegado, aturdido o envenenado.

## Reglas Avanzadas

- **Ataques Críticos**: Daño duplicado en tiradas excepcionales.
- **Fatiga**: Combates prolongados causan penalizaciones.
- **Combate Montado**: Reglas especiales para combate a caballo.`,
					category: 'gamedesign',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Economía del Mundo',
					emoji: '💰',
					color: '#10b981',
					description: 'Sistema económico y comercial del mundo',
					content: `# Sistema Económico

## Monedas y Valor

- **Corona de oro** (CO): Moneda de alto valor usada por nobles y mercaderes.
- **Luna de plata** (LP): Moneda común para transacciones diarias (1 CO = 20 LP).
- **Estrella de cobre** (EC): Moneda de bajo valor (1 LP = 50 EC).

## Recursos Importantes

- **Cristales mágicos**: Usados para encantamientos y artefactos.
- **Minerales de las Montañas Nebulosas**: Metales raros para armaduras y armas.
- **Especias del Sur**: Altamente valoradas en todo el continente.
- **Maderas del Bosque Profundo**: Ideales para construcciones y barcos.

## Rutas Comerciales

- **Ruta Marítima del Este**: Conecta con reinos distantes, mercancías exóticas.
- **Camino del Rey**: Ruta terrestre que une las principales ciudades.
- **Sendero de las Montañas**: Peligroso pero rico en recursos mineros.

## Gremios y Monopolios

- **Gremio de Comerciantes Unidos**: Controla el comercio marítimo.
- **Hermandad de Mineros**: Monopolio sobre metales preciosos.
- **Liga de Alquimistas**: Control sobre pociones y componentes mágicos.`,
					category: 'worldbuilding',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Calendario y Cosmología',
					emoji: '🌌',
					color: '#3b82f6',
					description: 'Sistema de tiempo y estructura cósmica',
					content: `# Calendario y Cosmología

## Estructura del Tiempo

- **Año**: 360 días divididos en 12 meses de 30 días.
- **Semana**: 6 días laborables, 1 día de descanso.
- **Día**: 24 horas, dividido en 2 ciclos de 12 horas.

## Meses y Estaciones

1. **Mes del Amanecer**: Inicio de la primavera.
2. **Mes del Brote**: Mediados de primavera.
3. **Mes de la Flor**: Final de primavera.
4. **Mes del Sol**: Inicio de verano.
5. **Mes de la Llama**: Mediados de verano.
6. **Mes de la Cosecha**: Final de verano.
7. **Mes de la Hoja**: Inicio de otoño.
8. **Mes del Viento**: Mediados de otoño.
9. **Mes de la Niebla**: Final de otoño.
10. **Mes del Hielo**: Inicio de invierno.
11. **Mes de la Oscuridad**: Mediados de invierno.
12. **Mes del Silencio**: Final de invierno.

## Cosmología

- **Sol**: La fuente de toda energía vital, llamado "El Ojo del Creador".
- **Lunas**: Dos lunas, una plateada ("Centinela") y una rojiza ("Vigilante").
- **Estrellas**: Almas de los antiguos dioses que observan el mundo.

## Eventos Astronómicos

- **Eclipse Dual**: Ocurre una vez cada 100 años cuando ambas lunas se alinean.
- **Lluvia de Estrellas del Destino**: Fenómeno anual que marca el cambio de año.
- **Noche de las Tres Sombras**: Raro evento donde aparece una tercera luna negra.`,
					category: 'worldbuilding',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'La Maldición de la No-Muerte',
					emoji: '💀',
					color: '#6b7280',
					description: 'La naturaleza y efectos de la maldición que afecta a Aldric',
					content: `# La Maldición de la No-Muerte

## Origen
La maldición de la no-muerte tiene sus orígenes en un antiguo ritual prohibido. Originalmente diseñado para ofrecer inmortalidad a los dignos, el ritual fue corrompido a lo largo de los siglos. Ahora, aquellos que son afectados se encuentran atrapados entre la vida y la muerte, incapaces de morir pero sin estar verdaderamente vivos.

## Manifestaciones
- **Cuerpo preservado**: El cuerpo no se pudre pero tampoco sana normalmente
- **Inmortalidad parcial**: No pueden morir por vejez o enfermedad, pero pueden ser destruidos
- **Dolor constante**: Experimentan un dolor sordo constante que nunca cesa
- **Conexión con la muerte**: Pueden percibir espíritus y energías necróticas
- **Rechazo de la curación**: La magia de curación tradicional es ineficaz o causa dolor

## Efectos psicológicos
Los malditos generalmente experimentan:
- Melancolía profunda
- Desconexión emocional gradual
- Recuerdos que se desvanecen con el tiempo
- Obsesión con recuperar su humanidad

## Romper la maldición
Se rumorea que la maldición puede romperse de varias maneras:
- Completando la tarea incompleta que tenía el maldito en vida
- Encontrando el artefacto o ritual original que causó la maldición
- Sacrificio de algo preciado para el maldito

Aldric el Hueco lleva siglos buscando una cura, explorando ruinas antiguas y recopilando conocimientos prohibidos en su búsqueda de redención.`,
					category: 'worldbuilding',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'El Abismo y sus Manifestaciones',
					emoji: '🕳️',
					color: '#1e293b',
					description: 'Naturaleza del Abismo que marcó a Kael',
					content: `# El Abismo y sus Manifestaciones

## Naturaleza del Abismo
El Abismo no es un lugar físico en el sentido tradicional, sino una grieta en la realidad misma. Existe entre las dimensiones, en los espacios vacíos entre mundos. Aquellos que han contemplado el Abismo describen una oscuridad infinita con patrones geométricamente imposibles y colores que no deberían existir.

## Manifestaciones Físicas
- **Grietas dimensionales**: Puntos donde el Abismo se filtra al mundo físico
- **Cristales del vacío**: Formaciones cristalinas que crecen en áreas expuestas al Abismo
- **Fauna corrompida**: Criaturas transformadas por la exposición al Abismo
- **Distorsiones espaciales**: Áreas donde las leyes físicas funcionan de manera errática

## Efectos en los seres vivos
La exposición al Abismo causa:
- Mutaciones físicas menores o mayores
- Visiones y pesadillas recurrentes
- Capacidad para percibir realidades alternativas
- Resistencia a ciertos tipos de magia
- En casos extremos, locura o transformación completa

## Caminantes del Abismo
Personas como Kael que han sobrevivido a una exposición prolongada al Abismo desarrollan:
- Resistencia a sus efectos corruptores
- Capacidad de manipular energías abismales
- Visión en oscuridad total
- Percepción de entidades del vacío
- Marcas físicas distintivas (venas oscuras, ojos con peculiaridades, etc.)

Kael el Caminante del Abismo sobrevivió a una expedición al corazón de una grieta del Abismo, emergiendo transformado pero con su humanidad intacta, una rareza que lo convierte en único.`,
					category: 'worldbuilding',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Piromancia Ancestral',
					emoji: '🔥',
					color: '#f97316',
					description: 'El arte prohibido del fuego primordial que practica Elyra',
					content: `# Piromancia Ancestral

## Orígenes
La piromancia ancestral es una antigua forma de magia que se remonta a la época en que los primeros humanos descubrieron el fuego. A diferencia de la magia ígnea común, la piromancia ancestral toca el poder primordial del fuego mismo, una fuerza elemental consciente y hambrienta.

## Características principales
- **Fuego viviente**: Las llamas parecen tener voluntad propia y responden a las emociones
- **Combustión espontánea**: Capacidad de crear fuego sin materiales inflamables
- **Inmunidad parcial**: Resistencia aumentada al calor y las quemaduras
- **Conexión emocional**: El poder aumenta con emociones intensas, especialmente ira y pasión
- **Fuego eterno**: Capacidad de crear llamas que no se extinguen con métodos convencionales

## Peligros
El mayor riesgo de la piromancia ancestral es:
- **Consumo interno**: El fuego puede consumir al lanzador desde adentro
- **Pérdida de control**: Las emociones fuertes pueden desatar incendios incontrolables
- **Marca del fuego**: Cambios físicos progresivos (ojos ámbar, temperatura corporal elevada)
- **Adicción**: Dependencia psicológica al poder y la sensación de control

## Prohibición
La piromancia ancestral fue prohibida en la mayoría de los reinos debido a:
- Múltiples incidentes de incendios catastróficos
- El destino inevitable de los practicantes, consumidos por su propio poder
- La naturaleza impredecible y potencialmente consciente del fuego primordial

Elyra la Cenicienta fue exiliada de su tierra natal tras un incidente donde su poder se descontroló, y ahora busca la manera de dominar completamente este peligroso arte antes de que la consuma.`,
					category: 'magia',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Círculo Druídico del Equilibrio',
					emoji: '🌿',
					color: '#166534',
					description: 'La antigua orden a la que pertenece Garruk',
					content: `# Círculo Druídico del Equilibrio

## Historia y propósito
El Círculo del Equilibrio es una de las organizaciones druídicas más antiguas, formada cuando los primeros pueblos comenzaron a talar bosques para construir ciudades. Su misión es mantener el equilibrio entre civilización y naturaleza, asegurando que ninguna sobrepase a la otra.

## Principios fundamentales
1. **Equilibrio sobre preservación**: A diferencia de otros druidas, aceptan el cambio y la evolución
2. **Intervención selectiva**: Actúan solo cuando el desequilibrio es severo
3. **Neutralidad política**: No se alinean con naciones o facciones
4. **Conocimiento ancestral**: Preservan tradiciones y secretos antiguos
5. **Comunión con espíritus**: Mantienen contacto con entidades naturales y ancestros

## Jerarquía y organización
- **Archidruidas**: Líderes ancianos, uno por cada bioma principal
- **Guardianes**: Druidas experimentados asignados a regiones específicas
- **Caminantes**: Miembros que viajan constantemente, como Garruk
- **Aprendices**: Estudiantes en formación
- **Amigos del Círculo**: Aliados no druidas que apoyan su causa

## Rituales y poderes
Los miembros del Círculo son conocidos por:
- Transformación en animales y plantas
- Comunicación con espíritus naturales
- Manipulación del clima a pequeña escala
- Rituales estacionales para mantener ciclos naturales
- Control de plantas y animales en situaciones extremas

Garruk el Salvaje es un respetado Caminante del Círculo, encargado de vigilar regiones alejadas y responder a desequilibrios donde otros miembros no pueden llegar fácilmente.`,
					category: 'organizaciones',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Orden de la Luz Eterna',
					emoji: '⚔️',
					color: '#e5e7eb',
					description: 'La orden de paladines a la que pertenece Liora',
					content: `# Orden de la Luz Eterna

## Fundación e historia
La Orden de la Luz Eterna fue fundada hace ocho siglos por la legendaria paladín Solara tras recibir una visión divina. Tradicionalmente, la orden ha protegido a los inocentes y combatido la oscuridad en todas sus formas, desde demonios hasta tiranos corruptos.

## Principios y votos
Los miembros de la Orden juran:
1. **Proteger a los indefensos**: La defensa de los débiles está por encima de todo
2. **Perseguir la justicia**: Buscar que los malvados respondan por sus crímenes
3. **Mantener la luz**: Combatir la oscuridad en todas sus manifestaciones
4. **Buscar la verdad**: No dejarse engañar por apariencias o mentiras
5. **Mantener el honor**: Actuar siempre con integridad y honestidad

## Declive actual
En las últimas décadas, la Orden ha sufrido:
- Disminución en el número de miembros
- Pérdida de fortalezas e influencia política
- Cuestionamiento de su relevancia en tiempos de paz
- Infiltración por elementos corruptos
- Conflictos internos sobre la interpretación de sus principios

## Símbolos y equipamiento
Los paladines de la Orden son reconocibles por:
- Armaduras plateadas con detalles dorados
- Símbolo del sol naciente
- Capas blancas o azul claro
- Armas bendecidas que brillan ante la presencia del mal
- Amuletos que les permiten detectar la oscuridad

Liora la Portadora de Luz es posiblemente la última paladín verdadera de la Orden, y ha tomado sobre sí la misión de restaurarla a su antigua gloria y propósito original.`,
					category: 'organizaciones',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Pactos de los Brujos',
					emoji: '📜',
					color: '#6b7280',
					description: 'La naturaleza de los pactos como el que hizo Vorrik',
					content: `# Pactos de los Brujos

## Naturaleza de los pactos
A diferencia de los magos que estudian o los hechiceros con poder innato, los brujos obtienen su magia a través de pactos con entidades poderosas. Estos acuerdos son vinculantes tanto para el brujo como para el patrón, aunque rara vez son equitativos en naturaleza.

## Tipos comunes de patrones
- **Seres abismales**: Entidades del vacío entre dimensiones
- **Archifeéricos**: Señores poderosos del mundo feérico
- **Antiguos**: Entidades primordiales de conocimiento prohibido
- **Infernales**: Demonios y seres de los planos inferiores
- **No-muertos**: Liches y otros seres que han trascendido la muerte
- **Ancestrales**: Espíritus antiguos de gran poder

## Términos del pacto
Los pactos típicamente incluyen:
- Otorgamiento de poder arcano al brujo
- Obligaciones específicas hacia el patrón
- Restricciones en el comportamiento o acciones
- Transformaciones graduales en el brujo
- Consecuencias por incumplimiento

## Manifestaciones y efectos
Los brujos suelen experimentar:
- Susurros y visiones de su patrón
- Cambios físicos sutiles o evidentes
- Compulsiones extrañas relacionadas con los deseos del patrón
- Conocimiento de secretos que no deberían saber
- Habilidades mágicas únicas relacionadas con la naturaleza del patrón

El caso de Vorrik el Demente es particularmente misterioso, ya que nadie conoce la identidad de su patrón, y los pocos que han intentado descubrirlo han enloquecido en el proceso.`,
					category: 'magia',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Arte de la Necromancia Superior',
					emoji: '🧙‍♂️',
					color: '#9ca3af',
					description: 'Las artes oscuras practicadas por Eryndor',
					content: `# Arte de la Necromancia Superior

## Diferencia con la necromancia común
Mientras que la necromancia común se enfoca en la manipulación de cadáveres y la creación de no-muertos, la necromancia superior es un arte más refinado y complejo que estudia la naturaleza misma de la vida y la muerte, buscando trascender sus limitaciones.

## Ramas principales
- **Inmortalidad física**: Técnicas para preservar el cuerpo indefinidamente
- **Transferencia de esencia**: Métodos para mover el alma entre recipientes
- **Manipulación vital**: Control preciso sobre las fuerzas vitales
- **Comunión con el más allá**: Contacto con planos de existencia post-mortem
- **Transmutación necrófaga**: Transformación física a través de energías necróticas

## Requisitos y sacrificios
Para practicar la necromancia superior se requiere:
- Inteligencia y voluntad excepcionales
- Años de estudio intensivo
- Exposición regular a energías necróticas
- Sacrificio gradual de la propia humanidad
- Superación del miedo natural a la muerte

## La búsqueda de la inmortalidad
Eryndor el Eterno ha dedicado siglos a perfeccionar este arte con el objetivo de alcanzar la inmortalidad verdadera. Su transformación en lich fue solo un paso intermedio, ya que considera esta forma imperfecta por sus limitaciones y dependencias.

A diferencia de otros necrománticos, Eryndor busca una forma de inmortalidad que preserve no solo la conciencia sino también las sensaciones y emociones humanas, un estado que algunos estudiosos consideran inherentemente contradictorio e inalcanzable.`,
					category: 'magia',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Clanes Guerreros del Norte',
					emoji: '❄️',
					color: '#d1d5db',
					description: 'Cultura y tradiciones de los clanes a los que pertenece Isolda',
					content: `# Clanes Guerreros del Norte

## Estructura social
Las Tierras del Norte Helado están organizadas en clanes familiares extensos, cada uno con:
- Un jefe o jefa elegido por proezas más que por linaje
- Un consejo de ancianos que preserva la tradición
- Guerreros que defienden y cazan
- Artesanos especializados en trabajo con hielo y hierro
- Chamanes que interpretan las señales del hielo eterno

## Creencias y tradiciones
Los norteños creen firmemente en:
- El hielo como entidad consciente que prueba a los débiles
- La reencarnación de los guerreros caídos en tormentas de nieve
- Tres vidas para cada persona: niñez, adultez y ancianidad
- Pruebas de valor como rito de paso a la adultez
- La forja del alma a través de la resistencia al frío

## Arte de guerra
Los guerreros del norte son conocidos por:
- Ataques rápidos y brutales seguidos de retiradas estratégicas
- Combate con hachas de doble filo y escudos redondos
- Entrar en estado de "furia helada" durante el combate
- Capacidad de luchar efectivamente en terreno helado y nieve profunda
- Tácticas de supervivencia en condiciones extremas

## Relaciones externas
Tradicionalmente, los clanes han sido:
- Desconfiados de forasteros pero hospitalarios con visitantes respetuosos
- Comerciantes ocasionales de metales raros y pieles
- Defensores feroces de sus fronteras
- Unificados solo ante amenazas externas significativas
- Aislacionistas por elección más que por necesidad

Isolda la Nacida del Hielo es una de las guerreras más respetadas entre los clanes, habiendo completado la legendaria "Vigilia del Hielo Eterno", una prueba que consiste en meditar tres días y tres noches en la cima de la montaña más alta durante la peor tormenta del año.`,
					category: 'culturas',
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Religión Antigua',
					emoji: '⛩️',
					color: '#fbbf24',
					description: 'Creencias y rituales de la civilización perdida',
					content: 'Descripción de la religión y sus dioses.',
					category: 'historia',
					featuredImage: null,
					isFavorite: false,
				},
			];

			for (const concept of conceptsData) {
				const existingConcept = await prisma.concept.findFirst({
					where: { name: concept.name },
				});

				if (!existingConcept) {
					await prisma.concept.create({
						data: concept,
					});
				}
			}

			seedLogger.info('✅ Conceptos creados correctamente');
		} else {
			seedLogger.warn('⚠️ La tabla Concept no existe, omitiendo...');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando conceptos:', error);
		throw error;
	}
}
