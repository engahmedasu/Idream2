module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and modify all source-map-loader rules to ignore node_modules
      if (webpackConfig.module && webpackConfig.module.rules) {
        webpackConfig.module.rules.forEach((rule) => {
          if (rule.enforce === 'pre') {
            // Check if this rule uses source-map-loader
            if (rule.use && Array.isArray(rule.use)) {
              const hasSourceMapLoader = rule.use.some(use => {
                const loader = typeof use === 'string' ? use : (use.loader || '');
                return loader.includes('source-map-loader');
              });

              if (hasSourceMapLoader) {
                // Exclude node_modules from source-map-loader
                rule.exclude = /node_modules/;
              }
            } else if (rule.use && typeof rule.use === 'object' && rule.use.loader) {
              if (rule.use.loader.includes('source-map-loader')) {
                rule.exclude = /node_modules/;
              }
            }
          }
        });
      }

      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = 'all';
    return devServerConfig;
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.testEnvironment = 'jsdom';
      // Ensure proper module resolution
      jestConfig.moduleDirectories = ['node_modules', '<rootDir>'];
      jestConfig.roots = ['<rootDir>/src'];
      // Ensure Jest can find modules
      if (!jestConfig.modulePaths) {
        jestConfig.modulePaths = ['<rootDir>'];
      }
      // Transform ES modules in node_modules (like axios)
      // This tells Jest to transform axios and react-router packages instead of ignoring them
      // The pattern uses negative lookahead to exclude these packages from being ignored
      jestConfig.transformIgnorePatterns = [
        'node_modules/(?!(axios|@react-router|react-router)/)',
      ];
      return jestConfig;
    },
  },
};

