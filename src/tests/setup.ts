import '@testing-library/jest-dom'

// Simple fetch mock for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
})
