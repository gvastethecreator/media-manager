import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

export async function seedCharacters(prisma: PrismaClient): Promise<void> {
	seedLogger.info('👤 Creando personajes por defecto...');

	try {
		if (await tableExists(prisma, 'Character')) {
			const characters = [
				{
					name: 'Aldric el Hueco',
					description: 'Un caballero maldito que deambula por ruinas olvidadas en busca de redención.',
					emoji: '💀',
					color: '#6b7280',
					category: 'undead',
					level: 35,
					class: 'Knight',
					race: 'Undead',
					alignment: 'Chaotic Neutral',
					backstory:
						'Antiguamente un noble guerrero, Aldric contrajo la maldición de la no-muerte y ahora recorre el mundo intentando romperla.',
					stats: JSON.stringify({
						strength: 18,
						dexterity: 12,
						intelligence: 10,
						constitution: 16,
						wisdom: 13,
						charisma: 8,
					}),
					abilities: JSON.stringify(['Cursed Longsword', 'Rusted Armor']),
					psychologicalProfile: 'Atormentado por su maldición, mantiene un código de honor inquebrantable.',
					socialProfile: 'Solitario por naturaleza, evita el contacto con los vivos.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Romper la maldición', 'Recuperar su humanidad']),
					fears: JSON.stringify(['Perder completamente su humanidad']),
					beliefs: JSON.stringify(['El honor perdura más allá de la muerte']),
					personality: JSON.stringify(['Estoico', 'Melancólico', 'Honorable']),
					skills: JSON.stringify(['Esgrima', 'Tácticas militares']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Elyra la Cenicienta',
					description: 'Una piromante que domina las llamas de una era extinta.',
					emoji: '🔥',
					color: '#f97316',
					category: 'human',
					level: 28,
					class: 'Pyromancer',
					race: 'Human',
					alignment: 'Neutral Good',
					backstory:
						'Exiliada de su tierra natal por practicar magia de fuego prohibida, vaga para perfeccionar su arte y controlar el poder que la consume.',
					stats: JSON.stringify({
						strength: 8,
						dexterity: 14,
						intelligence: 19,
						constitution: 10,
						wisdom: 15,
						charisma: 16,
					}),
					abilities: JSON.stringify(['Ember Staff', 'Fire Robes']),
					psychologicalProfile: 'Apasionada y determinada, lucha contra el miedo de perder el control.',
					socialProfile: 'Amigable pero reservada, teme que otros descubran su secreto.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Perfeccionar su arte', 'Controlar el poder del fuego']),
					fears: JSON.stringify(['Perder el control de sus poderes']),
					beliefs: JSON.stringify(['El conocimiento es poder']),
					personality: JSON.stringify(['Apasionada', 'Determinada', 'Reservada']),
					skills: JSON.stringify(['Magia de fuego', 'Alquimia']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Kael el Caminante del Abismo',
					description: 'Un guerrero que miró el abismo y regresó transformado.',
					emoji: '⚔️',
					color: '#1f2937',
					category: 'human',
					level: 40,
					class: 'Warrior',
					race: 'Human',
					alignment: 'Lawful Neutral',
					backstory:
						'Buscando salvar a su reino del caos, se aventuró en el Abismo, pero salió marcado por fuerzas oscuras.',
					stats: JSON.stringify({
						strength: 20,
						dexterity: 15,
						intelligence: 13,
						constitution: 18,
						wisdom: 14,
						charisma: 12,
					}),
					abilities: JSON.stringify(['Abyssal Greatsword', 'Void Plate Armor']),
					psychologicalProfile: 'Determinado y valiente, pero atormentado por las fuerzas oscuras que lo marcaron.',
					socialProfile: 'Líder natural, pero a menudo distante debido a su carga.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Salvar su reino', 'Controlar las fuerzas oscuras']),
					fears: JSON.stringify(['Ser consumido por el Abismo']),
					beliefs: JSON.stringify(['El deber está por encima de todo']),
					personality: JSON.stringify(['Valiente', 'Determinado', 'Atormentado']),
					skills: JSON.stringify(['Combate cuerpo a cuerpo', 'Estrategia militar']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Morrigan la Velada',
					description: 'Una hechicera que oculta su rostro y su pasado.',
					emoji: '🔮',
					color: '#4b5563',
					category: 'elf',
					level: 30,
					class: 'Sorcerer',
					race: 'Elf',
					alignment: 'True Neutral',
					backstory: 'Morrigan busca conocimiento antiguo para descubrir la verdad sobre sus orígenes.',
					stats: JSON.stringify({
						strength: 7,
						dexterity: 14,
						intelligence: 18,
						constitution: 10,
						wisdom: 16,
						charisma: 15,
					}),
					abilities: JSON.stringify(['Báculo Encantado', 'Velo de Sombras']),
					psychologicalProfile: 'Misteriosa y reservada, obsesionada con descubrir la verdad sobre su pasado.',
					socialProfile: 'Evitada por muchos debido a su naturaleza enigmática.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Descubrir la verdad sobre su origen']),
					fears: JSON.stringify(['Nunca encontrar respuestas']),
					beliefs: JSON.stringify(['El conocimiento es la clave']),
					personality: JSON.stringify(['Misteriosa', 'Reservada', 'Obsesionada']),
					skills: JSON.stringify(['Magia arcana', 'Investigación']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Tharok el Devastador',
					description: 'Un bárbaro que se deleita en el caos y la destrucción.',
					emoji: '🪓',
					color: '#9ca3af',
					category: 'orc',
					level: 25,
					class: 'Barbarian',
					race: 'Orc',
					alignment: 'Chaotic Evil',
					backstory: 'Tharok fue expulsado de su tribu por su ira incontrolable.',
					stats: JSON.stringify({
						strength: 19,
						dexterity: 13,
						intelligence: 8,
						constitution: 17,
						wisdom: 9,
						charisma: 10,
					}),
					abilities: JSON.stringify(['Hacha de Guerra', 'Armadura con Púas']),
					psychologicalProfile: 'Impulsivo y violento, disfruta del caos y la destrucción.',
					socialProfile: 'Temido y evitado por su naturaleza destructiva.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Sembrar el caos', 'Destruir a sus enemigos']),
					fears: JSON.stringify(['Perder su fuerza']),
					beliefs: JSON.stringify(['La fuerza lo es todo']),
					personality: JSON.stringify(['Violento', 'Impulsivo', 'Destructivo']),
					skills: JSON.stringify(['Combate cuerpo a cuerpo', 'Intimidación']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Serafina la Caída',
					description: 'Una clériga que ha perdido su fe pero no su propósito.',
					emoji: '🛡️',
					color: '#f3f4f6',
					category: 'human',
					level: 32,
					class: 'Cleric',
					race: 'Human',
					alignment: 'Neutral Good',
					backstory: 'Serafina ahora vaga por las tierras, ayudando a los necesitados para expiar sus pecados pasados.',
					stats: JSON.stringify({
						strength: 10,
						dexterity: 12,
						intelligence: 14,
						constitution: 13,
						wisdom: 18,
						charisma: 16,
					}),
					abilities: JSON.stringify(['Maza Sagrada', 'Armadura Bendecida']),
					psychologicalProfile: 'Compasiva y determinada, busca redimirse ayudando a otros.',
					socialProfile: 'Amable y generosa, siempre dispuesta a ayudar.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Redimirse', 'Ayudar a los necesitados']),
					fears: JSON.stringify(['No poder redimirse']),
					beliefs: JSON.stringify(['La redención es posible']),
					personality: JSON.stringify(['Compasiva', 'Determinada', 'Generosa']),
					skills: JSON.stringify(['Sanación', 'Oratoria']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Drenvar el Silencioso',
					description: 'Un asesino que solo habla a través de sus hojas.',
					emoji: '🗡️',
					color: '#374151',
					category: 'human',
					level: 29,
					class: 'Assassin',
					race: 'Human',
					alignment: 'Chaotic Neutral',
					backstory: 'Drenvar es una figura sombría cuyos motivos son tan misteriosos como su pasado.',
					stats: JSON.stringify({
						strength: 14,
						dexterity: 20,
						intelligence: 12,
						constitution: 11,
						wisdom: 10,
						charisma: 13,
					}),
					abilities: JSON.stringify(['Dagas Gemelas', 'Capa de Sombras']),
					psychologicalProfile: 'Silencioso y letal, sus acciones hablan por él.',
					socialProfile: 'Evitado por muchos debido a su naturaleza peligrosa.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Completar sus contratos']),
					fears: JSON.stringify(['Ser descubierto']),
					beliefs: JSON.stringify(['La acción vale más que las palabras']),
					personality: JSON.stringify(['Silencioso', 'Letal', 'Misterioso']),
					skills: JSON.stringify(['Sigilo', 'Asesinato']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Liora la Portadora de Luz',
					description: 'Una paladín que porta la última esperanza de una orden moribunda.',
					emoji: '⚔️',
					color: '#e5e7eb',
					category: 'human',
					level: 38,
					class: 'Paladin',
					race: 'Human',
					alignment: 'Lawful Good',
					backstory: 'Liora busca restaurar su orden a su antigua gloria.',
					stats: JSON.stringify({
						strength: 18,
						dexterity: 10,
						intelligence: 12,
						constitution: 16,
						wisdom: 14,
						charisma: 17,
					}),
					abilities: JSON.stringify(['Espada Sagrada', 'Armadura Radiante']),
					psychologicalProfile: 'Valiente y justa, lucha por restaurar su orden.',
					socialProfile: 'Respetada y admirada por su dedicación y valentía.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Restaurar su orden']),
					fears: JSON.stringify(['Fracasar en su misión']),
					beliefs: JSON.stringify(['La justicia prevalecerá']),
					personality: JSON.stringify(['Valiente', 'Justa', 'Dedicada']),
					skills: JSON.stringify(['Combate cuerpo a cuerpo', 'Liderazgo']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Vorrik el Demente',
					description: 'Un brujo que ha hecho un pacto con una entidad desconocida.',
					emoji: '📜',
					color: '#6b7280',
					category: 'tiefling',
					level: 33,
					class: 'Warlock',
					race: 'Tiefling',
					alignment: 'Chaotic Neutral',
					backstory: 'La mente de Vorrik está fracturada por los susurros de su patrón.',
					stats: JSON.stringify({
						strength: 9,
						dexterity: 13,
						intelligence: 18,
						constitution: 12,
						wisdom: 15,
						charisma: 14,
					}),
					abilities: JSON.stringify(['Tomo Eldrich', 'Túnicas Oscuras']),
					psychologicalProfile: 'Inestable y perturbado, su mente está fracturada por los susurros de su patrón.',
					socialProfile: 'Evitado por muchos debido a su comportamiento errático.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Desentrañar los secretos de su pacto']),
					fears: JSON.stringify(['Perder completamente la cordura']),
					beliefs: JSON.stringify(['El poder tiene un precio']),
					personality: JSON.stringify(['Inestable', 'Perturbado', 'Errático']),
					skills: JSON.stringify(['Magia oscura', 'Invocación']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Eryndor el Eterno',
					description: 'Un mago antiguo que ha engañado a la muerte durante siglos.',
					emoji: '🧙‍♂️',
					color: '#9ca3af',
					category: 'lich',
					level: 45,
					class: 'Mage',
					race: 'Lich',
					alignment: 'Neutral Evil',
					backstory: 'Eryndor busca descubrir los secretos de la inmortalidad.',
					stats: JSON.stringify({
						strength: 7,
						dexterity: 10,
						intelligence: 20,
						constitution: 12,
						wisdom: 18,
						charisma: 11,
					}),
					abilities: JSON.stringify(['Báculo de la Eternidad', 'Túnicas del No Muerto']),
					psychologicalProfile: 'Ambicioso y despiadado, busca desentrañar los secretos de la inmortalidad.',
					socialProfile: 'Temido y respetado por su vasto conocimiento y poder.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Descubrir los secretos de la inmortalidad']),
					fears: JSON.stringify(['Ser destruido']),
					beliefs: JSON.stringify(['El conocimiento es poder']),
					personality: JSON.stringify(['Ambicioso', 'Despiadado', 'Erudito']),
					skills: JSON.stringify(['Magia arcana', 'Alquimia']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Garruk el Salvaje',
					description: 'Un druida que protege el equilibrio de la naturaleza a toda costa.',
					emoji: '🌿',
					color: '#4b5563',
					category: 'half-orc',
					level: 31,
					class: 'Druid',
					race: 'Half-Orc',
					alignment: 'True Neutral',
					backstory:
						'Garruk vaga por las tierras salvajes, asegurándose de que ninguna fuerza perturbe el orden natural.',
					stats: JSON.stringify({
						strength: 16,
						dexterity: 12,
						intelligence: 14,
						constitution: 15,
						wisdom: 17,
						charisma: 10,
					}),
					abilities: JSON.stringify(['Báculo Natural', 'Armadura de Piel']),
					psychologicalProfile: 'Protector y sabio, dedicado a mantener el equilibrio de la naturaleza.',
					socialProfile: 'Respetado por su conocimiento y conexión con la naturaleza.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Proteger el equilibrio de la naturaleza']),
					fears: JSON.stringify(['La destrucción de la naturaleza']),
					beliefs: JSON.stringify(['La naturaleza debe ser protegida']),
					personality: JSON.stringify(['Protector', 'Sabio', 'Dedicado']),
					skills: JSON.stringify(['Magia natural', 'Herboristería']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
				{
					name: 'Isolda la Nacida del Hielo',
					description: 'Una guerrera del norte helado, endurecida por el hielo y la batalla.',
					emoji: '❄️',
					color: '#d1d5db',
					category: 'human',
					level: 36,
					class: 'Berserker',
					race: 'Human',
					alignment: 'Chaotic Good',
					backstory: 'Isolda lucha para proteger su tierra natal de los invasores.',
					stats: JSON.stringify({
						strength: 19,
						dexterity: 13,
						intelligence: 10,
						constitution: 17,
						wisdom: 12,
						charisma: 11,
					}),
					abilities: JSON.stringify(['Hacha de Escarcha', 'Armadura de Piel']),
					psychologicalProfile: 'Feroz y leal, lucha con determinación para proteger su hogar.',
					socialProfile: 'Respetada y admirada por su valentía y fuerza.',
					relationships: JSON.stringify([]),
					goals: JSON.stringify(['Proteger su hogar']),
					fears: JSON.stringify(['Perder su hogar']),
					beliefs: JSON.stringify(['La fuerza y la valentía son esenciales']),
					personality: JSON.stringify(['Feroz', 'Leal', 'Valiente']),
					skills: JSON.stringify(['Combate cuerpo a cuerpo', 'Supervivencia']),
					sortBy: 'name',
					filters: JSON.stringify([]), // ✨ Corregido: Usar JSON válido para array vacío
				},
			];

			// Crear los personajes y guardar sus IDs
			const characterIds: { [key: string]: string } = {};

			for (const character of characters) {
				const existingCharacter = await prisma.character.findFirst({
					where: { name: character.name },
				});

				if (!existingCharacter) {
					const created = await prisma.character.create({ data: character });
					characterIds[character.name] = created.id;
				} else {
					characterIds[character.name] = existingCharacter.id;
				}
			}

			// Establecer relaciones entre personajes
			const relationships = [
				// Antagonistas
				{
					character1: 'Serafina la Caída',
					character2: 'Eryndor el Eterno',
					type: 'enemigos',
				},
				{
					character1: 'Garruk el Salvaje',
					character2: 'Tharok el Devastador',
					type: 'enemigos',
				},
				{
					character1: 'Liora la Portadora de Luz',
					character2: 'Vorrik el Demente',
					type: 'enemigos',
				},
				// Aliados
				{
					character1: 'Aldric el Hueco',
					character2: 'Serafina la Caída',
					type: 'aliados',
				},
				{
					character1: 'Elyra la Cenicienta',
					character2: 'Morrigan la Velada',
					type: 'aliados',
				},
				{
					character1: 'Kael el Caminante del Abismo',
					character2: 'Drenvar el Silencioso',
					type: 'aliados',
				},
			];

			// Establecer las relaciones
			for (const rel of relationships) {
				await prisma.character.update({
					where: { id: characterIds[rel.character1] },
					data: {
						relatedCharacters: {
							connect: [{ id: characterIds[rel.character2] }],
						},
						relationships: JSON.stringify([
							...JSON.parse(characters.find((c) => c.name === rel.character1)?.relationships || '[]'),
							{ type: rel.type, with: rel.character2 },
						]),
					},
				});
			}

			// Conectar personajes con sus lugares
			const placeConnections = [
				{
					character: 'Aldric el Hueco',
					place: 'Ruinas Malditas',
				},
				{
					character: 'Kael el Caminante del Abismo',
					place: 'El Abismo',
				},
				{
					character: 'Isolda la Nacida del Hielo',
					place: 'Tierras del Norte Helado',
				},
				{
					character: 'Garruk el Salvaje',
					place: 'Bosque Primordial',
				},
				{
					character: 'Eryndor el Eterno',
					place: 'Biblioteca Prohibida',
				},
				{
					character: 'Serafina la Caída',
					place: 'Templo Caído',
				},
			];

			// Establecer conexiones con lugares
			for (const conn of placeConnections) {
				const place = await prisma.place.findFirst({
					where: { name: conn.place },
				});

				if (place) {
					await prisma.character.update({
						where: { id: characterIds[conn.character] },
						data: {
							places: {
								connect: [{ id: place.id }],
							},
						},
					});
				}
			}

			// Conectar personajes con sus objetos
			const itemConnections = [
				{
					character: 'Aldric el Hueco',
					items: ['Espada Maldita', 'Armadura Oxidada'],
				},
				{
					character: 'Elyra la Cenicienta',
					items: ['Báculo de las Brasas'],
				},
				{
					character: 'Kael el Caminante del Abismo',
					items: ['Espada del Abismo'],
				},
				{
					character: 'Serafina la Caída',
					items: ['Maza Sagrada'],
				},
				{
					character: 'Drenvar el Silencioso',
					items: ['Dagas Gemelas'],
				},
				{
					character: 'Eryndor el Eterno',
					items: ['Báculo de la Eternidad'],
				},
				{
					character: 'Garruk el Salvaje',
					items: ['Báculo Natural'],
				},
				{
					character: 'Isolda la Nacida del Hielo',
					items: ['Hacha de Escarcha'],
				},
			];

			// Establecer conexiones con objetos
			for (const conn of itemConnections) {
				const items = await Promise.all(
					conn.items.map((itemName) =>
						prisma.worldItem.findFirst({
							where: { name: itemName },
						})
					)
				);

				const validItems = items
					.filter((item): item is NonNullable<typeof item> => item !== null)
					.map((item) => ({ id: item.id }));

				if (validItems.length > 0) {
					await prisma.character.update({
						where: { id: characterIds[conn.character] },
						data: {
							worldItems: {
								connect: validItems,
							},
						},
					});
				}
			}

			seedLogger.info('✅ Personajes creados correctamente');
		} else {
			seedLogger.warn('⚠️ La tabla Character no existe, omitiendo...');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando personajes:', error);
		throw error;
	}
}
