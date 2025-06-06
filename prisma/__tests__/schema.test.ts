import fs from 'fs';

// 📑 Test para asegurar que todos los modelos existen en el schema de Prisma

describe('Prisma Schema', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const models = [
    'QueueJob',
    'Profile',
    'Settings',
    'Folder',
    'Image',
    'Video',
    'UploadedImage',
    'ImageStats',
    'Activity',
    'Group',
    'Album',
    'Collection',
    'Tag',
    'Property',
    'Wildcard',
    'Character',
    'Place',
    'WorldItem',
    'Concept',
    'Prompt',
    'Note',
  ];

  // 🗂️ Verificamos que cada modelo está definido en el archivo
  for (const model of models) {
    it(`contiene el modelo ${model}`, () => {
      expect(schema).toMatch(new RegExp(`model\\s+${model}\\s+{`));
    });
  }
});
