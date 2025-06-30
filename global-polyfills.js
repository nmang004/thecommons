// Global polyfill to be loaded before any other code
// This must run in all environments to prevent 'self is not defined' errors

// Ensure self is defined in all environments
(function() {
  // Server/Node.js environment
  if (typeof window === 'undefined') {
    // Try globalThis first (modern Node.js)
    if (typeof globalThis !== 'undefined') {
      if (typeof globalThis.self === 'undefined') {
        Object.defineProperty(globalThis, 'self', {
          configurable: true,
          enumerable: false,
          writable: true,
          value: globalThis
        });
      }
    }
    // Fallback to global (older Node.js)
    else if (typeof global !== 'undefined') {
      if (typeof global.self === 'undefined') {
        Object.defineProperty(global, 'self', {
          configurable: true,
          enumerable: false,
          writable: true,
          value: global
        });
      }
    }
  }
  // Browser environment - ensure self points to window
  else if (typeof window !== 'undefined' && typeof self === 'undefined') {
    window.self = window;
  }
})();

// Also polyfill common browser globals for server environment
if (typeof window === 'undefined') {
  // Polyfill window for libraries that check for it
  if (typeof globalThis !== 'undefined' && typeof globalThis.window === 'undefined') {
    globalThis.window = undefined;
  }
  
  // Polyfill document for libraries that check for it
  if (typeof globalThis !== 'undefined' && typeof globalThis.document === 'undefined') {
    globalThis.document = undefined;
  }
}