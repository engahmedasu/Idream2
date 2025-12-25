const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

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

      // Production optimizations
      if (isProduction) {
        // Enable production mode optimizations
        webpackConfig.mode = 'production';
        
        // Optimize bundle size
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
        };

        // Remove source maps in production (optional - set to false if you want source maps)
        webpackConfig.devtool = false;
      } else if (isDevelopment) {
        // Development optimizations
        webpackConfig.mode = 'development';
        webpackConfig.devtool = 'eval-source-map';
      }

      return webpackConfig;
    },
  },
  babel: {
    plugins: [
      // Add any babel plugins here if needed
    ],
  },
};

