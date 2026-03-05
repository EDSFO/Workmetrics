import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next/image - return simple component
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: function MockImage(props) {
      // Return a simple img element as string for testing
      return `MockImage-${props.alt || 'image'}`;
    },
  };
});

// Mock window.location
delete window.location;
window.location = { href: '' };

// Global fetch mock
global.fetch = jest.fn();
