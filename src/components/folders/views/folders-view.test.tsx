import { render, screen, waitFor } from '@testing-library/react';
import { FoldersView } from './folders-view';
import { renderWithProviders } from '@/tests/helpers/test-utils';
import userEvent from '@testing-library/user-event';

beforeAll(() => {
  class MockObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-ignore
  global.IntersectionObserver = MockObserver;
});

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const deselectAllFilesMock = jest.fn();
const setCurrentFolderIdMock = jest.fn();
const setCurrentViewMock = jest.fn();

jest.mock('@/services/folder-service-export', () => ({
  folderService: { getFolders: jest.fn() },
}));
const { folderService } = require('@/services/folder-service-export');
const getFoldersMock = folderService.getFolders as jest.Mock;

jest.mock('@/store/entities/file', () => ({
  useFileStoreBase: (selector: any) => selector({ deselectAllFiles: deselectAllFilesMock }),
}));

jest.mock('@/store/entities/folder', () => ({
  useFolderStore: () => ({ coreActions: { fetchFolderById: setCurrentFolderIdMock, setCurrentFolder: jest.fn() } }),
}));

jest.mock('@/components/navigation/navigation.store', () => ({
  useNavigationStore: () => ({ setCurrentView: setCurrentViewMock }),
}));

jest.mock('@/components/cards/folder-card', () => ({
  FolderCard: ({ folder, onClick }: any) => (
    <button type="button" data-testid="folder-card" onClick={onClick}>
      {folder.name}
    </button>
  ),
}));

const sampleFolder = {
  id: '1',
  name: 'Test Folder',
  emoji: '📁',
  color: '#000',
  description: 'demo',
  path: '/demo',
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  totalFiles: 1,
  totalSize: 100,
  isFavorite: false,
  autoReindex: false,
  lastIndexed: new Date(),
  _count: { images: 1 },
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('muestra pantalla de carga y luego tarjetas de carpetas', async () => {
  getFoldersMock.mockResolvedValue([sampleFolder]);
  renderWithProviders(<FoldersView />);

  expect(screen.getByText('Cargando...')).toBeInTheDocument();
  await screen.findByTestId('folder-card');
  expect(getFoldersMock).toHaveBeenCalled();
  expect(screen.getByTestId('folder-card')).toHaveTextContent('Test Folder');
});

test('muestra estado vacío cuando no hay carpetas', async () => {
  getFoldersMock.mockResolvedValue([]);
  renderWithProviders(<FoldersView />);

  await screen.findByText('No hay carpetas indexadas');
});

