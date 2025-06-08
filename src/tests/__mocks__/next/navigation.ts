// 🌐 Mock de Next.js navigation
// Mocks para next/navigation en Next.js 15

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockRefresh = jest.fn();
const mockPrefetch = jest.fn();

export const useRouter = jest.fn(() => ({
	push: mockPush,
	replace: mockReplace,
	back: mockBack,
	forward: mockForward,
	refresh: mockRefresh,
	prefetch: mockPrefetch,
}));

export const usePathname = jest.fn(() => '/');

export const useSearchParams = jest.fn(() => {
	return new URLSearchParams();
});

export const useParams = jest.fn(() => ({}));

export const notFound = jest.fn();

export const redirect = jest.fn();

export const permanentRedirect = jest.fn();

// 🧹 Helper para limpiar mocks
export const clearNavigationMocks = () => {
	mockPush.mockClear();
	mockReplace.mockClear();
	mockBack.mockClear();
	mockForward.mockClear();
	mockRefresh.mockClear();
	mockPrefetch.mockClear();
	useRouter.mockClear();
	usePathname.mockClear();
	useSearchParams.mockClear();
	useParams.mockClear();
	notFound.mockClear();
	redirect.mockClear();
	permanentRedirect.mockClear();
};

// 🎯 Exportar mocks para acceso directo en tests
export const navigationMocks = {
	push: mockPush,
	replace: mockReplace,
	back: mockBack,
	forward: mockForward,
	refresh: mockRefresh,
	prefetch: mockPrefetch,
};
