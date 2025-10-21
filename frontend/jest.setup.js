import '@testing-library/jest-dom'

// Mock Next.js router - create mock functions that can be overridden per test
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
}))

// Mock localStorage with actual storage behavior
let store = {};

const getItemMock = jest.fn((key) => store[key] || null);
const setItemMock = jest.fn((key, value) => {
  store[key] = value.toString();
});
const removeItemMock = jest.fn((key) => {
  delete store[key];
});
const clearMock = jest.fn(() => {
  store = {};
});

global.localStorage = {
  getItem: getItemMock,
  setItem: setItemMock,
  removeItem: removeItemMock,
  clear: clearMock,
  get length() {
    return Object.keys(store).length;
  },
  key: jest.fn((index) => {
    const keys = Object.keys(store);
    return keys[index] || null;
  }),
}

// Reset localStorage before each test
beforeEach(() => {
  store = {};
  getItemMock.mockClear();
  setItemMock.mockClear();
  removeItemMock.mockClear();
  clearMock.mockClear();
});

