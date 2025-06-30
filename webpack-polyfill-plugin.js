const webpack = require('webpack');

// Custom webpack plugin to inject polyfills for browser globals
class PolyfillPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('PolyfillPlugin', (compilation) => {
      // Inject polyfill banner to all chunks
      compilation.hooks.processAssets.tap(
        {
          name: 'PolyfillPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          const polyfillCode = `
// Injected polyfill for browser globals
if (typeof self === 'undefined') {
  try {
    if (typeof globalThis !== 'undefined') {
      globalThis.self = globalThis;
    } else if (typeof global !== 'undefined') {
      global.self = global;
    }
  } catch (e) {
    // Silently fail if we can't define self
  }
}
`;
          
          // Add polyfill to vendor chunks
          Object.keys(assets).forEach((assetName) => {
            if (assetName.includes('vendor') || assetName.includes('webpack')) {
              const asset = assets[assetName];
              const originalSource = asset.source();
              const newSource = polyfillCode + originalSource;
              
              // Use webpack's RawSource to create a proper asset
              const { sources } = webpack;
              assets[assetName] = new sources.RawSource(newSource);
            }
          });
        }
      );
    });
  }
}

module.exports = PolyfillPlugin;