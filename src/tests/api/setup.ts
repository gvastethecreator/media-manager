import { prisma } from '@/lib/db';
import { watcherServer } from '@/services/watcher';

// Mock de prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    folder: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

// Mock del servidor watcher
jest.mock('@/services/watcher', () => ({
  watcherServer: {
    addPath: jest.fn(),
    removePath: jest.fn(),
    initialize: jest.fn(),
    stop: jest.fn()
  }
}));

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
  // Limpiar mocks específicos
  (prisma.folder.findUnique as jest.Mock).mockReset();
  (prisma.folder.update as jest.Mock).mockReset();
  (prisma.folder.findMany as jest.Mock).mockReset();
  (watcherServer.addPath as jest.Mock).mockReset();
  (watcherServer.removePath as jest.Mock).mockReset();
});

// Configuración global para pruebas de API
beforeAll(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
});