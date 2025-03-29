import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los prompts por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedPrompts(prisma: PrismaClient): Promise<void> {
  seedLogger.info('🔮 Creando prompts por defecto...');

  try {
    if (await tableExists(prisma, 'Prompt')) {
      // Asegurar que las categorías base existan
      const categories = [
        { name: 'characters', emoji: '👥', color: '#3b82f6' },
        { name: 'landscapes', emoji: '🏔️', color: '#10b981' },
        { name: 'magic', emoji: '✨', color: '#8b5cf6' },
        { name: 'locations', emoji: '🗺️', color: '#6b7280' },
        { name: 'creatures', emoji: '🐉', color: '#ef4444' },
        { name: 'items', emoji: '⚔️', color: '#f59e0b' }
      ];

      for (const category of categories) {
        await prisma.tag.upsert({
          where: { name: category.name },
          update: {},
          create: {
            name: category.name,
            emoji: category.emoji,
            color: category.color,
            category: 'prompt'
          }
        });
      }

      const promptsData = [
        {
          name: 'Heroic Portrait',
          emoji: '👑',
          color: '#3b82f6',
          description: 'Generate portraits of heroes and main characters',
          content: 'A detailed portrait of a hero, heroic pose, gazing at the horizon, dramatic lighting, realistic rendered style, high quality, intricate armor details, determined expression, vibrant colors, epic atmosphere, centered composition, perfect proportions, facial close-up. Style: Photorealistic digital art with cinematic quality lighting.',
          category: 'characters',
          parameters: JSON.stringify({
            width: 1024,
            height: 1024,
            steps: 30,
            guidance: 7.5,
            sampler: 'DPM++ 2M Karras'
          }),
          negativePrompt: 'deformed, anime style, cartoon, blurry, extra fingers, misaligned eyes, bad anatomy, distorted face, mutation, mutated, extra limbs, ugly, poorly drawn hands, missing limbs, floating limbs, disconnected limbs, malformed hands, blurry, out of focus',
          versions: JSON.stringify([
            {
              name: 'Female Variant',
              content: 'A detailed portrait of a heroine, heroic pose...'
            },
            {
              name: 'Battle Ready',
              content: 'A detailed portrait of a hero in battle stance...'
            }
          ]),
          tags: ['characters', 'portrait', 'fantasy', 'hero'],
          featuredImage: null,
          isFavorite: true,
        },
        {
          name: 'Fantasy Landscape',
          emoji: '🏔️',
          color: '#10b981',
          description: 'Generate epic fantasy landscapes',
          content: 'Epic fantasy landscape, majestic mountains, ethereal waterfalls, ancient forest, distant castle, dramatic clouds, sun rays, cinematic quality, volumetric lighting, intricate details, immersive scene, deep depth of field, vibrant colors, hyperrealistic style. Style: High-end digital art with atmospheric lighting and epic scale.',
          category: 'landscapes',
          parameters: JSON.stringify({
            width: 1280,
            height: 768,
            steps: 40,
            guidance: 8.0,
            sampler: 'Euler a'
          }),
          negativePrompt: 'people, animals, text, watermark, low resolution, blurry, distortion, defocus, oversaturation, noise, grain, artifacts, signature, cropped, frame, border',
          versions: JSON.stringify([
            {
              name: 'Winter',
              content: 'Snow-covered fantasy landscape, frozen waterfalls...'
            },
            {
              name: 'Dark Fantasy',
              content: 'Ominous fantasy landscape, dark mountains...'
            }
          ]),
          tags: ['landscapes', 'fantasy', 'nature', 'mountains'],
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Cursed Knight',
          emoji: '💀',
          color: '#6b7280',
          description: 'Generate images in the style of Aldric the Hollow',
          content: 'Undead knight in ancient rusted armor, spectral glowing eyes, tattered cape flowing in the wind, noble and dignified pose despite undeath, cursed sword with dark runes, somber atmosphere, ancient ruins background, spectral mist, dim greenish lighting, dark realistic style, intricate details on weathered armor. Style: Dark fantasy digital art with atmospheric lighting.',
          category: 'characters',
          parameters: JSON.stringify({
            width: 1024,
            height: 1024,
            steps: 35,
            guidance: 7.8,
            sampler: 'DPM++ 2M Karras'
          }),
          negativePrompt: 'cartoon, simple skeleton, zombie, excessive gore, exaggerated poses, bright colors, anime style, childish, clean armor, pristine condition, modern elements',
          versions: JSON.stringify([
            {
              name: 'Battle',
              content: 'Undead knight in combat stance, cursed sword glowing with dark energy...'
            },
            {
              name: 'Meditation',
              content: 'Undead knight kneeling in contemplation before a ruined altar...'
            }
          ]),
          tags: ['characters', 'undead', 'knight', 'dark'],
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Pyromancer',
          emoji: '🔥',
          color: '#f97316',
          description: 'Generate images in the style of Elyra',
          content: 'Sorceress manipulating ancient fire, living flames dancing around her, amber eyes with fire reflections, ornate robes with fire motifs, hair seemingly merging with flames, staff with burning crystal, air charged with fire energy, floating fire particles, realistic style with fantastic elements. Style: High-end digital art with dynamic lighting effects.',
          category: 'characters',
          parameters: JSON.stringify({
            width: 1024,
            height: 1024,
            steps: 40,
            guidance: 7.5,
            sampler: 'DPM++ 2M Karras'
          }),
          negativePrompt: 'simple fire effects, basic flames, modern clothing, cartoon style, bad anatomy, deformed, anime, chibi, poorly drawn face, extra limbs, text, watermark, signature, simple background',
          versions: JSON.stringify([
            {
              name: 'Fire Ritual',
              content: 'Pyromancer performing ancient ritual, surrounded by circles of fire...'
            },
            {
              name: 'Combat',
              content: 'Pyromancer unleashing powerful fire spells in battle...'
            }
          ]),
          tags: ['characters', 'magic', 'fire', 'fantasy'],
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Abyssal Portal',
          emoji: '🕳️',
          color: '#1e293b',
          description: 'Generate images of Abyss rifts',
          content: 'Dimensional rift to the Abyss, swirling dark energies, impossible geometry, colors that defy comprehension, void crystals growing around, air distortions, shadowy beings barely visible in the depths, constantly shifting fractal patterns, unnatural lighting, dark hyperrealistic style. Style: Dark sci-fi fantasy with otherworldly elements.',
          category: 'locations',
          parameters: JSON.stringify({
            width: 1280,
            height: 768,
            steps: 45,
            guidance: 8.0,
            sampler: 'DPM++ SDE Karras'
          }),
          negativePrompt: 'simple hole, normal colors, regular patterns, cartoon style, anime, childish, clean edges, symmetrical, basic shapes, flat colors, lack of depth',
          versions: JSON.stringify([
            {
              name: 'Manifestation',
              content: 'Newly opened abyssal portal, dark energy violently emerging...'
            },
            {
              name: 'Ancient',
              content: 'Ancient stable abyssal portal, void crystals fully formed...'
            }
          ]),
          tags: ['locations', 'abyss', 'portal', 'dark'],
          featuredImage: null,
          isFavorite: false,
        },
        {
          name: 'Northern Lands',
          emoji: '❄️',
          color: '#d1d5db',
          description: 'Generate landscapes of the frozen north',
          content: 'Frozen wasteland with imposing snow-capped mountains, aurora borealis in night sky, ancient fortresses of stone and ice, frozen forests with frost-covered trees, steam geysers between ice, warriors with nordic furs and armor, epic realistic style with fantasy elements. Style: Winter fantasy with atmospheric lighting.',
          category: 'locations',
          parameters: JSON.stringify({
            width: 1280,
            height: 768,
            steps: 40,
            guidance: 7.5,
            sampler: 'Euler a'
          }),
          negativePrompt: 'simple snow, smooth ice, flat sky, modern buildings, urban elements, tropical elements, desert, summer, green vegetation, warm colors',
          versions: JSON.stringify([
            {
              name: 'Blizzard',
              content: 'Northern Lands during a fierce snowstorm, roaring winds...'
            },
            {
              name: 'Dawn',
              content: 'Northern Lands at dawn, rising sun reflecting on ice...'
            }
          ]),
          tags: ['locations', 'winter', 'landscape', 'fantasy'],
          featuredImage: null,
          isFavorite: false,
        }
      ];

      for (const promptData of promptsData) {
        const existingPrompt = await prisma.prompt.findFirst({
          where: { name: promptData.name }
        });

        if (!existingPrompt) {
          // Crear o conectar tags
          const tagConnections = await Promise.all(
            promptData.tags.map(async (tagName) => {
              const tag = await prisma.tag.upsert({
                where: { name: tagName },
                update: {},
                create: {
                  name: tagName,
                  emoji: '🏷️',
                  color: '#6b7280',
                  category: 'prompt'
                }
              });
              return { id: tag.id };
            })
          );

          const { tags, ...promptDataWithoutTags } = promptData;

          await prisma.prompt.create({
            data: {
              ...promptDataWithoutTags,
              tags: {
                connect: tagConnections
              }
            }
          });
        }
      }

      seedLogger.info('✅ Prompts creados correctamente');
    } else {
      seedLogger.warn('⚠️ La tabla Prompt no existe, omitiendo...');
    }
  } catch (error) {
    seedLogger.error('❌ Error creando prompts:', error);
    throw error;
  }
}
