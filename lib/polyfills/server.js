// Server-side polyfills for browser globals
// This file must be imported before any code that uses 'self'

// Check if we're in a server environment
if (typeof window === 'undefined') {
  // Define self as globalThis in server environment
  if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  
  if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
    global.self = global;
  }
}