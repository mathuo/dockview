jest.mock('resize-observer-polyfill', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })),
  }));