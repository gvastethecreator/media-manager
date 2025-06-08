import { render, screen, waitFor } from '@testing-library/react';
import { CharactersView } from './characters-view';
import { renderWithProviders } from '@/tests/helpers/test-utils';

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

const setCurrentViewMock = jest.fn();
const selectCharacterMock = jest.fn();

jest.mock('@/app/actions/characters/character.actions', () => ({
  searchCharacters: jest.fn(),
}));
const { searchCharacters } = require('@/app/actions/characters/character.actions');
const searchCharactersMock = searchCharacters as jest.Mock;

jest.mock('@/app/actions/visual-config.actions', () => ({
  getCharacterVisualConfig: jest.fn(),
}));
const { getCharacterVisualConfig } = require('@/app/actions/visual-config.actions');
const getVisualConfigMock = getCharacterVisualConfig as jest.Mock;

jest.mock('@/components/navigation/navigation.store', () => ({
  useNavigationStore: () => ({ setCurrentView: setCurrentViewMock }),
}));

jest.mock('@/store/entities/character', () => ({
  useCharacterStore: () => ({ selectCharacter: selectCharacterMock }),
}));

jest.mock('@/components/cards/character-card', () => ({
  CharacterCard: ({ character, onClick }: any) => (
    <button type="button" data-testid="character-card" onClick={onClick}>
      {character.name}
    </button>
  ),
}));

const sampleCharacter = {
  id: 'c1',
  name: 'John Doe',
  color: '#f59e0b',
  updatedAt: new Date(),
  createdAt: new Date(),
  description: 'Hero',
  isFavorite: false,
  images: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('renderiza personajes cuando la búsqueda es exitosa', async () => {
  searchCharactersMock.mockResolvedValue([sampleCharacter]);
  getVisualConfigMock.mockResolvedValue({});

  renderWithProviders(<CharactersView />);

  await screen.findByTestId('character-card');
  expect(searchCharactersMock).toHaveBeenCalled();
  expect(screen.getByTestId('character-card')).toHaveTextContent('John Doe');
});

test('muestra estado vacío si no hay personajes', async () => {
  searchCharactersMock.mockResolvedValue([]);
  getVisualConfigMock.mockResolvedValue({});

  renderWithProviders(<CharactersView />);

  await screen.findByText('No hay personajes creados');
});

