const withTM = require('next-transpile-modules')([
  '@radix-ui/react-dialog',
  '@radix-ui/react-tooltip',
  // add any other radix packages you use
]);

module.exports = withTM({
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
});
