// 🎭 Mocks globales para Prisma Client
// Mock del cliente de Prisma para tests

const mockPrismaClient = {
	// 📁 Folder operations
	folder: {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		upsert: jest.fn(),
	},

	// 🖼️ Image operations
	image: {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		upsert: jest.fn(),
		deleteMany: jest.fn(),
	},

	// 🏷️ Tag operations
	tag: {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		upsert: jest.fn(),
	},

	// 📚 Album operations
	album: {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		upsert: jest.fn(),
	},

	// 🗂️ Collection operations
	collection: {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		upsert: jest.fn(),
	},

	// 🔗 Relations operations
	imageTag: {
		findMany: jest.fn(),
		create: jest.fn(),
		delete: jest.fn(),
		deleteMany: jest.fn(),
	},

	albumImage: {
		findMany: jest.fn(),
		create: jest.fn(),
		delete: jest.fn(),
		deleteMany: jest.fn(),
	},

	// 💾 Database operations
	$connect: jest.fn(),
	$disconnect: jest.fn(),
	$transaction: jest.fn((callback) => callback(mockPrismaClient)),
	$executeRaw: jest.fn(),
	$queryRaw: jest.fn(),

	// 🔄 Reset helper para tests
	$reset: () => {
		for (const model of Object.values(mockPrismaClient)) {
			if (typeof model === 'object' && model !== null) {
				for (const method of Object.values(model)) {
					if (jest.isMockFunction(method)) {
						method.mockReset();
					}
				}
			}
		}
	},
};

// Exportar una clase PrismaClient para simular `new PrismaClient()`
class MockPrismaClient {
	constructor() {
		Object.assign(this, mockPrismaClient);
	}
}

module.exports = {
	PrismaClient: MockPrismaClient,
	mockPrismaClient,
};
