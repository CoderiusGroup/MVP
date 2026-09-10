import "@testing-library/jest-dom";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

if (!("DOMMatrixReadOnly" in globalThis)) {
  class DOMMatrixReadOnlyMock {
    m22 = 1;
  }
  // @ts-expect-error jsdom non fornisce DOMMatrixReadOnly
  globalThis.DOMMatrixReadOnly = DOMMatrixReadOnlyMock;
}

Object.defineProperties(globalThis.HTMLElement.prototype, {
  offsetHeight: { configurable: true, get: () => 800 },
  offsetWidth: { configurable: true, get: () => 800 },
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
