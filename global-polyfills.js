// Global polyfill to be loaded before any other code
// This must run in all environments to prevent 'self is not defined' errors

if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
}

if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
}

// For Edge Runtime compatibility
if (typeof window === 'undefined' && typeof self === 'undefined') {
  // Define self globally in server/edge environments
  if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
  } else if (typeof global !== 'undefined') {
    global.self = global;
  }
}